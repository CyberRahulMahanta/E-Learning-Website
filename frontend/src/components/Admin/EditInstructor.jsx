import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../../config/api";

const EditInstructor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState("instructor");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const loadUser = async () => {
      setError("");
      try {
        const response = await fetch(`${API_URL}/users/get/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load user");
        }
        setRole(data?.user?.role || "instructor");
        setEmail(data?.user?.email || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API_URL}/users/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update role");
      }
      navigate("/admin/instructors");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white bg-black">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 text-white bg-black">
      <h2 className="mb-10 text-4xl">Update Role</h2>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 border rounded shadow-lg bg-stone-950 border-fuchsia-800"
      >
        {error && <p className="mb-3 text-red-500">{error}</p>}

        <label className="block mb-6">
          <span className="text-xl">Email</span>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full p-2 mt-2 text-gray-400 border border-white rounded cursor-not-allowed bg-stone-900"
          />
        </label>

        <label className="block mb-6">
          <span className="text-xl">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full p-2 mt-2 bg-black border border-white rounded text-white"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="flex justify-between">
          <button
            type="submit"
            className="px-5 py-2 text-white rounded bg-fuchsia-600 hover:bg-fuchsia-800"
          >
            Save Role
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/instructors")}
            className="px-5 py-2 text-white border border-white rounded hover:bg-stone-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditInstructor;
