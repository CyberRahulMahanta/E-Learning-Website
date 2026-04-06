import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const InstructorStudents = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/courses/instructor/${user._id || user.id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load courses");
        }
        setCourses(data.courses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white bg-black">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-white bg-black">{error}</div>;
  }

  return (
    <div className="flex min-h-screen text-white bg-black">
      <aside className="w-64 p-6 border-r bg-stone-950 border-fuchsia-900 max-sm:hidden">
        <h2 className="mb-8 text-2xl font-bold">Instructor</h2>
        <nav className="space-y-4">
          {[
            { name: "Dashboard", path: "/instructor/dashboard" },
            { name: "Courses", path: "/instructor/courses" },
            { name: "Students", path: "/instructor/students" },
            { name: "Quiz Checks", path: "/instructor/quiz-checks" },
            { name: "Profile", path: "/instructor/profile" }
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block px-3 py-2 rounded hover:bg-fuchsia-700"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold">My Students</h1>
        {courses.length === 0 ? (
          <p>No courses yet. Add a course to see enrollments.</p>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course._id || course.id} className="p-4 border rounded border-fuchsia-700 bg-stone-950">
                <h2 className="text-xl font-semibold">{course.name}</h2>
                <p className="mt-1 text-sm text-gray-300">
                  Enrolled students: {course.enrollment_count || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InstructorStudents;
