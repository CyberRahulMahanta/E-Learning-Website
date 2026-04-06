import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, buildAssetUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const InstructorCourses = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/courses/instructor/${user._id || user.id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch courses");
        }
        setCourses(data.courses || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchCourses();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/courses/delete/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete course");
      }
      setCourses((prev) => prev.filter((course) => String(course._id || course.id) !== String(id)));
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
            Instructor<span className="text-fuchsia-500">Panel</span>
          </h2>
        </div>

        <ul className="space-y-6">
          {[
            { name: "Dashboard", path: "/instructor/dashboard" },
            { name: "My Courses", path: "/instructor/courses" },
            { name: "Students", path: "/instructor/students" },
            { name: "Quiz Checks", path: "/instructor/quiz-checks" }
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
          <h2 className="text-4xl mb-9">My Courses</h2>
          {error && <p className="mb-4 text-red-400">{error}</p>}

          <div className="border border-white border-solid rounded-lg bg-stone-950 max-sm:overflow-x-auto">
            <div className="bg-fuchsia-900 bg-opacity-20 grid px-4 py-2 border-b border-solid border-b-white grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr] max-md:p-2 max-md:text-sm max-sm:min-w-[900px]">
              <div className="p-2 text-xl text-white">ID</div>
              <div className="p-2 text-xl text-white">Image</div>
              <div className="p-2 text-xl text-white">Course Name</div>
              <div className="p-2 text-xl text-white">Price</div>
              <div className="p-2 text-xl text-white">Students</div>
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
                      className="w-16 h-16 rounded object-cover"
                    />
                  </div>
                  <div className="p-2 text-base text-white">{course.name}</div>
                  <div className="p-2 text-base text-white">{course.price}</div>
                  <div className="p-2 text-base text-white">{course.enrollment_count || 0}</div>
                  <div className="flex items-center p-2 text-base text-white">
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 text-sm text-white transition-colors rounded bg-fuchsia-700 hover:bg-fuchsia-600"
                        onClick={() => navigate(`/instructor/courses/${courseId}/content`)}
                      >
                        Content
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

export default InstructorCourses;
