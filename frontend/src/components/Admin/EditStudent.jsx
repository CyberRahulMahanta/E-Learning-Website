import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config/api";

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState({
    username: "",
    email: "",
    phone: "",
    gender: "",
    password: ""
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/get/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const fetchedStudent = res?.data?.user;

        setStudent({
          username: fetchedStudent?.username || "",
          email: fetchedStudent?.email || "",
          phone: fetchedStudent?.phone || "",
          gender: fetchedStudent?.gender || "",
          password: ""
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch student.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");
      const payload = {
        username: student.username,
        phone: student.phone,
        gender: student.gender
      };
      if (student.password.trim()) {
        payload.password = student.password;
      }

      await axios.put(`${API_URL}/users/update/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      navigate("/admin/students");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update student.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <p className="text-2xl">Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 text-white bg-black">
      <h2 className="mb-10 text-4xl">Edit Student</h2>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 border rounded shadow-lg bg-stone-950 border-fuchsia-800"
      >
        {error && <p className="mb-4 text-red-400">{error}</p>}

        <label className="block mb-4">
          <span className="text-xl">Username</span>
          <input
            type="text"
            name="username"
            value={student.username}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Email</span>
          <input
            type="email"
            name="email"
            value={student.email}
            readOnly
            className="w-full p-2 mt-2 text-gray-400 border border-white rounded cursor-not-allowed bg-stone-900"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">New Password</span>
          <input
            type="password"
            name="password"
            value={student.password}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
            placeholder="Leave blank to keep unchanged"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Phone</span>
          <input
            type="text"
            name="phone"
            value={student.phone}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-6">
          <span className="text-xl">Gender</span>
          <select
            name="gender"
            value={student.gender}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <div className="flex justify-between">
          <button
            type="submit"
            className="px-5 py-2 text-white rounded bg-fuchsia-600 hover:bg-fuchsia-800"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/students")}
            className="px-5 py-2 text-white border border-white rounded hover:bg-stone-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;
