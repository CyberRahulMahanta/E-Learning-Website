import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const AdminStudent = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [studentData, setStudentData] = useState([]);
  const [error, setError] = useState("");

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Courses", path: "/admin/courses" },
    { name: "Students", path: "/admin/students" },
    { name: "Instructors", path: "/admin/instructors" }
  ];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/getAllUser`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const users = res?.data?.users || [];
        setStudentData(users.filter((user) => user.role === "student"));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch students.");
      }
    };

    fetchStudents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/users/delete/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setStudentData((prev) => prev.filter((student) => String(student._id) !== String(id)));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete student.");
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
          {menuItems.map((item) => (
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

        <main className="flex-1 p-7 max-sm:p-4">
          <h2 className="text-4xl mb-9">Student List</h2>
          <div className="mb-5 text-xl">
            <span>Total Students: </span>
            <span className="font-bold">{studentData.length}</span>
          </div>

          {error && <p className="mb-4 text-red-400">{error}</p>}

          <section className="max-w-full overflow-x-auto border border-white border-solid rounded-lg bg-stone-950">
            <table className="min-w-full text-white table-auto">
              <thead className="bg-fuchsia-900 bg-opacity-20">
                <tr>
                  <th className="px-6 py-4 text-xl font-semibold text-left max-sm:text-sm">Student ID</th>
                  <th className="px-6 py-4 text-xl font-semibold text-left max-sm:text-sm">Student Name</th>
                  <th className="px-6 py-4 text-xl font-semibold text-left max-sm:text-sm">Email ID</th>
                  <th className="px-6 py-4 text-xl font-semibold text-left max-sm:text-sm">Phone</th>
                  <th className="px-6 py-4 text-xl font-semibold text-left max-sm:text-sm">Actions</th>
                </tr>
              </thead>

              <tbody>
                {studentData.map((student) => (
                  <tr key={student._id} className="border-t border-white">
                    <td className="px-6 py-4 text-base max-sm:text-sm">{student._id}</td>
                    <td className="px-6 py-4 text-base max-sm:text-sm">{student.username || "N/A"}</td>
                    <td className="px-6 py-4 text-base max-sm:text-sm">{student.email}</td>
                    <td className="px-6 py-4 text-base max-sm:text-sm">{student.phone || "N/A"}</td>
                    <td className="px-6 py-4 text-base max-sm:text-sm">
                      <div className="flex gap-3 max-sm:flex-col">
                        <button
                          className="px-4 py-2 text-sm text-white transition-colors rounded bg-stone-800 hover:bg-fuchsia-700 hover:text-black"
                          onClick={() => navigate(`/admin/students/edit/${student._id}`)}
                        >
                          Edit
                        </button>

                        <button
                          className="px-4 py-2 text-sm text-white transition-colors rounded bg-stone-800 hover:bg-fuchsia-700 hover:text-black"
                          onClick={() => handleDelete(student._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminStudent;
