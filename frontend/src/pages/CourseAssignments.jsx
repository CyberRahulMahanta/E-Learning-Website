import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/UnifiedNavbar";
import Loader from "../components/Loader";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";

const CourseAssignments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourseById, getCourseById, fetchCourseAssignments, submitAssignment } = useCourses();

  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionDraft, setSubmissionDraft] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [pageError, setPageError] = useState("");

  const course = getCourseById(courseId);
  const courseTitle = useMemo(() => course?.name || course?.title || "Course", [course?.name, course?.title]);
  const canSubmit = (user?.role || "") === "student";

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setPageError("");
      await fetchCourseById(courseId);
      const result = await fetchCourseAssignments(courseId);
      if (!active) return;

      if (!result.success) {
        setPageError(result.error || "Failed to load assignments.");
      }

      const fetchedAssignments = result.assignments || [];
      setAssignments(fetchedAssignments);

      const initialDraft = {};
      fetchedAssignments.forEach((assignment) => {
        const assignmentId = assignment.id || assignment._id;
        initialDraft[assignmentId] = {
          submissionText: assignment.submission?.submissionText || "",
          submissionUrl: assignment.submission?.submissionUrl || ""
        };
      });
      setSubmissionDraft(initialDraft);
      setIsLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId, fetchCourseById, fetchCourseAssignments]);

  const setDraftField = (assignmentId, field, value) => {
    setSubmissionDraft((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || {}),
        [field]: value
      }
    }));
  };

  const handleSubmit = async (assignmentId) => {
    setSubmittingId(assignmentId);
    setPageError("");

    const payload = submissionDraft[assignmentId] || {};
    const result = await submitAssignment(assignmentId, payload);

    if (!result.success) {
      setPageError(result.error || "Failed to submit assignment.");
      setSubmittingId(null);
      return;
    }

    const refresh = await fetchCourseAssignments(courseId);
    setAssignments(refresh.assignments || []);
    setSubmittingId(null);
  };

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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Assignments</h1>
              <p className="text-gray-300">{courseTitle}</p>
            </div>
            <button
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              Back to Course
            </button>
          </div>

          {pageError && (
            <p className="p-3 mb-6 text-red-300 border rounded-lg bg-red-950/30 border-red-800">{pageError}</p>
          )}

          {assignments.length === 0 ? (
            <div className="p-6 text-center border rounded-xl border-fuchsia-700 bg-stone-950">
              <p className="text-lg">No assignments available for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment) => {
                const assignmentId = assignment.id || assignment._id;
                const draft = submissionDraft[assignmentId] || { submissionText: "", submissionUrl: "" };
                return (
                  <section key={assignmentId} className="p-5 border rounded-xl border-fuchsia-700 bg-stone-950">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold">{assignment.title}</h2>
                        <p className="mt-1 text-gray-300">{assignment.description || "No description available."}</p>
                      </div>
                      <div className="text-sm text-gray-300">
                        <p>Max Marks: {assignment.maxMarks || 0}</p>
                        <p>
                          Due: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : "No deadline"}
                        </p>
                      </div>
                    </div>

                    {assignment.submission && (
                      <div className="p-3 mt-4 text-sm border rounded-lg border-stone-700 bg-black">
                        <p>Status: <span className="text-fuchsia-300">{assignment.submission.status || "submitted"}</span></p>
                        <p>Marks: {assignment.submission.marks ?? "-"}</p>
                        <p>Feedback: {assignment.submission.feedback || "Pending review"}</p>
                      </div>
                    )}

                    <div className="grid gap-4 mt-5">
                      <label className="block">
                        <span className="text-sm text-gray-300">Submission Text</span>
                        <textarea
                          className="w-full h-28 p-3 mt-2 text-white border rounded-lg resize-none bg-stone-900 border-stone-700"
                          value={draft.submissionText}
                          onChange={(event) => setDraftField(assignmentId, "submissionText", event.target.value)}
                          placeholder="Write your solution..."
                          disabled={!canSubmit}
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm text-gray-300">Submission URL (optional)</span>
                        <input
                          type="url"
                          className="w-full p-3 mt-2 text-white border rounded-lg bg-stone-900 border-stone-700"
                          value={draft.submissionUrl}
                          onChange={(event) => setDraftField(assignmentId, "submissionUrl", event.target.value)}
                          placeholder="https://github.com/username/repo"
                          disabled={!canSubmit}
                        />
                      </label>
                    </div>

                    <div className="flex justify-end mt-4">
                      {canSubmit ? (
                        <button
                          className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60"
                          disabled={submittingId === assignmentId}
                          onClick={() => handleSubmit(assignmentId)}
                        >
                          {submittingId === assignmentId ? "Submitting..." : "Submit Assignment"}
                        </button>
                      ) : (
                        <p className="text-sm text-gray-400">Assignment submission is enabled for student accounts.</p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CourseAssignments;
