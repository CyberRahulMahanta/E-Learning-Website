import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./UnifiedNavbar";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PayScannerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getCourseById, isLoading, getEnrolledCourses, confirmOrder } = useCourses();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const razorpayOrder = activeOrder?.razorpay || null;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

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

  const handlePaymentSuccess = () => {
    navigate("/my-courses");
  };

  const handleRazorpayCheckout = async () => {
    setError("");

    if (!activeOrder?.id) {
      setError("Order not found. Please create payment order again.");
      return;
    }

    if (!razorpayOrder?.keyId || !razorpayOrder?.orderId) {
      setError("Razorpay details missing for this order. Please recreate the order.");
      return;
    }

    setSubmitting(true);
    const scriptReady = await loadRazorpayScript();
    if (!scriptReady || !window.Razorpay) {
      setSubmitting(false);
      setError("Unable to load Razorpay checkout. Please retry.");
      return;
    }

    const options = {
      key: razorpayOrder.keyId,
      amount: Number(razorpayOrder.amountPaise || Math.round(payableAmount * 100)),
      currency: razorpayOrder.currency || "INR",
      name: razorpayOrder.name || "CodeHub",
      description: razorpayOrder.description || `Course enrollment: ${course?.name || ""}`,
      order_id: razorpayOrder.orderId,
      prefill: razorpayOrder.prefill || {},
      handler: async (response) => {
        const result = await confirmOrder(activeOrder.id, {
          status: "paid",
          gatewayOrderId: response?.razorpay_order_id || razorpayOrder.orderId,
          gatewayPaymentId: response?.razorpay_payment_id || "",
          gatewaySignature: response?.razorpay_signature || ""
        });

        if (result.success) {
          localStorage.removeItem("activeOrder");
          setActiveOrder(null);
          handlePaymentSuccess();
          return;
        }

        setError(result.error || "Payment captured but confirmation failed. Contact support.");
      },
      modal: {
        ondismiss: async () => {
          setSubmitting(false);
          setError("Payment was cancelled.");
          await confirmOrder(activeOrder.id, {
            status: "cancelled",
            gatewayOrderId: razorpayOrder.orderId
          });
        }
      },
      theme: {
        color: "#a21caf"
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", async (response) => {
      setSubmitting(false);
      setError(response?.error?.description || "Payment failed.");
      await confirmOrder(activeOrder.id, {
        status: "failed",
        gatewayOrderId: response?.error?.metadata?.order_id || razorpayOrder.orderId,
        gatewayPaymentId: response?.error?.metadata?.payment_id || ""
      });
    });

    razorpay.open();
    setSubmitting(false);
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <div className="flex gap-10 p-6 bg-gray-900 rounded-xl w-[90%] max-w-5xl">
          <div className="flex flex-col flex-1 gap-4">
            <h1 className="text-3xl font-bold text-purple-500">{course.name}</h1>
            <div className="px-6 py-4 text-center bg-gray-700 rounded-xl">
              <h2 className="text-lg">Price Summary</h2>
              <p className="text-2xl font-semibold">INR {payableAmount.toFixed(2)}</p>
            </div>
            <div className="px-6 py-4 text-center bg-gray-700 rounded-xl">
              <p>Pay securely with Razorpay (UPI, Card, Wallets, Netbanking)</p>
            </div>
          </div>

          <div className="w-[320px] min-w-[320px] p-6 bg-gray-800 rounded-xl shadow-lg shadow-fuchsia-900/20">
            <h2 className="mb-4 text-2xl font-semibold text-center">Complete Payment</h2>
            <div className="p-6 rounded-xl border border-fuchsia-700/50 bg-gray-900/80">
              <p className="text-sm text-gray-300">
                Click below to open Razorpay checkout and finish your enrollment.
              </p>

              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

              <button
                type="button"
                disabled={submitting}
                className="w-full px-4 py-3 mt-5 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60 shadow-md shadow-fuchsia-500/30 transition"
                onClick={handleRazorpayCheckout}
              >
                {submitting ? "Preparing..." : "Pay with Razorpay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayScannerPage;

