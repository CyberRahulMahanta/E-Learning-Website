import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./UnifiedNavbar";
import Loader from "./Loader";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";
import { buildAssetUrl } from "../config/api";

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    fetchCourseById,
    getCourseById,
    fetchCourseContent,
    fetchCourseReviews,
    toggleWishlist,
    submitReview,
    isLoading,
    error
  } = useCourses();

  const [contentModules, setContentModules] = useState([]);
  const [fullAccess, setFullAccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const course = getCourseById(courseId);
  const userState = useMemo(() => course?.userState || {}, [course?.userState]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      await fetchCourseById(courseId);
      const [contentResponse, reviewResponse] = await Promise.all([
        fetchCourseContent(courseId),
        fetchCourseReviews(courseId, { page: 1, limit: 8 })
      ]);

      if (!active) return;
      setContentModules(contentResponse?.modules || []);
      setFullAccess(!!contentResponse?.fullAccess);
      setReviews(reviewResponse?.reviews || []);
      setReviewStats(reviewResponse?.stats || null);
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId, fetchCourseById, fetchCourseContent, fetchCourseReviews]);

  useEffect(() => {
    setWishlisted(!!userState?.wishlisted);
  }, [userState?.wishlisted]);

  if (isLoading && !course) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <Loader />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <h1 className="text-4xl">Course not found</h1>
      </div>
    );
  }

  const tags = Array.isArray(course.tags) ? course.tags : [];
  const hasRoadmap = Boolean(course.roadmap);
  const hasSyllabus = Array.isArray(course.syllabus) && course.syllabus.length > 0;
  const displayPrice = Number(course.displayPrice || course.price || 0);
  const originalPrice = Number(course.originalPrice || course.price || 0);
  const progressPercent = Number(userState?.progress?.progressPercent || 0);
  const hasCertificate = Boolean(userState?.certificate || progressPercent >= 100);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const result = await toggleWishlist(courseId);
    if (result.success) {
      setWishlisted(!!result.wishlisted);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!userState?.enrolled) {
      return;
    }
    setIsSubmittingReview(true);
    const result = await submitReview(courseId, {
      rating: reviewRating,
      review: reviewText
    });
    if (result.success) {
      setReviewText("");
      const reviewResponse = await fetchCourseReviews(courseId, { page: 1, limit: 8 });
      setReviews(reviewResponse?.reviews || []);
      setReviewStats(reviewResponse?.stats || null);
    }
    setIsSubmittingReview(false);
  };

  return (
    <>
      <div
        className="flex items-center justify-center min-h-screen px-6 text-white"
        style={{
          background: "radial-gradient(circle at top center, #410640 5%, #000000 50%)"
        }}
      >
        <Navbar />
        <section className="flex flex-col items-center">
          <h2 className="mt-20 text-center text-white text-6xl max-md:text-4xl">
            {course.title || course.name}
          </h2>
          {course.subtitle && (
            <h3 className="mt-6 text-center text-white text-3xl max-md:text-2xl">
              {course.subtitle}
            </h3>
          )}

          {course.description && (
            <p className="max-w-4xl mt-10 text-2xl text-center text-white max-md:text-xl">
              {course.description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-5 justify-center mt-20 w-full max-w-[1222px] text-2xl">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="px-10 py-4 border-2 border-fuchsia-700 border-solid bg-stone-950 rounded-[50px] text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-24 mx-auto w-full max-w-[1238px] px-6">
        <div className="flex gap-8 max-md:flex-col">
          <div className="w-3/5 max-md:w-full">
            <article className="w-full px-px pt-px pb-12 mx-auto border border-solid rounded-xl border-fuchsia-700 bg-stone-950">
              <img
                loading="lazy"
                src={buildAssetUrl(course.image)}
                alt="Course preview"
                className="object-cover w-full rounded-md aspect-[1.89]"
              />
              <div className="flex flex-wrap gap-3.5 mt-14 ml-4 text-2xl text-white">
                <span className="grow px-8 py-4 border-2 border-fuchsia-700 border-solid bg-stone-950 rounded-[50px] w-fit">
                  Language: {course.language || "English"}
                </span>
                <div className="px-6 pt-3.5 pb-8 text-2xl text-white border-2 border-fuchsia-700 border-solid bg-stone-950 rounded-[50px]">
                  Total Content: {course.totalContentHours || "150+"}
                  <br /> Hours
                </div>
              </div>
            </article>
          </div>

          <aside className="flex flex-col items-start self-stretch w-2/5 my-auto text-white max-md:w-full">
            <h3 className="self-stretch text-4xl">
              Price Rs.{displayPrice.toLocaleString("en-IN")}
              {originalPrice > displayPrice && (
                <span className="ml-3 text-2xl text-white line-through">
                  Rs.{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </h3>
            <p className="mt-2.5 text-xl">Limited Time Discount Applied!</p>
            <button
              className="px-4 py-1.5 mt-5 text-3xl text-white rounded-2xl border border-fuchsia-500 border-solid bg-fuchsia-950 bg-opacity-80 hover:bg-opacity-100 transition-colors"
              onClick={() => navigate(`/courses/${courseId}/payment`)}
            >
              Buy Now
            </button>
            <p className="mt-2.5 text-base">
              Batch Starts on <span className="text-[#A60AA3]">{course.batchDate || "Soon"}</span>
            </p>

            <button
              className="px-4 py-1.5 mt-12 text-3xl text-white rounded-2xl border border-fuchsia-500 border-solid bg-fuchsia-950 bg-opacity-80 hover:bg-opacity-100 transition-colors"
              onClick={() => window.open(course.youtubeUrl || "#", "_blank")}
            >
              {course.learnButtonText || "Learn Free"}
            </button>

            <button
              className={`px-4 py-1.5 mt-4 text-xl text-white rounded-2xl border border-fuchsia-500 border-solid transition-colors ${wishlisted ? "bg-fuchsia-700" : "bg-fuchsia-950 bg-opacity-80 hover:bg-opacity-100"}`}
              onClick={handleWishlistToggle}
            >
              {wishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>

            {userState?.enrolled && (
              <>
                <div className="w-full mt-6">
                  <p className="text-sm text-gray-300">Course Progress: {progressPercent.toFixed(2)}%</p>
                  <div className="w-full h-2 mt-2 overflow-hidden rounded bg-stone-800">
                    <div
                      className="h-2 bg-fuchsia-600"
                      style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                    />
                  </div>
                </div>
                <button
                  className="px-4 py-1.5 mt-4 text-xl text-white rounded-2xl border border-green-500 border-solid bg-green-900 bg-opacity-80 hover:bg-opacity-100 transition-colors"
                  onClick={() => navigate(`/courses/${courseId}/syllabus`)}
                >
                  Continue Learning
                </button>
                {hasCertificate && (
                  <button
                    className="px-4 py-1.5 mt-4 text-xl text-white rounded-2xl border border-green-400 border-solid bg-green-700 bg-opacity-90 hover:bg-opacity-100 transition-colors"
                    onClick={() => navigate(`/courses/${courseId}/certificate`)}
                  >
                    View Certificate
                  </button>
                )}
              </>
            )}
          </aside>
        </div>
      </section>

      <section className="flex flex-col items-center w-full">
        <hr className="self-stretch w-full mt-20 border border-fuchsia-700 min-h-px" />
        <h2 className="mt-16 text-transparent text-7xl max-md:text-4xl bg-gradient-to-t from-purple-200 to-purple-800 bg-clip-text">
          Zero To Job-Ready
        </h2>
        <p className="text-transparent text-5xl max-md:text-3xl bg-gradient-to-t from-purple-200 to-purple-800 bg-clip-text">
          in 7 months*
        </p>

        {hasRoadmap && (
          <>
            <h3 className="mt-20 text-4xl text-transparent max-md:text-3xl bg-gradient-to-t from-purple-200 to-blue-800 bg-clip-text">
              What you will learn
            </h3>
            <img
              loading="lazy"
              src={buildAssetUrl(course.roadmap)}
              alt="Course curriculum overview"
              className="object-contain mt-10 w-full rounded-none aspect-[10.99] max-w-[1216px]"
            />
          </>
        )}

        {hasSyllabus && (
          <>
            <h2 className="text-white mt-14 text-7xl max-md:text-4xl">Syllabus</h2>
            <p className="mt-2.5 text-3xl text-white max-md:text-2xl">
              Dominate. From <span className="text-[#A60AA3]">Start</span> to Victory.
            </p>
            <button
              className="px-10 py-6 mt-12 max-w-full text-2xl text-white border border-fuchsia-600 border-solid bg-fuchsia-900 bg-opacity-10 rounded-[101px] w-[365px] hover:bg-opacity-20 transition-colors"
              onClick={() => navigate(`/courses/${courseId}/syllabus`)}
            >
              View Complete Syllabus
            </button>
          </>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            className="px-8 py-3 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
            onClick={() => navigate(`/courses/${courseId}/quizzes`)}
          >
            Course Quizzes
          </button>
          <button
            className="px-8 py-3 text-white rounded-lg bg-stone-800 hover:bg-stone-700"
            onClick={() => navigate(`/courses/${courseId}/assignments`)}
          >
            Course Assignments
          </button>
        </div>

        {error && (
          <p className="mt-8 text-red-400">{error}</p>
        )}
      </section>

      <section className="w-full px-6 py-16 text-white bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold">Course Content</h2>
          <p className="mt-2 text-gray-300">
            {fullAccess ? "You have full access to all lessons." : "Preview mode: enroll to unlock all lessons."}
          </p>

          <div className="grid gap-6 mt-8">
            {contentModules.length === 0 ? (
              <p className="text-gray-400">Content will be updated soon.</p>
            ) : (
              contentModules.map((module) => (
                <div key={module.id} className="p-5 border rounded-xl border-fuchsia-700 bg-stone-950">
                  <h3 className="text-2xl font-semibold">{module.title}</h3>
                  {module.description && (
                    <p className="mt-2 text-gray-300">{module.description}</p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {(module.lessons || []).map((lesson) => (
                      <li key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-900">
                        <span>{lesson.title}</span>
                        <span className="text-sm text-gray-300">
                          {lesson.lessonType}
                          {lesson.isPreview ? " | Preview" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="w-full px-6 py-16 text-white bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold">Reviews</h2>
          <p className="mt-2 text-gray-300">
            Average rating: {Number(reviewStats?.avgRating || course?.avgRating || 0).toFixed(1)} / 5
            {" "}({reviewStats?.reviewCount ?? course?.reviewCount ?? 0} reviews)
          </p>

          <div className="grid gap-6 mt-8 lg:grid-cols-2">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-400">No reviews yet.</p>
              ) : (
                reviews.map((review) => (
                  <article key={review.id} className="p-4 border rounded-xl border-fuchsia-700 bg-black">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{review.user?.username || "Student"}</h3>
                      <span className="text-fuchsia-400">{review.rating}/5</span>
                    </div>
                    <p className="mt-2 text-gray-300">{review.review || "No written feedback."}</p>
                  </article>
                ))
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="p-5 border rounded-xl border-fuchsia-700 bg-black">
              <h3 className="text-2xl font-semibold">Write a Review</h3>
              <p className="mt-2 text-sm text-gray-300">
                {userState?.enrolled ? "Share your learning experience." : "Enroll to submit a review."}
              </p>
              <label className="block mt-4">
                <span className="text-sm">Rating</span>
                <select
                  className="w-full p-3 mt-2 text-white border rounded-lg bg-stone-900 border-fuchsia-700"
                  value={reviewRating}
                  onChange={(event) => setReviewRating(Number(event.target.value))}
                  disabled={!userState?.enrolled || isSubmittingReview}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Very Poor</option>
                </select>
              </label>
              <label className="block mt-4">
                <span className="text-sm">Review</span>
                <textarea
                  className="w-full h-32 p-3 mt-2 text-white border rounded-lg resize-none bg-stone-900 border-fuchsia-700"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  disabled={!userState?.enrolled || isSubmittingReview}
                  placeholder="Write your feedback here..."
                />
              </label>
              <button
                type="submit"
                disabled={!userState?.enrolled || isSubmittingReview}
                className="px-5 py-3 mt-4 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default CoursePage;
