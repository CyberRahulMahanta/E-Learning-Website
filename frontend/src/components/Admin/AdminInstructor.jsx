import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const AdminInstructor = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchInstructors = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/getAllUser`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }
      const users = data.users || [];
      setInstructors(users.filter((user) => user.role === "instructor"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this instructor?");
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/delete/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete instructor");
      }
      setInstructors((prev) => prev.filter((instructor) => String(instructor._id) !== String(id)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen text-white bg-black">
      <nav className="w-64 min-h-screen p-6 border-r bg-stone-950 border-fuchsia-900 max-sm:hidden">
        <div className="mb-10">
          <h2 className="text-3xl font-bold">
            Admin<span className="text-fuchsia-500">Panel</span>
          </h2>
        </div>
        <ul className="space-y-6">
          {[
            { name: "Dashboard", path: "/admin/dashboard" },
            { name: "Courses", path: "/admin/courses" },
            { name: "Students", path: "/admin/students" },
            { name: "Instructors", path: "/admin/instructors" }
          ].map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="block px-4 py-2 text-xl transition duration-200 rounded hover:bg-fuchsia-700 hover:text-black"
              >
                {item.name}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-xl text-left transition duration-200 rounded hover:bg-fuchsia-700 hover:text-black"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-center px-10 py-5 border-b border-solid bg-stone-950 border-b-fuchsia-900 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] max-sm:p-4">
          <h1 className="text-3xl font-bold text-white">
            <span>Code</span>
            <span className="text-fuchsia-500">Hub</span>
          </h1>
        </header>

        <div className="relative flex-1 p-8 max-sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-5xl text-white max-sm:text-4xl">Instructors</h1>
            <div className="flex gap-3">
              <button
                className="h-12 px-4 text-base text-white border rounded-lg border-fuchsia-700 bg-stone-900 hover:bg-fuchsia-700 hover:text-black"
                onClick={fetchInstructors}
              >
                Refresh
              </button>
              <button
                className="h-12 px-4 text-base text-white border rounded-lg border-fuchsia-700 bg-stone-900 hover:bg-fuchsia-700 hover:text-black"
                onClick={() => navigate("/admin/addinstructors")}
              >
                Promote User
              </button>
            </div>
          </div>

          {error && <p className="mb-4 text-red-400">{error}</p>}

          <div className="overflow-x-auto border border-white rounded-lg">
            <table className="w-full text-left bg-stone-950">
              <thead>
                <tr className="text-xl text-white bg-fuchsia-900 bg-opacity-20">
                  <th className="px-6 py-4">Instructor ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-6 py-4" colSpan={4}>Loading...</td></tr>
                ) : instructors.length === 0 ? (
                  <tr><td className="px-6 py-4" colSpan={4}>No instructors found.</td></tr>
                ) : (
                  instructors.map((instructor) => (
                    <tr
                      key={instructor._id}
                      className="transition-colors duration-200 border-t border-white hover:bg-stone-900"
                    >
                      <td className="px-6 py-4 text-base">{instructor._id}</td>
                      <td className="px-6 py-4 text-base">{instructor.username}</td>
                      <td className="px-6 py-4 text-base">{instructor.email}</td>
                      <td className="px-6 py-4 text-base">
                        <div className="flex gap-3">
                          <button
                            onClick={() => navigate(`/admin/editinstructor/${instructor._id}`)}
                            className="px-4 py-2 text-sm text-white transition-colors rounded bg-stone-800 hover:bg-fuchsia-700 hover:text-black"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(instructor._id)}
                            className="px-4 py-2 text-sm text-white transition-colors rounded bg-stone-800 hover:bg-red-600 hover:text-black"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInstructor;
