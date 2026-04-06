import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading } = useAuth();

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setUserData((prev) => ({
        ...prev,
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError("");
    const payload = {
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      gender: userData.gender,
    };
    if (userData.password) payload.password = userData.password;

    const result = await updateProfile(payload);
    if (result.success) {
      alert("Profile updated successfully!");
      navigate("/profile");
    } else {
      setError(result.error || "Failed to update profile.");
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4 text-white"
      style={{
        background:
          "radial-gradient(circle at top center, #410640 5%, #000000 50%)",
      }}
    >
      <main className="w-full max-w-md p-8 mx-auto shadow-md bg-stone-900 rounded-xl">
        <h2 className="mb-8 text-3xl font-semibold text-center">Edit Profile</h2>

        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Full Name</label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleChange}
              className="w-full p-3 text-sm text-white border rounded-lg bg-stone-800 border-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              className="w-full p-3 text-sm text-white border rounded-lg bg-stone-800 border-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="password"
                value={userData.password}
                onChange={handleChange}
                className="w-full p-3 pr-16 text-sm text-white border rounded-lg bg-stone-800 border-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute text-xs text-gray-300 -translate-y-1/2 top-1/2 right-3 hover:text-white"
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Phone</label>
            <input
              type="tel"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              className="w-full p-3 text-sm text-white border rounded-lg bg-stone-800 border-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-300">Gender</label>
            <select
              name="gender"
              value={userData.gender}
              onChange={handleChange}
              className="w-full p-3 text-sm text-white border rounded-lg bg-stone-800 border-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          {error && <p className="text-center text-red-500">{error}</p>}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full px-4 py-3 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60"
          >
            Save Changes
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="w-full px-4 py-3 text-white bg-gray-600 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  );
}

export default EditProfile;
