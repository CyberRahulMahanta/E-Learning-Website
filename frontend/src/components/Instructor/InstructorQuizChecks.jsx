import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCourses } from "../../context/CourseContext";
import useApi from "../../hooks/useApi";

const emptyQuestion = () => ({
  questionText: "",
  questionType: "single",
  optionsText: "",
  correctAnswerText: "",
  marks: 1
});

const InstructorQuizChecks = () => {
  const navigate = useNavigate();
  const api = useApi();
  const { user, logout } = useAuth();
  const { createCourseQuiz, createCourseAssignment, fetchCourseAssignments } = useCourses();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [expandedAttemptIds, setExpandedAttemptIds] = useState({});

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passPercentage: 60,
    timeLimitMinutes: "",
    questions: [emptyQuestion()]
  });
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    maxMarks: 100,
    dueAt: ""
  });

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id || course._id) === String(selectedCourseId)) || null,
    [courses, selectedCourseId]
  );

  const loadCourses = useCallback(async () => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      let list = [];
      if ((user?.role || "") === "admin") {
        const response = await api.get("/courses?limit=200&published=all", { headers });
        list = response?.data?.courses || [];
      } else {
        const response = await api.get(`/courses/instructor/${user._id || user.id}`, { headers });
        list = response?.data?.courses || [];
      }
      setCourses(list);
      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(String(list[0].id || list[0]._id));
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load courses.");
    }
  }, [api, user, selectedCourseId]);

  const loadCourseData = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [quizRes, assignmentRes] = await Promise.all([
        api.get(`/courses/${courseId}/quiz-attempts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchCourseAssignments(courseId)
      ]);
      setQuizzes(quizRes?.data?.quizzes || []);
      setAssignments(assignmentRes?.assignments || []);
    } catch (err) {
      setQuizzes([]);
      setAssignments([]);
      setError(err?.response?.data?.message || err?.message || "Failed to load course quiz/assignment data.");
    } finally {
      setLoading(false);
    }
  }, [api, fetchCourseAssignments]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData(selectedCourseId);
    }
  }, [selectedCourseId, loadCourseData]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const updateQuestion = (index, field, value) => {
    setQuizForm((prev) => {
      const next = [...prev.questions];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, questions: next };
    });
  };

  const addQuestion = () => setQuizForm((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  const removeQuestion = (index) => setQuizForm((prev) => ({
    ...prev,
    questions: prev.questions.length <= 1 ? prev.questions : prev.questions.filter((_, i) => i !== index)
  }));

  const parseCsv = (text) => String(text || "").split(",").map((value) => value.trim()).filter(Boolean);

  const handleCreateQuiz = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedCourseId) return setError("Select a course first.");
    if (!quizForm.title.trim()) return setError("Quiz title is required.");

    const questions = [];
    for (let i = 0; i < quizForm.questions.length; i += 1) {
      const q = quizForm.questions[i];
      if (!q.questionText.trim()) return setError(`Question ${i + 1} text is required.`);
      const questionType = q.questionType || "single";
      const options = questionType === "text" ? null : parseCsv(q.optionsText);
      if (questionType !== "text" && options.length < 2) return setError(`Question ${i + 1} requires 2+ options.`);
      const correctAnswer = questionType === "multiple" ? parseCsv(q.correctAnswerText) : q.correctAnswerText.trim();
      if ((questionType === "multiple" && correctAnswer.length === 0) || (questionType !== "multiple" && !correctAnswer)) {
        return setError(`Question ${i + 1} requires correct answer.`);
      }
      questions.push({
        questionText: q.questionText.trim(),
        questionType,
        options,
        correctAnswer,
        marks: Number(q.marks || 1),
        sortOrder: i + 1
      });
    }

    setSavingQuiz(true);
    const result = await createCourseQuiz(selectedCourseId, {
      title: quizForm.title.trim(),
      description: quizForm.description.trim(),
      passPercentage: Number(quizForm.passPercentage || 60),
      timeLimitMinutes: quizForm.timeLimitMinutes ? Number(quizForm.timeLimitMinutes) : null,
      questions
    });
    setSavingQuiz(false);
    if (!result.success) return setError(result.error || "Failed to create quiz.");

    setSuccess("Quiz created.");
    setQuizForm({ title: "", description: "", passPercentage: 60, timeLimitMinutes: "", questions: [emptyQuestion()] });
    await loadCourseData(selectedCourseId);
  };

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedCourseId) return setError("Select a course first.");
    if (!assignmentForm.title.trim()) return setError("Assignment title is required.");

    setSavingAssignment(true);
    const result = await createCourseAssignment(selectedCourseId, {
      title: assignmentForm.title.trim(),
      description: assignmentForm.description.trim(),
      maxMarks: Number(assignmentForm.maxMarks || 100),
      dueAt: assignmentForm.dueAt || null
    });
    setSavingAssignment(false);
    if (!result.success) return setError(result.error || "Failed to create assignment.");

    setSuccess("Assignment created.");
    setAssignmentForm({ title: "", description: "", maxMarks: 100, dueAt: "" });
    await loadCourseData(selectedCourseId);
  };

  const toggleAttemptDetails = (attemptId) => setExpandedAttemptIds((prev) => ({ ...prev, [attemptId]: !prev[attemptId] }));
  const formatAnswer = (answer) => (Array.isArray(answer) ? answer.join(", ") : (answer === null || answer === undefined ? "-" : String(answer)));

  return (
    <div className="flex min-h-screen text-white bg-black">
      <nav className="w-64 min-h-screen p-6 border-r bg-stone-950 border-fuchsia-900 max-sm:hidden">
        <div className="mb-10"><h2 className="text-3xl font-bold">Instructor<span className="text-fuchsia-500">Panel</span></h2></div>
        <ul className="space-y-6">
          {[{ name: "Dashboard", path: "/instructor/dashboard" }, { name: "My Courses", path: "/instructor/courses" }, { name: "Students", path: "/instructor/students" }, { name: "Quiz Checks", path: "/instructor/quiz-checks" }].map((item) => (
            <li key={item.name}><Link to={item.path} className="block px-4 py-2 text-xl transition rounded hover:bg-fuchsia-700 hover:text-black">{item.name}</Link></li>
          ))}
          <li><button onClick={handleLogout} className="block w-full px-4 py-2 text-xl text-left transition rounded hover:bg-fuchsia-700 hover:text-black">Logout</button></li>
        </ul>
      </nav>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-center px-10 py-5 border-b bg-stone-950 border-b-fuchsia-900"><h1 className="text-3xl font-bold">Code<span className="text-fuchsia-500">Hub</span></h1></header>
        <main className="flex-1 p-7 max-sm:p-4">
          <h2 className="text-4xl mb-6">Quiz & Assignment Manager</h2>

          <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg border-fuchsia-700 bg-stone-950">
            <label htmlFor="course-select" className="text-lg">Select Course:</label>
            <select id="course-select" className="px-4 py-2 text-white border rounded bg-stone-900 border-fuchsia-700" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              {courses.map((course) => <option key={course.id || course._id} value={String(course.id || course._id)}>{course.name}</option>)}
            </select>
            <span className="text-sm text-gray-300">Quizzes: {quizzes.length}</span>
            <span className="text-sm text-gray-300">Assignments: {assignments.length}</span>
          </div>

          {error && <p className="mt-4 text-red-400">{error}</p>}
          {success && <p className="mt-4 text-green-400">{success}</p>}

          <div className="grid gap-6 mt-6 lg:grid-cols-2">
            <form onSubmit={handleCreateQuiz} className="p-4 border rounded-lg border-fuchsia-700 bg-stone-950">
              <h3 className="text-2xl">Create Quiz</h3>
              <input className="w-full p-2 mt-3 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Quiz title" value={quizForm.title} onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))} />
              <textarea className="w-full p-2 mt-3 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Description" value={quizForm.description} onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))} />
              <div className="grid gap-3 mt-3 sm:grid-cols-2">
                <input type="number" min="0" max="100" className="p-2 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Pass %" value={quizForm.passPercentage} onChange={(event) => setQuizForm((prev) => ({ ...prev, passPercentage: event.target.value }))} />
                <input type="number" min="1" className="p-2 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Time limit minutes" value={quizForm.timeLimitMinutes} onChange={(event) => setQuizForm((prev) => ({ ...prev, timeLimitMinutes: event.target.value }))} />
              </div>
              <div className="mt-4 space-y-3">
                {quizForm.questions.map((q, index) => (
                  <div key={`q-${index}`} className="p-3 border rounded border-stone-700 bg-black">
                    <div className="flex justify-between"><p>Question {index + 1}</p>{quizForm.questions.length > 1 && <button type="button" className="text-red-400" onClick={() => removeQuestion(index)}>Remove</button>}</div>
                    <input className="w-full p-2 mt-2 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Question text" value={q.questionText} onChange={(event) => updateQuestion(index, "questionText", event.target.value)} />
                    <select className="w-full p-2 mt-2 text-white border rounded bg-stone-900 border-fuchsia-700" value={q.questionType} onChange={(event) => updateQuestion(index, "questionType", event.target.value)}>
                      <option value="single">Single</option><option value="multiple">Multiple</option><option value="text">Text</option>
                    </select>
                    {q.questionType !== "text" && <input className="w-full p-2 mt-2 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Options: A, B, C" value={q.optionsText} onChange={(event) => updateQuestion(index, "optionsText", event.target.value)} />}
                    <input className="w-full p-2 mt-2 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder={q.questionType === "multiple" ? "Correct answers: A, C" : "Correct answer"} value={q.correctAnswerText} onChange={(event) => updateQuestion(index, "correctAnswerText", event.target.value)} />
                    <input type="number" min="1" className="w-full p-2 mt-2 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Marks" value={q.marks} onChange={(event) => updateQuestion(index, "marks", event.target.value)} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-3">
                <button type="button" className="px-3 py-2 rounded bg-stone-800" onClick={addQuestion}>Add Question</button>
                <button type="submit" className="px-3 py-2 rounded bg-fuchsia-700 disabled:opacity-60" disabled={savingQuiz}>{savingQuiz ? "Creating..." : "Create Quiz"}</button>
              </div>
            </form>

            <div className="space-y-6">
              <form onSubmit={handleCreateAssignment} className="p-4 border rounded-lg border-fuchsia-700 bg-stone-950">
                <h3 className="text-2xl">Create Assignment</h3>
                <input className="w-full p-2 mt-3 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Assignment title" value={assignmentForm.title} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))} />
                <textarea className="w-full p-2 mt-3 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Description" value={assignmentForm.description} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))} />
                <div className="grid gap-3 mt-3 sm:grid-cols-2">
                  <input type="number" min="1" className="p-2 text-white border rounded bg-stone-900 border-fuchsia-700" placeholder="Max Marks" value={assignmentForm.maxMarks} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, maxMarks: event.target.value }))} />
                  <input type="datetime-local" className="p-2 text-white border rounded bg-stone-900 border-fuchsia-700" value={assignmentForm.dueAt} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, dueAt: event.target.value }))} />
                </div>
                <button type="submit" className="px-3 py-2 mt-3 rounded bg-fuchsia-700 disabled:opacity-60" disabled={savingAssignment}>{savingAssignment ? "Creating..." : "Create Assignment"}</button>
              </form>

              <div className="p-4 border rounded-lg border-fuchsia-700 bg-stone-950">
                <h3 className="text-2xl">Current Assignments</h3>
                {assignments.length === 0 ? <p className="mt-3 text-gray-400">No assignments created.</p> : assignments.map((item) => (
                  <div key={item.id || item._id} className="p-2 mt-2 border rounded border-stone-700 bg-black">
                    <p>{item.title}</p>
                    <p className="text-sm text-gray-300">Max: {item.maxMarks}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {loading ? <p className="mt-6">Loading quiz attempts...</p> : quizzes.map((quiz) => (
            <section key={quiz.id || quiz._id} className="p-4 mt-6 border rounded-lg border-fuchsia-700 bg-stone-950">
              <div className="flex justify-between">
                <div><h3 className="text-xl">{quiz.title}</h3><p className="text-sm text-gray-300">{quiz.description}</p></div>
                <div className="text-sm text-right text-gray-300"><p>Attempts: {quiz.stats?.attemptCount || 0}</p><p>Pass Rate: {Number(quiz.stats?.passRate || 0).toFixed(2)}%</p></div>
              </div>
              {(quiz.attempts || []).length === 0 ? <p className="mt-3 text-gray-400">No attempts yet.</p> : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[800px] border border-fuchsia-900">
                    <thead className="bg-fuchsia-900/20"><tr><th className="p-2 text-left border border-fuchsia-900">Student</th><th className="p-2 text-left border border-fuchsia-900">Score</th><th className="p-2 text-left border border-fuchsia-900">Result</th><th className="p-2 text-left border border-fuchsia-900">Action</th></tr></thead>
                    <tbody>
                      {(quiz.attempts || []).map((attempt) => {
                        const attemptId = String(attempt.id || attempt._id);
                        const expanded = !!expandedAttemptIds[attemptId];
                        const isPassed = Number(attempt.percentage || 0) >= Number(quiz.passPercentage || 0);
                        return (
                          <React.Fragment key={attemptId}>
                            <tr className="hover:bg-stone-900">
                              <td className="p-2 border border-fuchsia-900">{attempt.user?.username || "Student"}</td>
                              <td className="p-2 border border-fuchsia-900">{Number(attempt.score || 0).toFixed(2)} / {Number(attempt.totalMarks || 0).toFixed(2)}</td>
                              <td className="p-2 border border-fuchsia-900"><span className={isPassed ? "text-green-400" : "text-red-400"}>{isPassed ? "Pass" : "Fail"}</span></td>
                              <td className="p-2 border border-fuchsia-900"><button className="px-2 py-1 text-sm rounded bg-fuchsia-700" onClick={() => toggleAttemptDetails(attemptId)}>{expanded ? "Hide" : "View"} Answers</button></td>
                            </tr>
                            {expanded && <tr><td colSpan={4} className="p-3 border border-fuchsia-900 bg-black">{(attempt.breakdown || []).map((item) => <div key={`${attemptId}-${item.questionId}`} className="p-2 mt-2 border rounded border-stone-700 bg-stone-950"><p>{item.questionText}</p><p className="text-sm text-gray-300">Student: {formatAnswer(item.providedAnswer)} | Correct: {formatAnswer(item.correctAnswer)}</p></div>)}</td></tr>}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          {selectedCourse && (
            <div className="mt-6">
              <button className="px-4 py-2 text-white rounded bg-stone-800 hover:bg-stone-700" onClick={() => navigate(`/courses/${selectedCourse.slug || selectedCourse.id || selectedCourse._id}/quizzes`)}>
                Open Student Quiz Page
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InstructorQuizChecks;
