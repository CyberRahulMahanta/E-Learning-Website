import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildAssetUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";

const AdminCourse = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses");
        setCourses(response?.data?.courses || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch courses");
      }
    };

    fetchCourses();
  }, [api]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this course?");
    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/courses/delete/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setCourses((prev) => prev.filter((course) => String(course._id || course.id) !== String(id)));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete course.");
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

        <main className="flex-1 p-7 max-sm:p-4">
          <h2 className="text-4xl mb-9">Course List</h2>

          <button
            className="mb-8 h-16 text-xl text-white border rounded-lg border-fuchsia-700 border-solid cursor-pointer bg-stone-950 w-[228px] max-sm:w-full hover:bg-fuchsia-700"
            onClick={() => navigate("/admin/addcourses")}
          >
            Add new Courses
          </button>

          {error && <p className="mb-4 text-red-400">{error}</p>}

          <div className="border border-white border-solid rounded-lg bg-stone-950 max-sm:overflow-x-auto">
            <div className="bg-fuchsia-900 bg-opacity-20 grid px-4 py-2 border-b border-solid border-b-white grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr] max-md:p-2 max-md:text-sm max-sm:min-w-[900px]">
              <div className="p-2 text-xl text-white">ID</div>
              <div className="p-2 text-xl text-white">Image</div>
              <div className="p-2 text-xl text-white">Course Name</div>
              <div className="p-2 text-xl text-white">Instructor</div>
              <div className="p-2 text-xl text-white">Price</div>
              <div className="p-2 text-xl text-white">Actions</div>
            </div>

            {courses.map((course) => {
              const courseId = course._id || course.id;
              return (
                <div
                  key={courseId}
                  className="grid px-4 py-2 border-b border-solid border-b-white grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr] max-md:p-2 max-md:text-sm max-sm:min-w-[900px] hover:bg-stone-900"
                >
                  <div className="p-2 text-base text-white">{courseId}</div>
                  <div className="p-2">
                    <img
                      src={buildAssetUrl(course.image)}
                      alt="Course"
                      className="object-cover w-16 h-16 rounded"
                    />
                  </div>
                  <div className="p-2 text-base text-white">{course.name}</div>
                  <div className="p-2 text-base text-white">
                    {course.instructor?.username || course.instructor?.email || "N/A"}
                  </div>
                  <div className="p-2 text-base text-white">{course.price}</div>
                  <div className="flex items-center p-2 text-base text-white">
                    <div className="flex gap-3">
                      <button
                        className="px-4 py-2 text-sm text-white transition-colors rounded bg-fuchsia-700 hover:bg-fuchsia-600"
                        onClick={() => navigate(`/admin/courses/${courseId}/content`)}
                      >
                        Content
                      </button>
                      <button
                        className="px-4 py-2 text-sm text-white transition-colors rounded bg-stone-800 hover:bg-fuchsia-700 hover:text-black"
                        onClick={() => navigate(`/admin/editcourse/${courseId}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-4 py-2 text-sm text-white transition-colors rounded bg-stone-800 hover:bg-red-600 hover:text-black"
                        onClick={() => handleDelete(courseId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminCourse;
