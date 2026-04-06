import React from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import Navbar from "../components/UnifiedNavbar";
import { useCourses } from "../context/CourseContext";
import { buildAssetUrl } from "../config/api";

const Courses = () => {
  const navigate = useNavigate();
  const { courses, isLoading: loading, error } = useCourses();

  return (
    <>
      {/* Unified Navbar - automatically handles auth state */}
      <Navbar />
      
      <div
        className="flex items-center justify-center min-h-screen px-6 text-white"
        style={{
          background: "radial-gradient(circle at top center, #410640 5%, #000000 50%)",
        }}
      >
        <section className="mb-32 text-center max-md:mt-10">
          <h2 className="text-white text-8xl max-md:text-4xl">
            We're not a <span className="text-[#A60AA3]">course</span> <br />
            <span className="text-[#A60AA3]">factory.</span>
          </h2>
          <p className="mt-6 text-4xl text-white">
            We focus on courses that really help.
          </p>
        </section>
      </div>

      <section className="flex flex-col items-center w-full px-6 max-md:px-5 max-md:mt-6">
        <div className="w-full min-h-screen px-6 pb-20 text-white bg-black">
          <div className="mt-32 mb-10 text-left">
            <h2 className="text-4xl font-bold text-white">Courses That Work</h2>
            <p className="mt-2 text-lg text-gray-400">
              Our best-in-class courses, now at your fingertips.
            </p>
          </div>

          {loading && <Loader />}
          {error && <p className="text-xl text-center text-red-500">{error}</p>}

          {!loading && !error && (
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
          )}
        </div>
      </section>
    </>
  );
};

export default Courses;

