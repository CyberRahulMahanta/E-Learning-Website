import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Tick from "/images/Tick.png";
import Navbar from "./UnifiedNavbar";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";
import { buildAssetUrl } from "../config/api";

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourseById, isLoading, validateCoupon, createOrder } = useCourses();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const course = getCourseById(courseId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const amount = useMemo(() => Number(course?.price || 0), [course?.price]);
  const discount = useMemo(() => Number(couponApplied?.discount || 0), [couponApplied?.discount]);
  const finalAmount = useMemo(() => Math.max(0, amount - discount), [amount, discount]);

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

  const onApplyCoupon = async () => {
    setCouponError("");
    setCouponApplied(null);

    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    const result = await validateCoupon({
      code: couponCode.trim(),
      amount
    });

    if (!result.success) {
      setCouponError(result.error || "Invalid coupon code.");
      return;
    }

    setCouponApplied({
      code: result?.data?.coupon?.code || couponCode.trim().toUpperCase(),
      discount: Number(result?.data?.discount || 0),
      finalAmount: Number(result?.data?.finalAmount || amount)
    });
  };

  const onProceedCheckout = async () => {
    setSubmittingOrder(true);
    setCouponError("");

    const result = await createOrder({
      courseId,
      couponCode: couponApplied?.code || couponCode.trim() || "",
      gateway: "manual"
    });

    if (!result.success) {
      setCouponError(result.error || "Unable to create order. Try again.");
      setSubmittingOrder(false);
      return;
    }

    const order = result?.data?.order || null;
    if (order) {
      localStorage.setItem("activeOrder", JSON.stringify(order));
    }

    setSubmittingOrder(false);
    navigate(`/courses/${courseId}/checkout`, { state: { order } });
  };

  return (
    <>
      <Navbar />
      <main className="flex flex-col pb-32 overflow-hidden max-md:pb-20">
        <section className="self-center pt-6 pr-4 pb-16 pl-6 mt-28 w-full max-w-[1000px] bg-black rounded-xl border border-solid border-fuchsia-700 border-opacity-30 max-md:pl-4 max-md:mt-10 max-md:max-w-full">
          <div className="flex justify-between w-full gap-5 text-2xl max-md:flex-col">
            <h2 className="text-stone-300">Your Course</h2>
            <h2 className="text-white">Payment Details</h2>
          </div>

          <div className="mt-10 max-md:mt-8 max-md:max-w-full">
            <div className="flex gap-5 max-md:flex-col">
              <div className="w-[60%] max-md:w-full">
                <div className="flex flex-col w-full max-md:mt-8 max-md:max-w-full">
                  <section className="p-5 border border-solid rounded-2xl border-fuchsia-700 bg-neutral-900 bg-opacity-60">
                    <div className="flex gap-4 max-md:flex-col">
                      <div className="w-1/2 max-md:w-full">
                        <div className="flex justify-center w-full p-1 border border-solid rounded-lg border-fuchsia-700 bg-stone-950">
                          <img
                            src={buildAssetUrl(course.image)}
                            alt="Course Preview"
                            className="object-contain w-full aspect-[1.68]"
                          />
                        </div>
                      </div>

                      <div className="w-1/2 max-md:w-full">
                        <div className="mt-4 max-md:mt-8">
                          <div className="flex flex-col text-lg text-white">
                            <h2>{course.name}</h2>
                            <p className="mt-5">INR {amount.toFixed(2)}</p>
                          </div>

                          <div className="w-full mt-6">
                            <div className="flex items-center w-full gap-3">
                              <input
                                type="text"
                                placeholder="Enter Coupon Code"
                                value={couponCode}
                                onChange={(event) => setCouponCode(event.target.value)}
                                className="w-full px-2 py-3 text-black rounded-lg bg-zinc-300 bg-opacity-60"
                              />
                              <button
                                type="button"
                                className="px-5 py-3 text-white border border-solid rounded-lg border-fuchsia-600 bg-stone-950 whitespace-nowrap hover:bg-fuchsia-600"
                                onClick={onApplyCoupon}
                              >
                                Apply
                              </button>
                            </div>
                            {couponApplied && (
                              <p className="mt-2 text-sm text-green-400">
                                Coupon {couponApplied.code} applied. Discount: INR {couponApplied.discount.toFixed(2)}
                              </p>
                            )}
                            {couponError && <p className="mt-2 text-sm text-red-400">{couponError}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mt-6">
                    <h3 className="mb-3 text-base text-white">Payment & Support Info</h3>
                    <div className="w-full px-6 py-8 rounded-2xl bg-stone-950">
                      <div className="flex gap-4 max-md:flex-col">
                        <div className="w-1/3 max-md:w-full">
                          <div className="flex items-center gap-4 text-sm text-white">
                            <img src={Tick} alt="Refund Policy" className="w-10" />
                            <p>
                              3-Days
                              <br />
                              Refund Policy
                            </p>
                          </div>
                        </div>
                        <div className="w-1/3 max-md:w-full">
                          <div className="flex items-center gap-4 text-sm text-white">
                            <img src={Tick} alt="Contact Icon" className="w-10" />
                            <p>Contact Us</p>
                          </div>
                        </div>
                        <div className="w-1/3 max-md:w-full">
                          <div className="flex items-center gap-4 text-sm text-white">
                            <img src={Tick} alt="Certificate Icon" className="w-10" />
                            <p>
                              Get Course
                              <br />
                              Completion Certificate
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="w-[40%] max-md:w-full">
                <aside className="flex flex-col w-full pt-6 text-white rounded-2xl bg-stone-950">
                  <div className="px-6">
                    <div className="flex justify-between text-lg">
                      <div>
                        <h3>(Base Amount)</h3>
                        <h3 className="mt-6">(Platform fees)</h3>
                      </div>
                      <div className="text-right">
                        <p>INR {(course.baseAmount || Math.round(amount * 0.8)).toFixed(2)}</p>
                        <p className="mt-8">INR {(course.platformFees || Math.round(amount * 0.05)).toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">
                      (Server, Streaming, Database, Bandwidth, etc)
                    </p>
                    <div className="flex justify-between mt-6">
                      <div>
                        <h3 className="text-lg">(GST @18%)</h3>
                        <p className="text-sm">to Govt. of India</p>
                      </div>
                      <p className="text-lg">INR {(course.gst || Math.round(amount * 0.18)).toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between mt-6 text-lg">
                      <h3>Coupon Discount</h3>
                      <p>INR {discount.toFixed(2)}</p>
                    </div>
                  </div>
                  <hr className="h-px mt-16 border border-fuchsia-700" />
                  <div className="flex justify-between px-6 mt-4 text-lg">
                    <h3>Total Amount</h3>
                    <p>INR {finalAmount.toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    className="px-12 py-4 mt-4 text-lg rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onProceedCheckout}
                    disabled={submittingOrder}
                  >
                    {submittingOrder ? "Creating order..." : "Proceed to Checkout"}
                  </button>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default PaymentPage;
