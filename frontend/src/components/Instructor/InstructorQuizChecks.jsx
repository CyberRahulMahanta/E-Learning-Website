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

const parseCsv = (text) => String(text || "").split(",").map((v) => v.trim()).filter(Boolean);
const normalizeReviewStatus = (status) => (["reviewed", "accepted", "rejected"].includes(status) ? status : "reviewed");

const InstructorQuizChecks = () => {
  const navigate = useNavigate();
  const api = useApi();
  const { user, logout } = useAuth();
  const { createCourseQuiz, createCourseAssignment, fetchCourseAssignments } = useCourses();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [courseModules, setCourseModules] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [expandedAttemptIds, setExpandedAttemptIds] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingQuizId, setEditingQuizId] = useState(null);
  const [replaceQuizQuestions, setReplaceQuizQuestions] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [reviewDraftBySubmission, setReviewDraftBySubmission] = useState({});

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passPercentage: 60,
    timeLimitMinutes: "",
    isFinalAssessment: false,
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

  const selectedModule = useMemo(
    () => courseModules.find((module) => String(module.id) === String(selectedModuleId)) || null,
    [courseModules, selectedModuleId]
  );

  const selectedModuleLessons = useMemo(
    () => (selectedModule?.lessons || []),
    [selectedModule]
  );

  const clearFormSelections = () => {
    setSelectedModuleId("");
    setSelectedLessonId("");
  };

  const loadCourses = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let list = [];
      if ((user.role || "") === "admin") {
        const response = await api.get("/courses?limit=300&published=all", { headers });
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
      setError(err?.response?.data?.message || "Failed to load courses.");
    }
  }, [api, user, selectedCourseId]);

  const loadCourseData = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [quizRes, assignmentRes, assignmentSubRes, contentRes] = await Promise.all([
        api.get(`/courses/${courseId}/quiz-attempts`, { headers }),
        fetchCourseAssignments(courseId),
        api.get(`/courses/${courseId}/assignment-submissions`, { headers }),
        api.get(`/courses/${courseId}/content`, { headers })
      ]);
      setQuizzes(quizRes?.data?.quizzes || []);
      setAssignments(assignmentRes?.assignments || []);
      setAssignmentSubmissions(assignmentSubRes?.data?.assignments || []);
      setCourseModules(contentRes?.data?.modules || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load quiz/assignment data.");
      setQuizzes([]);
      setAssignments([]);
      setAssignmentSubmissions([]);
      setCourseModules([]);
    } finally {
      setLoading(false);
    }
  }, [api, fetchCourseAssignments]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      clearFormSelections();
      setEditingQuizId(null);
      setEditingAssignmentId(null);
      setReplaceQuizQuestions(false);
      loadCourseData(selectedCourseId);
    }
  }, [selectedCourseId, loadCourseData]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const setInfo = (nextError = "", nextSuccess = "") => {
    setError(nextError);
    setSuccess(nextSuccess);
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: "",
      description: "",
      passPercentage: 60,
      timeLimitMinutes: "",
      isFinalAssessment: false,
      questions: [emptyQuestion()]
    });
    setEditingQuizId(null);
    setReplaceQuizQuestions(false);
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: "",
      description: "",
      maxMarks: 100,
      dueAt: ""
    });
    setEditingAssignmentId(null);
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

  const buildQuestionsPayload = () => {
    const questions = [];
    for (let i = 0; i < quizForm.questions.length; i += 1) {
      const q = quizForm.questions[i];
      if (!q.questionText.trim()) return { error: `Question ${i + 1} text is required.` };
      const type = q.questionType || "single";
      const options = type === "text" ? null : parseCsv(q.optionsText);
      if (type !== "text" && options.length < 2) return { error: `Question ${i + 1} needs at least 2 options.` };
      const correctAnswer = type === "multiple" ? parseCsv(q.correctAnswerText) : q.correctAnswerText.trim();
      if ((type === "multiple" && correctAnswer.length === 0) || (type !== "multiple" && !correctAnswer)) {
        return { error: `Question ${i + 1} correct answer is required.` };
      }
      questions.push({
        questionText: q.questionText.trim(),
        questionType: type,
        options,
        correctAnswer,
        marks: Number(q.marks || 1),
        sortOrder: i + 1
      });
    }
    return { questions };
  };

  const submitQuiz = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) return setInfo("Select a course.", "");
    if (!quizForm.title.trim()) return setInfo("Quiz title is required.", "");
    setSaving(true);
    setInfo("", "");

    const payload = {
      title: quizForm.title.trim(),
      description: quizForm.description.trim(),
      passPercentage: Number(quizForm.passPercentage || 60),
      timeLimitMinutes: quizForm.timeLimitMinutes ? Number(quizForm.timeLimitMinutes) : null,
      moduleId: quizForm.isFinalAssessment ? null : (selectedModuleId ? Number(selectedModuleId) : null),
      lessonId: quizForm.isFinalAssessment ? null : (selectedLessonId ? Number(selectedLessonId) : null),
      isFinalAssessment: !!quizForm.isFinalAssessment
    };

    if (!editingQuizId || replaceQuizQuestions) {
      const parsed = buildQuestionsPayload();
      if (parsed.error) {
        setSaving(false);
        return setInfo(parsed.error, "");
      }
      payload.questions = parsed.questions;
    }

    try {
      if (editingQuizId) {
        const token = localStorage.getItem("token");
        await api.put(`/quizzes/${editingQuizId}`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setInfo("", "Quiz updated.");
      } else {
        const result = await createCourseQuiz(selectedCourseId, payload);
        if (!result.success) throw new Error(result.error || "Failed to create quiz.");
        setInfo("", "Quiz created.");
      }
      resetQuizForm();
      await loadCourseData(selectedCourseId);
    } catch (err) {
      setInfo(err?.response?.data?.message || err?.message || "Failed to save quiz.", "");
    } finally {
      setSaving(false);
    }
  };

  const startQuizEdit = (quiz) => {
    setEditingQuizId(quiz.id || quiz._id);
    setQuizForm({
      title: quiz.title || "",
      description: quiz.description || "",
      passPercentage: Number(quiz.passPercentage || 60),
      timeLimitMinutes: quiz.timeLimitMinutes || "",
      isFinalAssessment: !!quiz.isFinalAssessment,
      questions: [emptyQuestion()]
    });
    setReplaceQuizQuestions(false);
    setSelectedModuleId(quiz.moduleId ? String(quiz.moduleId) : "");
    setSelectedLessonId(quiz.lessonId ? String(quiz.lessonId) : "");
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm("Delete this quiz?")) return;
    setSaving(true);
    setInfo("", "");
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/quizzes/${quizId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setInfo("", "Quiz deleted.");
      await loadCourseData(selectedCourseId);
    } catch (err) {
      setInfo(err?.response?.data?.message || "Failed to delete quiz.", "");
    } finally {
      setSaving(false);
    }
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) return setInfo("Select a course.", "");
    if (!assignmentForm.title.trim()) return setInfo("Assignment title is required.", "");
    setSaving(true);
    setInfo("", "");
    try {
      if (editingAssignmentId) {
        const token = localStorage.getItem("token");
        await api.put(`/assignments/${editingAssignmentId}`, {
          title: assignmentForm.title.trim(),
          description: assignmentForm.description.trim(),
          maxMarks: Number(assignmentForm.maxMarks || 100),
          dueAt: assignmentForm.dueAt || null,
          moduleId: selectedModuleId ? Number(selectedModuleId) : null,
          lessonId: selectedLessonId ? Number(selectedLessonId) : null
        }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setInfo("", "Assignment updated.");
      } else {
        const result = await createCourseAssignment(selectedCourseId, {
          title: assignmentForm.title.trim(),
          description: assignmentForm.description.trim(),
          maxMarks: Number(assignmentForm.maxMarks || 100),
          dueAt: assignmentForm.dueAt || null,
          moduleId: selectedModuleId ? Number(selectedModuleId) : null,
          lessonId: selectedLessonId ? Number(selectedLessonId) : null
        });
        if (!result.success) throw new Error(result.error || "Failed to create assignment.");
        setInfo("", "Assignment created.");
      }
      resetAssignmentForm();
      await loadCourseData(selectedCourseId);
    } catch (err) {
      setInfo(err?.response?.data?.message || err?.message || "Failed to save assignment.", "");
    } finally {
      setSaving(false);
    }
  };

  const startAssignmentEdit = (assignment) => {
    setEditingAssignmentId(assignment.id || assignment._id);
    setAssignmentForm({
      title: assignment.title || "",
      description: assignment.description || "",
      maxMarks: Number(assignment.maxMarks || 100),
      dueAt: assignment.dueAt ? String(assignment.dueAt).slice(0, 16) : ""
    });
    setSelectedModuleId(assignment.moduleId ? String(assignment.moduleId) : "");
    setSelectedLessonId(assignment.lessonId ? String(assignment.lessonId) : "");
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment?")) return;
    setSaving(true);
    setInfo("", "");
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/assignments/${assignmentId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setInfo("", "Assignment deleted.");
      await loadCourseData(selectedCourseId);
    } catch (err) {
      setInfo(err?.response?.data?.message || "Failed to delete assignment.", "");
    } finally {
      setSaving(false);
    }
  };

  const openReviewDraft = (submission) => {
    setReviewDraftBySubmission((prev) => ({
      ...prev,
      [submission.id]: {
        status: normalizeReviewStatus(submission.status),
        marks: submission.marks ?? "",
        feedback: submission.feedback || ""
      }
    }));
  };

  const saveSubmissionReview = async (submission) => {
    const draft = reviewDraftBySubmission[submission.id] || {};
    setSaving(true);
    setInfo("", "");
    try {
      const token = localStorage.getItem("token");
      await api.put(`/assignment-submissions/${submission.id}/review`, {
        status: draft.status || "reviewed",
        marks: draft.marks === "" ? null : Number(draft.marks),
        feedback: draft.feedback || ""
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setInfo("", "Submission reviewed.");
      await loadCourseData(selectedCourseId);
    } catch (err) {
      setInfo(err?.response?.data?.message || "Failed to review submission.", "");
    } finally {
      setSaving(false);
    }
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

      <div className="flex-1 p-6">
        <h2 className="text-3xl">Assessment Manager</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          <select className="p-2 text-white border rounded bg-stone-900 border-fuchsia-700" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
            {courses.map((course) => <option key={course.id || course._id} value={String(course.id || course._id)}>{course.name}</option>)}
          </select>
          <select className="p-2 text-white border rounded bg-stone-900 border-fuchsia-700" value={selectedModuleId} onChange={(e) => { setSelectedModuleId(e.target.value); setSelectedLessonId(""); }}>
            <option value="">No module</option>
            {courseModules.map((module) => <option key={module.id} value={String(module.id)}>{module.title}</option>)}
          </select>
          <select className="p-2 text-white border rounded bg-stone-900 border-fuchsia-700" value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)}>
            <option value="">No lesson</option>
            {selectedModuleLessons.map((lesson) => <option key={lesson.id} value={String(lesson.id)}>{lesson.title}</option>)}
          </select>
        </div>
        {error ? <p className="mt-3 text-red-400">{error}</p> : null}
        {success ? <p className="mt-3 text-green-400">{success}</p> : null}

        <div className="grid gap-4 mt-4 lg:grid-cols-2">
          <form onSubmit={submitQuiz} className="p-4 border rounded border-fuchsia-700 bg-stone-950">
            <h3 className="text-xl">{editingQuizId ? "Edit Quiz" : "Create Quiz"}</h3>
            <input className="w-full p-2 mt-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Title" value={quizForm.title} onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))} />
            <textarea className="w-full p-2 mt-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Description" value={quizForm.description} onChange={(e) => setQuizForm((p) => ({ ...p, description: e.target.value }))} />
            <div className="grid gap-2 mt-2 sm:grid-cols-2">
              <input type="number" min="0" max="100" className="p-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Pass %" value={quizForm.passPercentage} onChange={(e) => setQuizForm((p) => ({ ...p, passPercentage: e.target.value }))} />
              <input type="number" min="1" className="p-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Time limit minutes" value={quizForm.timeLimitMinutes} onChange={(e) => setQuizForm((p) => ({ ...p, timeLimitMinutes: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={!!quizForm.isFinalAssessment} onChange={(e) => setQuizForm((p) => ({ ...p, isFinalAssessment: e.target.checked }))} /> Final Assessment</label>
            {editingQuizId ? <label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={replaceQuizQuestions} onChange={(e) => setReplaceQuizQuestions(e.target.checked)} /> Replace all questions</label> : null}

            {(!editingQuizId || replaceQuizQuestions) ? (
              <div className="mt-2 space-y-2">
                {quizForm.questions.map((q, idx) => (
                  <div key={`q-${idx}`} className="p-2 border rounded border-stone-700 bg-black">
                    <input className="w-full p-2 border rounded bg-stone-900 border-fuchsia-700" placeholder={`Question ${idx + 1}`} value={q.questionText} onChange={(e) => updateQuestion(idx, "questionText", e.target.value)} />
                    <select className="w-full p-2 mt-2 border rounded bg-stone-900 border-fuchsia-700" value={q.questionType} onChange={(e) => updateQuestion(idx, "questionType", e.target.value)}>
                      <option value="single">Single</option><option value="multiple">Multiple</option><option value="text">Text</option>
                    </select>
                    {q.questionType !== "text" ? <input className="w-full p-2 mt-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Options: A, B, C" value={q.optionsText} onChange={(e) => updateQuestion(idx, "optionsText", e.target.value)} /> : null}
                    <input className="w-full p-2 mt-2 border rounded bg-stone-900 border-fuchsia-700" placeholder={q.questionType === "multiple" ? "Correct: A, C" : "Correct: A"} value={q.correctAnswerText} onChange={(e) => updateQuestion(idx, "correctAnswerText", e.target.value)} />
                    <div className="flex gap-2 mt-2">
                      <input type="number" min="1" className="w-full p-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Marks" value={q.marks} onChange={(e) => updateQuestion(idx, "marks", e.target.value)} />
                      {quizForm.questions.length > 1 ? <button type="button" className="px-3 py-2 text-sm bg-red-700 rounded hover:bg-red-600" onClick={() => removeQuestion(idx)}>Remove</button> : null}
                    </div>
                  </div>
                ))}
                <button type="button" className="px-3 py-2 text-sm rounded bg-stone-800 hover:bg-stone-700" onClick={addQuestion}>Add Question</button>
              </div>
            ) : <p className="mt-2 text-xs text-yellow-300">Question data is preserved unless you enable "Replace all questions".</p>}

            <div className="flex gap-2 mt-3">
              <button type="submit" className="px-3 py-2 rounded bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60" disabled={saving}>{editingQuizId ? "Save Quiz" : "Create Quiz"}</button>
              {editingQuizId ? <button type="button" className="px-3 py-2 rounded bg-stone-700 hover:bg-stone-600" onClick={resetQuizForm}>Cancel</button> : null}
            </div>
          </form>

          <form onSubmit={submitAssignment} className="p-4 border rounded border-fuchsia-700 bg-stone-950">
            <h3 className="text-xl">{editingAssignmentId ? "Edit Assignment" : "Create Assignment"}</h3>
            <input className="w-full p-2 mt-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Title" value={assignmentForm.title} onChange={(e) => setAssignmentForm((p) => ({ ...p, title: e.target.value }))} />
            <textarea className="w-full p-2 mt-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Description" value={assignmentForm.description} onChange={(e) => setAssignmentForm((p) => ({ ...p, description: e.target.value }))} />
            <div className="grid gap-2 mt-2 sm:grid-cols-2">
              <input type="number" min="1" className="p-2 border rounded bg-stone-900 border-fuchsia-700" placeholder="Max marks" value={assignmentForm.maxMarks} onChange={(e) => setAssignmentForm((p) => ({ ...p, maxMarks: e.target.value }))} />
              <input type="datetime-local" className="p-2 border rounded bg-stone-900 border-fuchsia-700" value={assignmentForm.dueAt} onChange={(e) => setAssignmentForm((p) => ({ ...p, dueAt: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-3">
              <button type="submit" className="px-3 py-2 rounded bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60" disabled={saving}>{editingAssignmentId ? "Save Assignment" : "Create Assignment"}</button>
              {editingAssignmentId ? <button type="button" className="px-3 py-2 rounded bg-stone-700 hover:bg-stone-600" onClick={resetAssignmentForm}>Cancel</button> : null}
            </div>
          </form>
        </div>

        <div className="grid gap-4 mt-6 lg:grid-cols-2">
          <section className="p-4 border rounded border-fuchsia-700 bg-stone-950">
            <h3 className="text-xl">Quizzes ({quizzes.length})</h3>
            {loading ? <p className="mt-2 text-gray-400">Loading...</p> : quizzes.map((quiz) => (
              <div key={quiz.id || quiz._id} className="p-2 mt-2 border rounded border-stone-700 bg-black">
                <div className="flex items-center justify-between gap-2">
                  <div><p>{quiz.title}</p><p className="text-xs text-gray-400">Attempts: {quiz.stats?.attemptCount || 0} | Pass: {Number(quiz.passPercentage || 0)}%</p></div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-xs rounded bg-stone-700 hover:bg-stone-600" onClick={() => startQuizEdit(quiz)}>Edit</button>
                    <button className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600" onClick={() => deleteQuiz(quiz.id || quiz._id)}>Delete</button>
                  </div>
                </div>
                {(quiz.attempts || []).map((attempt) => {
                  const attemptId = String(attempt.id || attempt._id);
                  const expanded = !!expandedAttemptIds[attemptId];
                  return (
                    <div key={attemptId} className="p-2 mt-2 border rounded border-stone-700">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>{attempt.user?.username || "Student"} | {Number(attempt.score || 0)} / {Number(attempt.totalMarks || 0)}</span>
                        <button className="px-2 py-1 text-xs rounded bg-fuchsia-700 hover:bg-fuchsia-600" onClick={() => toggleAttemptDetails(attemptId)}>{expanded ? "Hide" : "View"} Answers</button>
                      </div>
                      {expanded ? (
                        <div className="mt-2 space-y-2">
                          {(attempt.breakdown || []).map((item) => (
                            <div key={`${attemptId}-${item.questionId}`} className="p-2 text-xs border rounded border-stone-700 bg-stone-950">
                              <p>{item.questionText}</p>
                              <p className="text-gray-400">Student: {formatAnswer(item.providedAnswer)} | Correct: {formatAnswer(item.correctAnswer)}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </section>

          <section className="p-4 border rounded border-fuchsia-700 bg-stone-950">
            <h3 className="text-xl">Assignments ({assignments.length})</h3>
            {loading ? <p className="mt-2 text-gray-400">Loading...</p> : assignments.map((assignment) => (
              <div key={assignment.id || assignment._id} className="p-2 mt-2 border rounded border-stone-700 bg-black">
                <div className="flex items-center justify-between gap-2">
                  <div><p>{assignment.title}</p><p className="text-xs text-gray-400">Max: {assignment.maxMarks} | Due: {assignment.dueAt ? String(assignment.dueAt) : "N/A"}</p></div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-xs rounded bg-stone-700 hover:bg-stone-600" onClick={() => startAssignmentEdit(assignment)}>Edit</button>
                    <button className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600" onClick={() => deleteAssignment(assignment.id || assignment._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>

        <section className="p-4 mt-6 border rounded border-fuchsia-700 bg-stone-950">
          <h3 className="text-xl">Submission Reviews</h3>
          {assignmentSubmissions.length === 0 ? <p className="mt-2 text-gray-400">No assignment submissions yet.</p> : assignmentSubmissions.map((assignment) => (
            <div key={assignment.id || assignment._id} className="p-3 mt-3 border rounded border-stone-700 bg-black">
              <p className="font-medium">{assignment.title}</p>
              {(assignment.submissions || []).length === 0 ? <p className="mt-1 text-xs text-gray-400">No submissions yet.</p> : assignment.submissions.map((submission) => {
                const draft = reviewDraftBySubmission[submission.id] || { status: normalizeReviewStatus(submission.status), marks: submission.marks ?? "", feedback: submission.feedback || "" };
                return (
                  <div key={submission.id} className="p-2 mt-2 border rounded border-stone-700 bg-stone-950">
                    <p className="text-sm">{submission.user?.username} ({submission.user?.email})</p>
                    <p className="mt-1 text-xs text-gray-400">Submitted: {submission.submittedAt || "-"}</p>
                    <div className="grid gap-2 mt-2 md:grid-cols-3">
                      <select className="p-2 text-xs border rounded bg-black border-stone-700" value={draft.status} onChange={(e) => setReviewDraftBySubmission((prev) => ({ ...prev, [submission.id]: { ...draft, status: e.target.value } }))}>
                        <option value="reviewed">reviewed</option><option value="accepted">accepted</option><option value="rejected">rejected</option>
                      </select>
                      <input type="number" min="0" className="p-2 text-xs border rounded bg-black border-stone-700" placeholder="Marks" value={draft.marks} onChange={(e) => setReviewDraftBySubmission((prev) => ({ ...prev, [submission.id]: { ...draft, marks: e.target.value } }))} />
                      <button className="px-3 py-2 text-xs rounded bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60" disabled={saving} onClick={() => saveSubmissionReview(submission)}>Save Review</button>
                    </div>
                    <textarea className="w-full h-16 p-2 mt-2 text-xs border rounded resize-none bg-black border-stone-700" placeholder="Feedback" value={draft.feedback} onChange={(e) => setReviewDraftBySubmission((prev) => ({ ...prev, [submission.id]: { ...draft, feedback: e.target.value } }))} />
                    {!reviewDraftBySubmission[submission.id] ? <button className="px-2 py-1 mt-2 text-xs rounded bg-stone-700 hover:bg-stone-600" onClick={() => openReviewDraft(submission)}>Load Draft</button> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </section>

        {selectedCourse ? (
          <div className="mt-6">
            <button className="px-4 py-2 text-white rounded bg-stone-800 hover:bg-stone-700" onClick={() => navigate(`/courses/${selectedCourse.slug || selectedCourse.id || selectedCourse._id}/quizzes`)}>
              Open Student Quiz Page
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default InstructorQuizChecks;
