import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select a role.");
      return;
    }

    try {
      const result = await login(email, password, role);
      
      if (result.success) {
        navigate(result.redirectPath || "/");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen text-white">
      <header className="flex justify-between items-center px-10 py-5 border-b border-solid bg-stone-950 border-b-fuchsia-900 shadow-[0_4px_10px_rgba(0,0,0,0.20)]">
        <h1 className="text-3xl font-bold">
          <span>Code</span>
          <span className="text-purple-900">Hub</span>
        </h1>
        <div className="flex items-center gap-4">
          <nav className="hidden space-x-10 text-lg lg:flex">
            <Link to="/" className="text-white transition hover:text-fuchsia-500">Home</Link>
            <Link to="/course" className="text-white transition hover:text-fuchsia-500">Course</Link>
            <Link to="/about" className="text-white transition hover:text-fuchsia-500">About</Link>
          </nav>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-semibold text-white transition rounded-full border border-fuchsia-700 hover:bg-fuchsia-700"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="flex justify-center pt-20">
        <form onSubmit={handleSubmit} className="relative flex justify-center">
          <div className="absolute bg-fuchsia-700 blur-[50px] h-[220px] top-[80px] w-[200px] z-[1]" />
          <div className="relative px-0 py-14 border border-fuchsia-700 shadow-[0_4px_400px_#000] w-[500px] z-[2] rounded-2xl max-sm:px-4 max-sm:py-6 max-sm:w-[85%]">
            <h2 className="mb-4 text-3xl font-semibold text-center">Login</h2>

            <div className="flex flex-col items-center w-full gap-6">
              <Input
                type="email"
                placeholder="Email Id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </Select>

              <div className="relative w-[80%] max-w-[300px]">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-4 py-2 w-full text-xl rounded-full border border-fuchsia-700 bg-stone-950 h-[50px] max-sm:text-lg max-sm:h-[40px] text-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute transform -translate-y-1/2 right-4 top-1/2"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-6-10-6s2.388-3.332 6.132-5.261M15 12a3 3 0 11-6 0 3 3 0 016 0zm5.618 5.618A9.956 9.956 0 0022 13s-2.388-3.332-6.132-5.261M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="mt-4 text-center text-red-500">{error}</p>}

            <Button
              type="submit"
              className="mx-auto mt-6 text-2xl rounded-full border border-fuchsia-700 bg-stone-950 bg-opacity-90 h-[50px] w-[140px] max-sm:text-xl max-sm:h-[40px] max-sm:w-[110px] hover:bg-fuchsia-900"
            >
              Login
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`px-4 py-2 w-[80%] max-w-[300px] text-xl rounded-full border border-fuchsia-700 bg-stone-950 h-[50px] max-sm:text-lg max-sm:h-[40px] mx-auto block text-white ${className}`}
    {...props}
  />
);

const Select = ({ className = "", children, ...props }) => (
  <select
    className={`px-4 py-2 w-[80%] max-w-[300px] text-xl rounded-full border border-fuchsia-700 bg-stone-950 h-[50px] max-sm:text-lg max-sm:h-[40px] mx-auto block text-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Button = ({ children, className = "", ...props }) => (
  <button className={`flex justify-center items-center text-white cursor-pointer ${className}`} {...props}>
    {children}
  </button>
);

export default Login;

