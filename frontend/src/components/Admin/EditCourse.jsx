import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL, buildAssetUrl } from "../../config/api";

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState({
    name: "",
    title: "",
    instructor: "",
    price: "",
    originalPrice: "",
    batchDate: "",
    language: "",
    totalContentHours: "",
    learnButtonText: "",
    imageFile: null,
    imageUrl: ""
  });
  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [courseResponse, usersResponse] = await Promise.all([
          axios.get(`${API_URL}/courses/get/${courseId}`),
          axios.get(`${API_URL}/users/getAllUser`, { headers })
        ]);

        const fetchedCourse = courseResponse?.data?.course;
        const users = usersResponse?.data?.users || [];

        setCourse({
          name: fetchedCourse?.name || "",
          title: fetchedCourse?.title || "",
          instructor: String(fetchedCourse?.instructorId || fetchedCourse?.instructor?._id || ""),
          price: fetchedCourse?.price ?? "",
          originalPrice: fetchedCourse?.originalPrice ?? "",
          batchDate: fetchedCourse?.batchDate ?? "",
          language: fetchedCourse?.language ?? "",
          totalContentHours: fetchedCourse?.totalContentHours ?? "",
          learnButtonText: fetchedCourse?.learnButtonText ?? "",
          imageFile: null,
          imageUrl: fetchedCourse?.image || ""
        });
        setInstructors(users.filter((user) => user.role === "instructor"));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch course.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCourse((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0] || null;
    setCourse((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");

    if (!course.name || !course.price || !course.instructor) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", course.name);
      formData.append("title", course.title || course.name);
      formData.append("price", course.price);
      formData.append("originalPrice", course.originalPrice);
      formData.append("batchDate", course.batchDate);
      formData.append("language", course.language);
      formData.append("totalContentHours", course.totalContentHours);
      formData.append("learnButtonText", course.learnButtonText);
      formData.append("instructorId", course.instructor);
      if (course.imageFile) {
        formData.append("image", course.imageFile);
      }

      await axios.post(`${API_URL}/courses/edit/${courseId}`, formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      navigate("/admin/courses");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update course.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <p className="text-2xl">Loading course data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 text-white bg-black">
      <h2 className="mb-10 text-4xl">Edit Course</h2>
      <form
        onSubmit={handleSave}
        className="w-full max-w-md p-8 border rounded shadow-lg bg-stone-950 border-fuchsia-800"
      >
        {error && <p className="mb-4 text-red-400">{error}</p>}

        <label className="block mb-4">
          <span className="text-xl">Course Name</span>
          <input
            type="text"
            name="name"
            value={course.name}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Title</span>
          <input
            type="text"
            name="title"
            value={course.title}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Instructor</span>
          <select
            name="instructor"
            value={course.instructor}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          >
            <option value="">Select Instructor</option>
            {instructors.map((instructor) => (
              <option key={instructor._id} value={instructor._id}>
                {instructor.username || instructor.email}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          <span className="text-xl">Price</span>
          <input
            type="number"
            name="price"
            value={course.price}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Original Price</span>
          <input
            type="number"
            name="originalPrice"
            value={course.originalPrice}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Batch Date</span>
          <input
            type="text"
            name="batchDate"
            value={course.batchDate}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Language</span>
          <input
            type="text"
            name="language"
            value={course.language}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Total Content Hours</span>
          <input
            type="text"
            name="totalContentHours"
            value={course.totalContentHours}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xl">Learn Button Text</span>
          <input
            type="text"
            name="learnButtonText"
            value={course.learnButtonText}
            onChange={handleChange}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
        </label>

        <label className="block mb-6">
          <span className="text-xl">Upload Course Image</span>
          <input
            type="file"
            onChange={handleImageUpload}
            className="w-full p-2 mt-2 bg-black border border-white rounded"
          />
          {course.imageUrl && (
            <div className="mt-4">
              <img
                src={buildAssetUrl(course.imageUrl)}
                alt="Course Preview"
                className="object-cover w-32 h-32 rounded"
              />
            </div>
          )}
        </label>

        <div className="flex justify-between">
          <button
            type="submit"
            className="px-5 py-2 text-white rounded bg-fuchsia-600 hover:bg-fuchsia-800"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/courses")}
            className="px-5 py-2 text-white border border-white rounded hover:bg-stone-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourse;
