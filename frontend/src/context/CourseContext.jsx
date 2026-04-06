import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useApi from "../hooks/useApi";

const CourseContext = createContext(null);

export const CourseProvider = ({ children }) => {
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get("/courses");
      const apiCourses = response?.data?.courses || [];
      setCourses(apiCourses);
      return apiCourses;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load courses.";
      setError(message);
      setCourses([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const getCourseById = useCallback((courseId) => {
    if (!courseId) {
      return null;
    }

    if (currentCourse) {
      const sameAsCurrent = String(currentCourse._id) === String(courseId) ||
        String(currentCourse.id) === String(courseId) ||
        String(currentCourse.slug) === String(courseId);
      if (sameAsCurrent) {
        return currentCourse;
      }
    }

    return courses.find((course) =>
      String(course._id) === String(courseId) ||
      String(course.id) === String(courseId) ||
      String(course.slug) === String(courseId)
    ) || null;
  }, [courses, currentCourse]);

  const fetchCourseById = useCallback(async (courseId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/courses/${courseId}`);
      const apiCourse = response?.data?.course || null;
      setCurrentCourse(apiCourse);

      if (apiCourse) {
        setCourses((prev) => {
          const existingIdx = prev.findIndex((course) =>
            String(course._id) === String(apiCourse._id) ||
            String(course.id) === String(apiCourse.id)
          );
          if (existingIdx === -1) {
            return [apiCourse, ...prev];
          }
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...apiCourse };
          return updated;
        });
      }

      return apiCourse;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load course.";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const enrollInCourse = useCallback(async (courseId, { paymentMethod = "unknown", transactionId } = {}) => {
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/courses/${courseId}/enroll`,
        { paymentMethod, transactionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return { success: true, data: response.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to enroll in course.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const getEnrolledCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response?.data?.courses || [];
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load enrolled courses.";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const getWishlist = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users/wishlist", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const items = response?.data?.wishlist || [];
      setWishlist(items);
      return items;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load wishlist.";
      setError(message);
      return [];
    }
  }, [api]);

  const fetchCourseQuizzes = useCallback(async (courseId) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/courses/${courseId}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return {
        success: true,
        quizzes: response?.data?.quizzes || [],
        courseId: response?.data?.courseId || null,
        courseSlug: response?.data?.courseSlug || null
      };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load quizzes.";
      setError(message);
      return { success: false, quizzes: [], error: message };
    }
  }, [api]);

  const attemptQuiz = useCallback(async (quizId, answers) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/quizzes/${quizId}/attempt`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, attempt: response?.data?.attempt || null };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to submit quiz.";
      setError(message);
      return { success: false, attempt: null, error: message };
    }
  }, [api]);

  const fetchCourseAssignments = useCallback(async (courseId) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/courses/${courseId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return {
        success: true,
        assignments: response?.data?.assignments || [],
        courseId: response?.data?.courseId || null,
        courseSlug: response?.data?.courseSlug || null
      };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load assignments.";
      setError(message);
      return { success: false, assignments: [], error: message };
    }
  }, [api]);

  const createCourseQuiz = useCallback(async (courseId, payload) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/courses/${courseId}/quizzes`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, quiz: response?.data?.quiz || null };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to create quiz.";
      setError(message);
      return { success: false, quiz: null, error: message };
    }
  }, [api]);

  const createCourseAssignment = useCallback(async (courseId, payload) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/courses/${courseId}/assignments`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, assignment: response?.data?.assignment || null };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to create assignment.";
      setError(message);
      return { success: false, assignment: null, error: message };
    }
  }, [api]);

  const submitAssignment = useCallback(async (assignmentId, payload) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/assignments/${assignmentId}/submit`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, submission: response?.data?.submission || null };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to submit assignment.";
      setError(message);
      return { success: false, submission: null, error: message };
    }
  }, [api]);

  const toggleWishlist = useCallback(async (courseId) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/courses/${courseId}/wishlist`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await getWishlist();
      return {
        success: true,
        wishlisted: !!response?.data?.wishlisted
      };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to update wishlist.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api, getWishlist]);

  const submitReview = useCallback(async (courseId, { rating, review }) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/courses/${courseId}/reviews`,
        { rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response?.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to submit review.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const fetchCourseReviews = useCallback(async (courseId, { page = 1, limit = 10 } = {}) => {
    setError(null);
    try {
      const response = await api.get(`/courses/${courseId}/reviews?page=${page}&limit=${limit}`);
      return {
        reviews: response?.data?.reviews || [],
        stats: response?.data?.stats || null,
        pagination: response?.data?.pagination || null
      };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load reviews.";
      setError(message);
      return { reviews: [], stats: null, pagination: null, error: message };
    }
  }, [api]);

  const fetchCourseContent = useCallback(async (courseId) => {
    setError(null);
    try {
      const response = await api.get(`/courses/${courseId}/content`);
      return {
        fullAccess: !!response?.data?.fullAccess,
        modules: response?.data?.modules || []
      };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load course content.";
      setError(message);
      return { fullAccess: false, modules: [], error: message };
    }
  }, [api]);

  const updateLessonProgress = useCallback(async (lessonId, payload) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/lessons/${lessonId}/progress`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response?.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to update progress.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const fetchCourseProgress = useCallback(async (courseId, userId = null) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const query = userId ? `?userId=${userId}` : "";
      const response = await api.get(`/courses/${courseId}/progress${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, data: response?.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to fetch progress.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const fetchCourseCertificate = useCallback(async (courseId, userId = null) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const query = userId ? `?userId=${userId}` : "";
      const response = await api.get(`/courses/${courseId}/certificate${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, data: response?.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to fetch certificate.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const getMyCertificates = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users/certificates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response?.data?.certificates || [];
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load certificates.";
      setError(message);
      return [];
    }
  }, [api]);

  const validateCoupon = useCallback(async ({ code, amount }) => {
    setError(null);
    try {
      const response = await api.post("/payments/coupons/validate", { code, amount });
      return { success: true, data: response?.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Coupon validation failed.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const createOrder = useCallback(async ({ courseId, couponCode = "", gateway = "manual" }) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/payments/orders",
        { courseId, couponCode, gateway },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response?.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to create order.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const confirmOrder = useCallback(async (orderId, payload = { status: "paid" }) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/payments/orders/${orderId}/confirm`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response?.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to confirm order.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const getMyOrders = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const items = response?.data?.orders || [];
      setOrders(items);
      return items;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to load orders.";
      setError(message);
      return [];
    }
  }, [api]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const value = useMemo(() => ({
    courses,
    currentCourse,
    wishlist,
    orders,
    isLoading,
    error,
    fetchCourses,
    fetchCourseById,
    getCourseById,
    enrollInCourse,
    getEnrolledCourses,
    getWishlist,
    fetchCourseQuizzes,
    attemptQuiz,
    fetchCourseAssignments,
    createCourseQuiz,
    createCourseAssignment,
    submitAssignment,
    toggleWishlist,
    submitReview,
    fetchCourseReviews,
    fetchCourseContent,
    updateLessonProgress,
    fetchCourseProgress,
    fetchCourseCertificate,
    getMyCertificates,
    validateCoupon,
    createOrder,
    confirmOrder,
    getMyOrders,
    setCurrentCourse,
    clearError: () => setError(null)
  }), [
    courses,
    currentCourse,
    wishlist,
    orders,
    isLoading,
    error,
    fetchCourses,
    fetchCourseById,
    getCourseById,
    enrollInCourse,
    getEnrolledCourses,
    getWishlist,
    fetchCourseQuizzes,
    attemptQuiz,
    fetchCourseAssignments,
    createCourseQuiz,
    createCourseAssignment,
    submitAssignment,
    toggleWishlist,
    submitReview,
    fetchCourseReviews,
    fetchCourseContent,
    updateLessonProgress,
    fetchCourseProgress,
    fetchCourseCertificate,
    getMyCertificates,
    validateCoupon,
    createOrder,
    confirmOrder,
    getMyOrders
  ]);

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourses must be used within a CourseProvider");
  }
  return context;
};

export default CourseContext;
