import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/UnifiedNavbar";
import Loader from "../components/Loader";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";

const CourseQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourseById, getCourseById, fetchCourseQuizzes, attemptQuiz } = useCourses();

  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingQuizId, setIsSubmittingQuizId] = useState(null);
  const [answersByQuiz, setAnswersByQuiz] = useState({});
  const [attemptResultByQuiz, setAttemptResultByQuiz] = useState({});
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
      const result = await fetchCourseQuizzes(courseId);
      if (!active) return;

      if (!result.success) {
        setPageError(result.error || "Failed to load quizzes.");
      }
      setQuizzes(result.quizzes || []);
      setIsLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId, fetchCourseById, fetchCourseQuizzes]);

  const setAnswer = (quizId, question, value) => {
    const questionId = String(question.id);
    setAnswersByQuiz((prev) => {
      const quizAnswers = prev[quizId] || {};
      return {
        ...prev,
        [quizId]: {
          ...quizAnswers,
          [questionId]: value
        }
      };
    });
  };

  const toggleMultipleOption = (quizId, question, optionValue) => {
    const questionId = String(question.id);
    setAnswersByQuiz((prev) => {
      const quizAnswers = prev[quizId] || {};
      const currentValues = Array.isArray(quizAnswers[questionId]) ? quizAnswers[questionId] : [];
      const exists = currentValues.includes(optionValue);
      const nextValues = exists
        ? currentValues.filter((item) => item !== optionValue)
        : [...currentValues, optionValue];

      return {
        ...prev,
        [quizId]: {
          ...quizAnswers,
          [questionId]: nextValues
        }
      };
    });
  };

  const handleSubmitQuiz = async (quiz) => {
    const quizId = quiz.id || quiz._id;
    setIsSubmittingQuizId(quizId);
    setPageError("");

    const payloadAnswers = answersByQuiz[quizId] || {};
    const result = await attemptQuiz(quizId, payloadAnswers);

    if (!result.success) {
      setPageError(result.error || "Failed to submit quiz.");
      setIsSubmittingQuizId(null);
      return;
    }

    setAttemptResultByQuiz((prev) => ({
      ...prev,
      [quizId]: result.attempt
    }));

    const reloadResult = await fetchCourseQuizzes(courseId);
    setQuizzes(reloadResult.quizzes || []);
    setIsSubmittingQuizId(null);
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
              <h1 className="text-3xl font-bold">Quizzes</h1>
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

          {quizzes.length === 0 ? (
            <div className="p-6 text-center border rounded-xl border-fuchsia-700 bg-stone-950">
              <p className="text-lg">No quizzes available for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {quizzes.map((quiz) => {
                const quizId = quiz.id || quiz._id;
                const runtimeResult = attemptResultByQuiz[quizId];
                const latestAttempt = runtimeResult || quiz.latestAttempt;
                return (
                  <section key={quizId} className="p-5 border rounded-xl border-fuchsia-700 bg-stone-950">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold">{quiz.title}</h2>
                        <p className="mt-1 text-gray-300">{quiz.description || "No description available."}</p>
                      </div>
                      <div className="text-sm text-gray-300">
                        <p>Questions: {quiz.questionCount || (quiz.questions || []).length}</p>
                        <p>Total Marks: {quiz.totalMarks || 0}</p>
                        <p>Pass: {quiz.passPercentage || 0}%</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      {(quiz.questions || []).map((question, index) => {
                        const questionId = String(question.id);
                        const options = Array.isArray(question.options) ? question.options : [];
                        const selected = answersByQuiz[quizId]?.[questionId];
                        const type = question.questionType || "single";

                        return (
                          <article key={question.id} className="p-4 border rounded-lg border-stone-700 bg-black">
                            <h3 className="font-semibold">
                              {index + 1}. {question.questionText}
                            </h3>
                            <p className="mt-1 text-xs text-gray-400">Marks: {question.marks}</p>

                            {options.length > 0 ? (
                              <div className="grid gap-2 mt-3">
                                {options.map((option, optionIndex) => {
                                  const optionValue = String(option);
                                  if (type === "multiple") {
                                    const checked = Array.isArray(selected) && selected.includes(optionValue);
                                    return (
                                      <label key={`${question.id}-${optionIndex}`} className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleMultipleOption(quizId, question, optionValue)}
                                        />
                                        <span>{optionValue}</span>
                                      </label>
                                    );
                                  }
                                  return (
                                    <label key={`${question.id}-${optionIndex}`} className="flex items-center gap-2 text-sm">
                                      <input
                                        type="radio"
                                        name={`quiz-${quizId}-question-${question.id}`}
                                        checked={selected === optionValue}
                                        onChange={() => setAnswer(quizId, question, optionValue)}
                                      />
                                      <span>{optionValue}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={typeof selected === "string" ? selected : ""}
                                onChange={(event) => setAnswer(quizId, question, event.target.value)}
                                className="w-full p-2 mt-3 text-white border rounded-lg bg-stone-900 border-stone-700"
                                placeholder="Type your answer"
                              />
                            )}
                          </article>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                      {latestAttempt ? (
                        <p className="text-sm text-fuchsia-300">
                          Latest Score: {Number(latestAttempt.score || 0).toFixed(2)} / {Number(latestAttempt.totalMarks || 0).toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">No attempts yet.</p>
                      )}

                      {canSubmit ? (
                        <button
                          className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60"
                          disabled={isSubmittingQuizId === quizId}
                          onClick={() => handleSubmitQuiz(quiz)}
                        >
                          {isSubmittingQuizId === quizId ? "Submitting..." : "Submit Quiz"}
                        </button>
                      ) : (
                        <p className="text-sm text-gray-400">Quiz attempts are enabled for student accounts.</p>
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

export default CourseQuiz;
