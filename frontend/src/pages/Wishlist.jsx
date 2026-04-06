import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/UnifiedNavbar";
import Loader from "../components/Loader";
import { useCourses } from "../context/CourseContext";
import { buildAssetUrl } from "../config/api";

const Wishlist = () => {
  const navigate = useNavigate();
  const { getWishlist, toggleWishlist } = useCourses();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await getWishlist();
      setItems(Array.isArray(data) ? data : []);
      setIsLoading(false);
    };
    load();
  }, [getWishlist]);

  const handleRemove = async (courseId) => {
    setActionLoadingId(courseId);
    const result = await toggleWishlist(courseId);
    if (result.success) {
      const fresh = await getWishlist();
      setItems(Array.isArray(fresh) ? fresh : []);
    }
    setActionLoadingId(null);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pt-32 pb-16 text-white bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-3xl font-bold">Wishlist</h1>
            <p className="text-gray-300">Courses you saved for later.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center border rounded-xl border-fuchsia-700 bg-stone-950">
              <p className="text-lg">Your wishlist is empty.</p>
              <button
                className="px-5 py-2 mt-4 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
                onClick={() => navigate("/course")}
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {items.map((item) => {
                const course = item.course || {};
                const identifier = course.slug || course.id || course._id;
                return (
                  <article
                    key={item.id || item._id || identifier}
                    className="flex gap-4 p-4 border rounded-xl border-fuchsia-700 bg-stone-950"
                  >
                    <img
                      src={buildAssetUrl(course.image)}
                      alt={course.name || "Course"}
                      className="object-cover w-32 h-24 rounded-lg"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">{course.name || "Untitled Course"}</h2>
                      <p className="mt-1 text-sm text-gray-300 line-clamp-2">{course.description || "No description available."}</p>
                      <p className="mt-2 text-sm text-fuchsia-300">
                        Added on {item.wishlistedAt ? new Date(item.wishlistedAt).toLocaleDateString() : "N/A"}
                      </p>
                      <div className="flex gap-3 mt-4">
                        <button
                          className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
                          onClick={() => navigate(`/courses/${identifier}`)}
                        >
                          View Course
                        </button>
                        <button
                          className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-stone-800 hover:bg-stone-700"
                          disabled={actionLoadingId === identifier}
                          onClick={() => handleRemove(identifier)}
                        >
                          {actionLoadingId === identifier ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Wishlist;
