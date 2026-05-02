import React, { useEffect, useMemo, useState } from "react";
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const api = useApi();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [topCourses, setTopCourses] = useState([]);
  const [monthlyEnrollments, setMonthlyEnrollments] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const analyticsRes = await api.get("/analytics/dashboard", { headers });
        setStats(analyticsRes?.data?.stats || {});
        setTopCourses(analyticsRes?.data?.topCourses || []);
        setMonthlyEnrollments(analyticsRes?.data?.monthlyEnrollments || []);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Failed to load admin analytics.");
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

  const usersByRole = stats?.usersByRole || {};
  const maxMonthlyEnrollment = useMemo(
    () => monthlyEnrollments.reduce((max, item) => Math.max(max, Number(item.count || 0)), 0),
    [monthlyEnrollments]
  );

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Courses", path: "/admin/courses" },
    { name: "Students", path: "/admin/students" },
    { name: "Instructors", path: "/admin/instructors" },
    { name: "Payments", path: "/admin/payments" }
  ];

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
                <StatCard label="Students" value={Number(usersByRole.student || 0)} />
                <StatCard label="Instructors" value={Number(usersByRole.instructor || 0)} />
                <StatCard label="Admins" value={Number(usersByRole.admin || 0)} />
                <StatCard label="Total Courses" value={Number(stats?.courseCount || 0)} />
                <StatCard label="Enrollments" value={Number(stats?.enrollmentCount || 0)} />
                <StatCard label="Revenue (INR)" value={Number(stats?.paidRevenue || 0).toFixed(2)} />
                <StatCard label="Average Rating" value={Number(stats?.avgRating || 0).toFixed(2)} helper={`${Number(stats?.reviewCount || 0)} reviews`} />
                <StatCard label="Completion Rate" value={`${Number(stats?.completionRate || 0).toFixed(2)}%`} />
                <StatCard label="Active Quizzes" value={Number(stats?.quizCount || 0)} />
                <StatCard label="Active Assignments" value={Number(stats?.assignmentCount || 0)} />
                <StatCard label="Certificates" value={Number(stats?.certificateCount || 0)} />
                <StatCard label="Pending Reviews" value={Number(stats?.pendingAssignmentReviews || 0)} />
              </section>

              <section className="grid gap-6 mt-8 lg:grid-cols-2">
                <div className="p-5 border rounded-xl border-fuchsia-700 bg-stone-950">
                  <h3 className="text-xl font-semibold">Top Courses</h3>
                  {topCourses.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-400">No course analytics available yet.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm border border-stone-700">
                        <thead className="bg-black/50">
                          <tr>
                            <th className="p-2 text-left border border-stone-700">Course</th>
                            <th className="p-2 text-left border border-stone-700">Enrollments</th>
                            <th className="p-2 text-left border border-stone-700">Avg Progress</th>
                            <th className="p-2 text-left border border-stone-700">Completion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topCourses.map((course) => (
                            <tr key={course.id} className="hover:bg-black/40">
                              <td className="p-2 border border-stone-700">{course.name}</td>
                              <td className="p-2 border border-stone-700">{Number(course.enrollments || 0)}</td>
                              <td className="p-2 border border-stone-700">{Number(course.avgProgress || 0).toFixed(2)}%</td>
                              <td className="p-2 border border-stone-700">{Number(course.completionRate || 0).toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="p-5 border rounded-xl border-fuchsia-700 bg-stone-950">
                  <h3 className="text-xl font-semibold">Enrollments (Last 6 Months)</h3>
                  {monthlyEnrollments.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-400">No recent enrollment trend available.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {monthlyEnrollments.map((item) => {
                        const value = Number(item.count || 0);
                        const width = maxMonthlyEnrollment > 0 ? (value / maxMonthlyEnrollment) * 100 : 0;
                        return (
                          <div key={item.month}>
                            <div className="flex items-center justify-between text-sm">
                              <span>{item.month}</span>
                              <span>{value}</span>
                            </div>
                            <div className="w-full h-2 mt-1 rounded bg-stone-800">
                              <div className="h-2 rounded bg-fuchsia-600" style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
