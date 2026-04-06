import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/UnifiedNavbar";
import Loader from "../components/Loader";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

const CourseCertificate = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourseById, getCourseById, fetchCourseCertificate } = useCourses();

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [certificateData, setCertificateData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [eligible, setEligible] = useState(false);

  const course = getCourseById(courseId);
  const learnerName = useMemo(() => user?.username || user?.email || "Student", [user?.username, user?.email]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setPageError("");

      await fetchCourseById(courseId);
      const certRes = await fetchCourseCertificate(courseId);
      if (!active) return;

      if (!certRes.success) {
        setPageError(certRes.error || "Failed to load certificate.");
        setIsLoading(false);
        return;
      }

      setCertificateData(certRes?.data?.certificate || null);
      setProgressData(certRes?.data?.courseProgress || null);
      setEligible(!!certRes?.data?.eligible);
      setIsLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId, fetchCourseById, fetchCourseCertificate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pt-32 pb-16 text-white bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">Course Certificate</h1>
            <button
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
              onClick={() => navigate(`/courses/${courseId}/syllabus`)}
            >
              Back to Learning
            </button>
          </div>

          {pageError && (
            <p className="p-3 mb-6 text-red-300 border rounded-lg bg-red-950/30 border-red-800">{pageError}</p>
          )}

          {!certificateData ? (
            <div className="p-6 border rounded-xl border-fuchsia-700 bg-stone-950">
              <h2 className="text-2xl font-semibold">Certificate Not Available Yet</h2>
              <p className="mt-2 text-gray-300">
                Complete all lessons to unlock your certificate.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Current Progress:
                {" "}
                {Number(progressData?.progressPercent || 0).toFixed(2)}%
              </p>
              {!eligible && (
                <button
                  className="px-5 py-2 mt-4 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
                  onClick={() => navigate(`/courses/${courseId}/syllabus`)}
                >
                  Continue Learning
                </button>
              )}
            </div>
          ) : (
            <>
              <section id="certificate-print-area" className="p-10 border-4 rounded-2xl border-amber-300 bg-gradient-to-br from-[#1b1328] via-[#261235] to-[#130d1d] shadow-2xl">
                <div className="p-10 border rounded-xl border-amber-200/60 bg-black/20">
                  <p className="text-sm tracking-[0.3em] text-amber-200 text-center">CERTIFICATE OF COMPLETION</p>
                  <h2 className="mt-4 text-5xl font-bold text-center text-white">{course?.name || course?.title || "Course"}</h2>
                  <p className="mt-8 text-center text-gray-200">This is to certify that</p>
                  <p className="mt-3 text-4xl font-semibold text-center text-fuchsia-200">{learnerName}</p>
                  <p className="max-w-3xl mx-auto mt-6 text-center text-gray-200">
                    has successfully completed all required modules, lessons, and assessments for this course.
                  </p>

                  <div className="grid gap-4 mt-10 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-black/40">
                      <p className="text-xs text-gray-300 uppercase">Issue Date</p>
                      <p className="mt-1 text-lg text-white">{formatDate(certificateData.issueDate)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-black/40">
                      <p className="text-xs text-gray-300 uppercase">Certificate Code</p>
                      <p className="mt-1 text-lg text-white break-all">{certificateData.certificateCode}</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-green-600 hover:bg-green-500"
                  onClick={() => window.print()}
                >
                  Download / Print Certificate
                </button>
                <button
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
                  onClick={() => navigate("/my-courses")}
                >
                  Go to My Courses
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default CourseCertificate;
