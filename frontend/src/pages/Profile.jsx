import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import profile from "/images/profile.png";
import Navbar from "../components/UnifiedNavbar";
import { useAuth } from "../context/AuthContext";
import useApi from "../hooks/useApi";

function Profile() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const api = useApi();
  const [stats, setStats] = useState({
    orders: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const loadStats = async () => {
      if (!isAuthenticated) return;
      try {
        const token = localStorage.getItem("token");
        const [ordersRes, notificationsRes] = await Promise.all([
          api.get("/users/orders", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/notifications/list?unread=true", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const orderCount = ordersRes?.data?.orders?.length || 0;
        const unreadCount = notificationsRes?.data?.notifications?.length || 0;
        setStats({
          orders: orderCount,
          unreadNotifications: unreadCount
        });
      } catch {
        // Non-blocking: profile remains usable even if stats APIs are unavailable.
      }
    };
    loadStats();
  }, [api, isAuthenticated]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-6 text-white"
      style={{
        background: "radial-gradient(circle at top center, #410640 5%, #000000 50%)"
      }}
    >
      <Navbar />
      <main className="w-full min-h-screen py-12">
        <section className="relative max-w-[500px] mx-auto bg-stone-900 p-10 rounded-lg shadow-md mt-12">
          <div className="flex items-center gap-8">
            <img
              src={user?.profile_image || user?.profileImage || profile}
              alt="Profile"
              className="w-[110px] h-[110px] rounded-full border-4 border-fuchsia-700 object-cover"
            />
            <div className="text-white">
              <h2 className="text-3xl">Profile</h2>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl text-fuchsia-500">Personal Details</h3>
            <div className="grid grid-cols-2 gap-6 mt-4 text-white">
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <div className="p-4 text-lg border rounded-lg bg-stone-800 border-fuchsia-700">
                  {user?.username || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Email</label>
                <div className="p-4 text-lg border rounded-lg bg-stone-800 border-fuchsia-700">
                  {user?.email || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Password</label>
                <div className="p-4 text-lg border rounded-lg bg-stone-800 border-fuchsia-700">
                  ******
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Phone</label>
                <div className="p-4 text-lg border rounded-lg bg-stone-800 border-fuchsia-700">
                  {user?.phone || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 border rounded-lg bg-stone-800 border-fuchsia-700">
              <p className="text-sm text-gray-400">Total Orders</p>
              <p className="mt-1 text-2xl font-semibold">{stats.orders}</p>
            </div>
            <div className="p-4 border rounded-lg bg-stone-800 border-fuchsia-700">
              <p className="text-sm text-gray-400">Unread Notifications</p>
              <p className="mt-1 text-2xl font-semibold">{stats.unreadNotifications}</p>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate("/editprofile")}
              className="px-10 py-3 text-white transition rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
            >
              Edit
            </button>

            <button
              className="px-10 py-3 text-white transition rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;
