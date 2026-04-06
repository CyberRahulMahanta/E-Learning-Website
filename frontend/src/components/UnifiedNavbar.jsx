import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import profileImg from "/images/profile.png";
import { buildAssetUrl } from "../config/api";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
const navigate = useNavigate();
  const { isAuthenticated, logout, isLoading, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setIsOpen(false);
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 z-50 w-full border-b shadow-lg bg-stone-950 border-fuchsia-900">
        <div className="container flex items-center justify-between px-6 py-4 mx-auto lg:px-12">
          <h1 className="text-3xl font-bold text-white">
            <span>Code</span>
            <span className="text-fuchsia-500">Hub</span>
          </h1>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b shadow-lg bg-stone-950 border-fuchsia-900">
      <div className="container flex items-center justify-between px-6 py-4 mx-auto lg:px-12">
        <Link to="/" className="text-3xl font-bold text-white">
          <span>Code</span>
          <span className="text-fuchsia-500">Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden space-x-10 text-lg lg:flex">
          <Link to="/" className="text-white transition hover:text-fuchsia-500">Home</Link>
          <Link to="/course" className="text-white transition hover:text-fuchsia-500">Course</Link>
          <Link to="/about" className="text-white transition hover:text-fuchsia-500">About</Link>
          {isAuthenticated && (
            <>
              <Link to="/my-courses" className="text-white transition hover:text-fuchsia-500">My Courses</Link>
              <Link to="/wishlist" className="text-white transition hover:text-fuchsia-500">Wishlist</Link>
            </>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="items-center hidden gap-4 lg:flex">
{isAuthenticated ? (
            <>
              <Link to="/profile">
                <img src={buildAssetUrl(user?.profile_image) || profileImg} alt="Profile" className="w-10 h-10 border border-white rounded-full object-cover" />
              </Link>
            </>
          ) : (

            <>
              <button 
                className="px-5 py-2 text-white transition rounded-full bg-fuchsia-700 hover:bg-fuchsia-600" 
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="text-white lg:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav className={`absolute top-full left-0 w-full bg-stone-950 py-6 transition-all duration-300 ${isOpen ? "block" : "hidden"}`}>
        <div className="flex flex-col items-center gap-6">
          <Link to="/" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/course" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>Course</Link>
          <Link to="/about" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>About</Link>
          {isAuthenticated && (
            <>
              <Link to="/my-courses" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>My Courses</Link>
              <Link to="/wishlist" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>Wishlist</Link>
            </>
          )}
          
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>Profile</Link>
              <button 
                className="px-5 py-2 text-white transition rounded-full bg-fuchsia-700 hover:bg-fuchsia-600"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              <button 
                className="px-5 py-2 text-white transition rounded-full bg-fuchsia-700 hover:bg-fuchsia-600" 
                onClick={() => { navigate("/login"); setIsOpen(false); }}
              >
                Login
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

