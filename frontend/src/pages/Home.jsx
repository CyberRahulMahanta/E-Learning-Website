import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCourses } from "../context/CourseContext";
import Navbar from "../components/UnifiedNavbar";
import { buildAssetUrl } from "../config/api";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { courses, isLoading, error } = useCourses();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at top center, #410640 5%, #000000 15%)",
      }}
    >
      {/* Unified Navbar - automatically handles auth state */}
      <Navbar />
      {/* Main Heading */}
      <div className="text-center font-semibold leading-tight space-y-4 mt-[120px]">
        <p className="font-bold lg:text-7xl md:text-5xl text-8xl">
          We only <span className="text-fuchsia-500 text-8xl">teach</span>
        </p>
        <p className="text-4xl font-bold lg:text-8xl md:text-5xl">
          what we are really really
        </p>
        <p className="text-4xl font-bold lg:text-8xl md:text-5xl">
          good at. Get
        </p>
      </div>

      {/* Image and Text Side by Side */}
      <div className="flex flex-col items-center justify-center gap-10 mt-20 md:flex-row">
        <div className="flex-shrink-0">
          <img
            className="h-[30rem] mt-20 ml-10"
            src="/images/Group132.png"
            alt="Illustration"
          />
        </div>
        <div className="items-center justify-center text-center">
          <h1 className="h-10 m-10 text-4xl font-bold">
            Trusted by <span className="text-fuchsia-500">2M+</span> students
          </h1>
          <p className="m-10 text-3xl mt-14">
            Expand your skills{" "}
            <span className="text-fuchsia-500">with our trusted platform,</span>{" "}
            chosen by millions worldwide.
          </p>
        </div>
      </div>

      {/* Mentorship Programs Section */}
      <div className="items-center justify-center mt-32 text-center">
        <h1 className="text-6xl">Mentorship Programs</h1>
        <p className="mt-5 text-3xl">
          Choose your program, get certified, and grab new career opportunities.
        </p>
      </div>

      {/* Buttons Section */}
      <div className="flex flex-wrap justify-between px-10 mt-24 gap-28">
        {["Web Development", "Cyber Security", "App Development"].map(
          (label) => (
            <button
              key={label}
              className="px-8 py-4 text-3xl text-white transition border-2 rounded-full border-fuchsia-500 hover:text-fuchsia-500"
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Web Dev Cohort Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-black p-10 rounded-2xl shadow-lg mt-20 w-[90%] gap-16">
        <div className="space-y-6 lg:w-1/2">
          <span className="px-4 py-2 text-lg font-semibold text-white rounded-full bg-fuchsia-800 border-bl">
            Web Dev Cohort
          </span>
          <h1 className="text-4xl font-bold">
            Master full-stack web development with Web Dev Cohort -{" "}
            <span className="text-fuchsia-500">Live 1.0</span>
          </h1>
          <p className="text-gray-300 text-1xl">
            Learn HTML, CSS, JS, React, Next.js, Node, Docker, databases like
            MongoDB/PostgreSQL, DevOps with AWS (ECR, EC2, CloudFront), modern
            workflows like Turbo Repo, TypeScript, and GitHub CI/CD.
          </p>
          <button
            className="px-5 py-2 text-xl font-semibold text-white transition rounded-full bg-fuchsia-900 hover:bg-fuchsia-500"
            onClick={() => navigate(isAuthenticated ? "/course" : "/login")}
          >
            Join now
          </button>
        </div>
        <div className="mt-10 lg:w-1/2 lg:mt-0">
          <img
            className="m-10"
            src="/images/Group133.png"
            alt="Web Dev Cohort"
          />
        </div>
      </div>

      {/* Company Logos Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-black p-10 rounded-2xl shadow-lg mt-4 w-[90%]">
        <div className="text-left">
          <h1 className="text-5xl font-bold">
            Companies Where Our{" "}
            <span className="text-fuchsia-500">Students Work</span>
          </h1>
        </div>
        <div className="flex justify-center">
          <img
            src="/images/Group134.png"
            alt="Company Logos"
            className="max-w-full"
          />
        </div>
      </div>

      {/* Courses Section */}
      <section className="flex flex-col items-center w-full px-6 max-md:px-5 max-md:mt-6">
        <div className="w-full min-h-screen px-6 pb-20 text-white bg-black">
          <div className="mt-32 mb-10 text-left">
            <h2 className="text-4xl font-bold text-white">Courses That Work</h2>
            <p className="mt-2 text-lg text-gray-400">
              Our best-in-class courses, now at your fingertips.
            </p>
          </div>

          {isLoading && (
            <p className="text-2xl text-center text-white">Loading courses...</p>
          )}
          {error && <p className="text-xl text-center text-red-500">{error}</p>}

          <div className="grid w-full grid-cols-1 gap-10 ml-16 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course._id || course.id || course.slug}
                className="flex flex-col justify-between h-full p-5 transition duration-300 border rounded-lg shadow-md bg-stone-950 border-fuchsia-700 hover:scale-105 w-80"
              >
                <img
                  src={buildAssetUrl(course.image || course.imageUrl)}
                  alt={course.name}
                  className="object-cover w-full h-48 rounded"
                />

                <h3 className="flex items-center justify-center mt-4 text-xl font-semibold text-white">{course.name}</h3>

                <div className="flex items-center justify-center mt-2">
                  <span className="px-3 py-1 text-sm text-white rounded-full bg-fuchsia-900">
                    Instructor: {course.instructor?.username || course.instructor?.name || course.instructor?.email || "N/A"}
                  </span>
                </div>
                <div className="flex justify-center items-center gap-4 mt-3.5">
                  <span className="px-3 py-1 text-base text-white border border-solid rounded-md bg-fuchsia-950 bg-opacity-60 border-stone-900">
                    HINDI
                  </span>
                </div>

                <div className="flex justify-between gap-5 mt-auto">
                  <div className="flex flex-col">
                    <span className="mt-4 text-base text-white">Limited Time Discount</span>
                    <p className="mt-4 text-lg text-white">
                      ₹{course.price}{" "}
                      <span className="ml-2 text-gray-400 line-through">
                        ₹{course.originalPrice || course.price * 2}
                      </span>
                    </p>
                  </div>
                  <span className="self-end px-3 py-1 text-base text-white border border-solid rounded-md bg-fuchsia-950 bg-opacity-60 border-stone-900">50% OFF</span>
                </div>

                <button
                  className="w-full px-6 py-2 mt-4 text-lg font-medium text-white border rounded bg-fuchsia-800 hover:bg-fuchsia-600"
                  onClick={() => navigate(`/courses/${course.slug || course._id}`)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
