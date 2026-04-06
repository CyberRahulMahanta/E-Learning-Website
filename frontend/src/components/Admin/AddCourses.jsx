import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

const AddCourse = () => {
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState({
    slug: "",
    name: "",
    title: "",
    titleHighlight: "",
    titleSuffix: "",
    subtitle: "",
    description: "",
    instructor: "",
    price: "",
    originalPrice: "",
    batchDate: "",
    language: "Hindi",
    totalContentHours: "150+",
    image: null,
    tags: "",
    roadmap: "",
    youtubeUrl: "",
    learnButtonText: "Learn Free"
  });

  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Please log in as admin.");
        }

        const response = await fetch(`${API_URL}/users/getAllUser`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch instructors");
        }

        const users = data.users || [];
        setInstructors(users.filter((user) => user.role === "instructor"));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "image") {
      setCourseData((prev) => ({ ...prev, image: files?.[0] || null }));
      return;
    }
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!courseData.instructor) {
      setError("Please select an instructor.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please log in as admin.");
      }

      const formData = new FormData();
      formData.append("slug", courseData.slug);
      formData.append("name", courseData.name);
      formData.append("title", courseData.title);
      formData.append("titleHighlight", courseData.titleHighlight);
      formData.append("titleSuffix", courseData.titleSuffix);
      formData.append("subtitle", courseData.subtitle);
      formData.append("description", courseData.description);
      formData.append("roadmap", courseData.roadmap);
      formData.append("youtubeUrl", courseData.youtubeUrl);
      formData.append("learnButtonText", courseData.learnButtonText);
      formData.append("tags", courseData.tags);
      formData.append("instructorId", courseData.instructor);
      formData.append("price", courseData.price);
      formData.append("originalPrice", courseData.originalPrice);
      formData.append("batchDate", courseData.batchDate);
      formData.append("language", courseData.language);
      formData.append("totalContentHours", courseData.totalContentHours);
      if (courseData.image) {
        formData.append("image", courseData.image);
      }

      const response = await fetch(`${API_URL}/courses/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Failed to add course.");
      }

      navigate("/admin/courses");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 text-white bg-black">
      <div className="w-full max-w-2xl p-8 border rounded-lg shadow-lg border-fuchsia-700 bg-stone-950">
        <h2 className="mb-6 text-3xl font-bold text-center">
          Add <span className="text-fuchsia-500">New Course</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          {error && (
            <div className="p-3 text-sm text-red-300 border border-red-500 rounded bg-red-950">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-lg">Slug *</label>
              <input
                type="text"
                name="slug"
                value={courseData.slug}
                onChange={handleChange}
                required
                className="w-full p-3 text-black bg-white rounded"
                placeholder="web-dev-cohort"
              />
            </div>
            <div>
              <label className="block mb-2 text-lg">Course Name *</label>
              <input
                type="text"
                name="name"
                value={courseData.name}
                onChange={handleChange}
                required
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-lg">Title *</label>
              <input
                type="text"
                name="title"
                value={courseData.title}
                onChange={handleChange}
                required
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
            <div>
              <label className="block mb-2 text-lg">Title Highlight</label>
              <input
                type="text"
                name="titleHighlight"
                value={courseData.titleHighlight}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-lg">Title Suffix</label>
              <input
                type="text"
                name="titleSuffix"
                value={courseData.titleSuffix}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
            <div>
              <label className="block mb-2 text-lg">Subtitle</label>
              <input
                type="text"
                name="subtitle"
                value={courseData.subtitle}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg">Description</label>
            <textarea
              name="description"
              value={courseData.description}
              onChange={handleChange}
              className="w-full p-3 text-black bg-white rounded min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-lg">Instructor *</label>
              <select
                name="instructor"
                value={courseData.instructor}
                onChange={handleChange}
                required
                className="w-full p-3 text-black bg-white rounded"
                disabled={loading}
              >
                <option value="">{loading ? "Loading instructors..." : "Select Instructor"}</option>
                {instructors.map((instructor) => (
                  <option key={instructor._id} value={instructor._id}>
                    {instructor.username || instructor.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-lg">Course Price (INR)</label>
              <input
                type="number"
                name="price"
                value={courseData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-lg">Original Price (INR)</label>
              <input
                type="number"
                name="originalPrice"
                value={courseData.originalPrice}
                onChange={handleChange}
                min="0"
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
            <div>
              <label className="block mb-2 text-lg">Batch Date</label>
              <input
                type="text"
                name="batchDate"
                value={courseData.batchDate}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
                placeholder="21st May, 25"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={courseData.tags}
              onChange={handleChange}
              className="w-full p-3 text-black bg-white rounded"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-lg">Roadmap Image URL</label>
              <input
                type="text"
                name="roadmap"
                value={courseData.roadmap}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
            <div>
              <label className="block mb-2 text-lg">YouTube URL</label>
              <input
                type="text"
                name="youtubeUrl"
                value={courseData.youtubeUrl}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-lg">Language</label>
              <input
                type="text"
                name="language"
                value={courseData.language}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
                placeholder="Hindi"
              />
            </div>
            <div>
              <label className="block mb-2 text-lg">Total Content Hours</label>
              <input
                type="text"
                name="totalContentHours"
                value={courseData.totalContentHours}
                onChange={handleChange}
                className="w-full p-3 text-black bg-white rounded"
                placeholder="150+"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg">Learn Button Text</label>
            <input
              type="text"
              name="learnButtonText"
              value={courseData.learnButtonText}
              onChange={handleChange}
              className="w-full p-3 text-black bg-white rounded"
            />
          </div>

          <div>
            <label className="block mb-2 text-lg">Course Image *</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              required
              className="w-full p-3 text-white rounded bg-stone-900 file:bg-fuchsia-700 file:border-none file:px-4 file:py-2 file:cursor-pointer"
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/courses")}
              className="px-6 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white rounded bg-fuchsia-700 hover:bg-fuchsia-800"
            >
              Save Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;
