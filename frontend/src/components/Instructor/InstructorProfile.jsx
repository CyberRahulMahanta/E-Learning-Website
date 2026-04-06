import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { buildAssetUrl } from "../../config/api";

const InstructorProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
            { name: "Quiz Checks", path: "/instructor/quiz-checks" },
            { name: "Profile", path: "/instructor/profile" }
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
        <header className="flex items-center justify-center px-10 py-5 border-b bg-stone-950 border-b-fuchsia-900 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] max-sm:p-4">
          <h1 className="text-3xl font-bold text-white">
            <span>Code</span>
            <span className="text-fuchsia-500">Hub</span>
          </h1>
        </header>

        <main className="flex-1 p-7 max-sm:p-4">
          <h2 className="text-4xl mb-9">Profile</h2>
          <div className="max-w-2xl p-8 border rounded-lg shadow-lg border-fuchsia-700 bg-stone-950">
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full border border-fuchsia-700 overflow-hidden">
                <img
                  src={buildAssetUrl(user?.profile_image) || "/images/profile.png"}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-3xl font-bold text-white">{user?.username || "Instructor"}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-300">Email</label>
                <p className="mt-1 text-xl">{user?.email || "N/A"}</p>
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-300">Phone</label>
                <p className="mt-1 text-xl">{user?.phone || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <Link
                  to="/instructor/dashboard"
                  className="px-6 py-3 text-center text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-800 transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 text-center text-white rounded-lg bg-gray-600 hover:bg-gray-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InstructorProfile;
