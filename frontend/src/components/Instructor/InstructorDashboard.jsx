import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";

const StatCard = ({ label, value, helper = "" }) => (
  <div className="p-4 border rounded-xl border-fuchsia-700 bg-stone-950">
    <p className="text-xs tracking-wide text-gray-300 uppercase">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {helper ? <p className="mt-1 text-xs text-gray-400">{helper}</p> : null}
  </div>
);

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const api = useApi();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [coursePerformance, setCoursePerformance] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const analyticsRes = await api.get("/analytics/dashboard", { headers });
        setStats(analyticsRes?.data?.stats || {});
        setCoursePerformance(analyticsRes?.data?.coursePerformance || []);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Failed to load instructor analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [api]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/instructor/dashboard" },
    { name: "My Courses", path: "/instructor/courses" },
    { name: "Students", path: "/instructor/students" },
    { name: "Quiz Checks", path: "/instructor/quiz-checks" }
  ];

  return (
    <div className="flex min-h-screen text-white bg-black">
      <nav className="w-64 min-h-screen p-6 border-r bg-stone-950 border-fuchsia-900 max-sm:hidden">
        <div className="mb-10">
          <h2 className="text-3xl font-bold">
            Instructor<span className="text-fuchsia-500">Panel</span>
          </h2>
        </div>
        <ul className="space-y-6">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link to={item.path} className="block px-4 py-2 text-xl transition rounded hover:bg-fuchsia-700 hover:text-black">
                {item.name}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-xl text-left transition rounded hover:bg-fuchsia-700 hover:text-black"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-center px-10 py-5 border-b bg-stone-950 border-b-fuchsia-900">
          <h1 className="text-3xl font-bold text-white">
            <span>Code</span>
            <span className="text-fuchsia-500">Hub</span>
          </h1>
        </header>

        <main className="flex-1 p-7 max-sm:p-4">
          <h2 className="mb-6 text-4xl">Dashboard</h2>
          {isLoading ? <p>Loading analytics...</p> : null}
          {error ? <p className="mb-4 text-red-400">{error}</p> : null}

          {!isLoading && !error && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Courses" value={Number(stats?.courseCount || 0)} />
                <StatCard label="Enrollments" value={Number(stats?.enrollmentCount || 0)} />
                <StatCard label="Average Rating" value={Number(stats?.avgRating || 0).toFixed(2)} />
                <StatCard label="Active Learners" value={Number(stats?.activeLearners || 0)} />
                <StatCard label="Completion Rate" value={`${Number(stats?.completionRate || 0).toFixed(2)}%`} />
                <StatCard label="Pending Reviews" value={Number(stats?.pendingAssignmentReviews || 0)} />
                <StatCard label="Certificates Issued" value={Number(stats?.certificateCount || 0)} />
              </section>

              <section className="p-5 mt-8 border rounded-xl border-fuchsia-700 bg-stone-950">
                <h3 className="text-xl font-semibold">Course Performance</h3>
                {coursePerformance.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-400">No performance data available yet.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm border border-stone-700">
                      <thead className="bg-black/50">
                        <tr>
                          <th className="p-2 text-left border border-stone-700">Course</th>
                          <th className="p-2 text-left border border-stone-700">Enrollments</th>
                          <th className="p-2 text-left border border-stone-700">Avg Progress</th>
                          <th className="p-2 text-left border border-stone-700">Completed Learners</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coursePerformance.map((course) => (
                          <tr key={course.id} className="hover:bg-black/40">
                            <td className="p-2 border border-stone-700">{course.name}</td>
                            <td className="p-2 border border-stone-700">{Number(course.enrollments || 0)}</td>
                            <td className="p-2 border border-stone-700">{Number(course.avgProgress || 0).toFixed(2)}%</td>
                            <td className="p-2 border border-stone-700">{Number(course.completedCount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default InstructorDashboard;
