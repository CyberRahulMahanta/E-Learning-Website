import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import profileImg from "/images/profile.png";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { buildAssetUrl } from "../config/api";

const AuthNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b shadow-lg bg-stone-950 border-fuchsia-900">
      <div className="container flex items-center justify-between px-6 py-4 mx-auto lg:px-12">
        <h1 className="text-3xl font-bold text-white">
          <span>Code</span>
          <span className="text-fuchsia-500">Hub</span>
        </h1>

        <nav className="hidden space-x-10 text-lg lg:flex">
          <Link to="/" className="text-white transition hover:text-fuchsia-500">Home</Link>
          <Link to="/course" className="text-white transition hover:text-fuchsia-500">Course</Link>
          <Link to="/about" className="text-white transition hover:text-fuchsia-500">About</Link>
        </nav>

        <div className="items-center hidden gap-6 lg:flex">
          <Link to="/profile">
<img src={buildAssetUrl(user?.profile_image) || profileImg} alt="Profile" className="w-10 h-10 border border-white rounded-full object-cover" />

          </Link>
        </div>

        <button className="text-white lg:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <nav className={`absolute top-full left-0 w-full bg-stone-950 py-6 transition-all duration-300 ${isOpen ? "block" : "hidden"}`}>
        <div className="flex flex-col items-center gap-6">
          <Link to="/" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/course" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>Course</Link>
          <Link to="/about" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>About</Link>
          <Link to="/profile" className="text-white transition hover:text-fuchsia-500" onClick={() => setIsOpen(false)}>Profile</Link>
        </div>
      </nav>
    </header>
  );
};

export default AuthNavbar;
