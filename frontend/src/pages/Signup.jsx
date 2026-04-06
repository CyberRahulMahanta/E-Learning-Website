import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi";

const Signup = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    gender: "Male",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/auth/signup", {
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone,
        gender: form.gender,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_rgba(0,0,0,1)_42%)]">
      <header className="flex items-center justify-between px-6 py-5 border-b border-fuchsia-900 bg-stone-950/95 shadow-[0_4px_10px_rgba(0,0,0,0.20)] sm:px-10">
        <Link to="/" className="text-3xl font-bold">
          <span>Code</span>
          <span className="text-fuchsia-500">Hub</span>
        </Link>
        <Link
          to="/login"
          className="px-4 py-2 text-sm font-semibold text-white transition rounded-full border border-fuchsia-700 hover:bg-fuchsia-700"
        >
          Login
        </Link>
      </header>

      <main className="flex items-center justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl border border-fuchsia-700/70 rounded-3xl bg-stone-950/90 shadow-[0_0_120px_rgba(168,85,247,0.18)] backdrop-blur p-6 sm:p-10"
        >
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-semibold">Create account</h1>
            <p className="mt-3 text-sm text-gray-300 sm:text-base">
              Register to start learning and tracking your courses.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Your name"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10 digit phone number"
            />
            <label className="flex flex-col gap-2 text-sm font-medium">
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="h-[52px] rounded-full border border-fuchsia-700 bg-stone-950 px-4 text-white outline-none focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
            />
            <Field
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
            />
          </div>

          {error && <p className="mt-5 text-sm text-center text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center w-full h-12 mt-8 text-lg font-semibold text-white transition rounded-full bg-fuchsia-700 hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>

          <p className="mt-6 text-sm text-center text-gray-300">
            Already have an account?{" "}
            <Link to="/login" className="text-fuchsia-400 hover:text-fuchsia-300">
              Login here
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

const Field = ({ label, className = "", ...props }) => (
  <label className="flex flex-col gap-2 text-sm font-medium">
    {label}
    <input
      {...props}
      className={`h-[52px] rounded-full border border-fuchsia-700 bg-stone-950 px-4 text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-fuchsia-500 ${className}`}
    />
  </label>
);

export default Signup;