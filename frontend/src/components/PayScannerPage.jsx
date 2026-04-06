import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./UnifiedNavbar";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

const PayScannerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getCourseById, isLoading, enrollInCourse, getEnrolledCourses, confirmOrder } = useCourses();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeMethod, setActiveMethod] = useState("qr");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeOrder, setActiveOrder] = useState(() => {
    const fromState = location?.state?.order || null;
    if (fromState) return fromState;
    try {
      const stored = localStorage.getItem("activeOrder");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const course = getCourseById(courseId);
  const payableAmount = useMemo(() => {
    if (activeOrder?.courseId && String(activeOrder.courseId) === String(course?._id || course?.id)) {
      return Number(activeOrder.finalAmount || activeOrder.amount || course?.price || 0);
    }
    return Number(course?.price || 0);
  }, [activeOrder, course?._id, course?.id, course?.price]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Redirect if already enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      if (authLoading || !isAuthenticated) return;
      const list = await getEnrolledCourses();
      const already = list.some((enroll) => {
        const base = enroll.course || enroll;
        const id = base._id || base.id || base.slug;
        return id === courseId || base.slug === courseId;
      });
      if (already) {
        navigate("/my-courses");
      }
    };
    checkEnrollment();
  }, [authLoading, isAuthenticated, courseId, getEnrolledCourses, navigate]);

  if (isLoading || authLoading) {
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

  const handleEnrollSuccess = () => {
    navigate("/my-courses");
  };

  const handleEnroll = async () => {
    setError("");
    setSubmitting(true);
    let result;
    if (activeOrder?.id) {
      result = await confirmOrder(activeOrder.id, {
        status: "paid",
        gatewayPaymentId: `TXN-${Date.now()}`
      });
      if (result.success) {
        localStorage.removeItem("activeOrder");
        setActiveOrder(null);
      }
    } else {
      result = await enrollInCourse(courseId, { paymentMethod: activeMethod });
    }
    if (result.success) {
      const { message, alreadyEnrolled } = result.data || {};
      if (alreadyEnrolled || message === "Already enrolled") {
        setError("You are already enrolled in this course.");
        navigate("/my-courses");
      } else {
        handleEnrollSuccess();
      }
    } else {
      setError(result.error || "Payment failed. Try again.");
    }
    setSubmitting(false);
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!card.number || !card.name || !card.expiry || !card.cvv) {
      setError("Please fill all card details.");
      return;
    }
    await handleEnroll();
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <div className="flex gap-10 p-6 bg-gray-900 rounded-xl w-[90%] max-w-5xl">
          {/* Left Panel */}
          <div className="flex flex-col flex-1 gap-4">
            <h1 className="text-3xl font-bold text-purple-500">{course.name}</h1>
            <div className="px-6 py-4 text-center bg-gray-700 rounded-xl">
              <h2 className="text-lg">Price Summary</h2>
              <p className="text-2xl font-semibold">INR {payableAmount.toFixed(2)}</p>
            </div>
            <div className="px-6 py-4 text-center bg-gray-700 rounded-xl">
              <p>Using payment via UPI / Card</p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[320px] min-w-[320px] p-6 bg-gray-800 rounded-xl shadow-lg shadow-fuchsia-900/20">
            <h2 className="mb-4 text-2xl font-semibold text-center">Payment Options</h2>

            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 px-4 py-2 rounded-lg border transition ${activeMethod === "qr" ? "bg-fuchsia-700 text-white border-fuchsia-500" : "bg-gray-700 text-gray-200 border-gray-600 hover:border-fuchsia-500/60"}`}
                onClick={() => setActiveMethod("qr")}
              >
                UPI / QR
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg border transition ${activeMethod === "card" ? "bg-fuchsia-700 text-white border-fuchsia-500" : "bg-gray-700 text-gray-200 border-gray-600 hover:border-fuchsia-500/60"}`}
                onClick={() => setActiveMethod("card")}
              >
                Debit / Credit Card
              </button>
            </div>

            <div className="p-6 rounded-xl border border-fuchsia-700/50 bg-gray-900/80">
              {activeMethod === "qr" ? (
                <div className="flex flex-col items-center p-4 rounded-lg bg-gray-800">
                  <div className="p-3 bg-white rounded-lg">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?data=upi://pay&size=160x160"
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="mt-3 mb-2 text-sm text-gray-300">Scan the QR using any UPI app</p>
                  <div className="flex gap-3 mb-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Google_Pay_logo.svg" alt="GPay" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/PhonePe_Logo.png" alt="PhonePe" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Paytm_logo.png" alt="Paytm" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/BHIM_logo.svg/1024px-BHIM_logo.svg.png" alt="BHIM" className="h-6" />
                  </div>
                  {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                  <button
                    disabled={submitting}
                    className="px-6 py-2 mt-3 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60 transition"
                    onClick={handleEnroll}
                  >
                    {submitting ? "Confirming..." : "I have paid – continue"}
                  </button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleCardSubmit}>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Enter your card details</span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" /> Secure
                    </span>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-200">Card Number</label>
                    <input
                      className="w-full px-4 py-3 text-white placeholder-gray-400 border rounded-lg border-fuchsia-700/50 bg-gray-800 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-200">Name on Card</label>
                    <input
                      className="w-full px-4 py-3 text-white placeholder-gray-400 border rounded-lg border-fuchsia-700/50 bg-gray-800 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
                      placeholder="John Doe"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-semibold text-gray-200">Expiry</label>
                      <input
                        className="w-full px-4 py-3 text-white placeholder-gray-400 border rounded-lg border-fuchsia-700/50 bg-gray-800 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-semibold text-gray-200">CVV</label>
                      <input
                        className="w-full px-4 py-3 text-white placeholder-gray-400 border rounded-lg border-fuchsia-700/50 bg-gray-800 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
                        placeholder="123"
                        maxLength={4}
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-4 py-3 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60 shadow-md shadow-fuchsia-500/30 transition"
                  >
                    {submitting ? "Processing..." : "Pay & Enroll"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayScannerPage;
