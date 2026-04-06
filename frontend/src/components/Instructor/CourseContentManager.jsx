import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { useCourses } from "../../context/CourseContext";
import { useAuth } from "../../context/AuthContext";

const defaultLessonDraft = {
  title: "",
  lessonType: "video",
  videoUrl: "",
  durationMinutes: "",
  content: "",
  isPreview: false
};

const CourseContentManager = ({ panel = "instructor" }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuth();
  const { fetchCourseById, getCourseById, fetchCourseContent } = useCourses();

  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const [moduleDraft, setModuleDraft] = useState({ title: "", description: "" });
  const [lessonDraftByModule, setLessonDraftByModule] = useState({});
  const [busyAction, setBusyAction] = useState("");

  const course = getCourseById(courseId);
  const backRoute = panel === "admin" ? "/admin/courses" : "/instructor/courses";

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    setError("");
    await fetchCourseById(courseId);
    const contentRes = await fetchCourseContent(courseId);
    setModules(contentRes?.modules || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadContent().catch((err) => {
      setError(err?.message || "Failed to load course content.");
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const addModule = async (event) => {
    event.preventDefault();
    if (!moduleDraft.title.trim()) {
      setError("Module title is required.");
      return;
    }

    setBusyAction("module");
    setError("");

    try {
      await api.post(
        `/courses/${courseId}/modules`,
        {
          title: moduleDraft.title.trim(),
          description: moduleDraft.description.trim()
        },
        { headers: authHeaders }
      );

      setModuleDraft({ title: "", description: "" });
      await loadContent();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add module.");
    }

    setBusyAction("");
  };

  const updateLessonDraft = (moduleId, field, value) => {
    setLessonDraftByModule((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || defaultLessonDraft),
        [field]: value
      }
    }));
  };

  const addLesson = async (event, moduleId) => {
    event.preventDefault();
    const draft = lessonDraftByModule[moduleId] || defaultLessonDraft;
    if (!draft.title?.trim()) {
      setError("Lesson title is required.");
      return;
    }

    setBusyAction(`lesson-${moduleId}`);
    setError("");

    try {
      await api.post(
        `/modules/${moduleId}/lessons`,
        {
          title: draft.title.trim(),
          lessonType: draft.lessonType || "video",
          videoUrl: draft.videoUrl?.trim() || "",
          durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : null,
          content: draft.content?.trim() || "",
          isPreview: !!draft.isPreview
        },
        { headers: authHeaders }
      );

      setLessonDraftByModule((prev) => ({
        ...prev,
        [moduleId]: { ...defaultLessonDraft }
      }));
      await loadContent();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add lesson.");
    }

    setBusyAction("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        Loading content manager...
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 text-white bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Course Content Manager</h1>
            <p className="mt-1 text-sm text-gray-300">
              {course?.name || course?.title || "Course"} | Logged in as {user?.role}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 text-sm text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
              onClick={() => navigate(`/courses/${courseId}/syllabus`)}
            >
              Open Learning View
            </button>
            <button
              className="px-4 py-2 text-sm text-white rounded-lg bg-stone-700 hover:bg-stone-600"
              onClick={() => navigate(backRoute)}
            >
              Back
            </button>
          </div>
        </div>

        {error && (
          <p className="p-3 mt-4 text-red-300 border rounded-lg bg-red-950/30 border-red-800">{error}</p>
        )}

        <section className="p-5 mt-6 border rounded-xl border-fuchsia-700 bg-stone-950">
          <h2 className="text-xl font-semibold">Add New Module</h2>
          <form className="grid gap-3 mt-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={addModule}>
            <input
              type="text"
              placeholder="Module title"
              className="p-3 text-white border rounded-lg bg-black border-stone-700"
              value={moduleDraft.title}
              onChange={(event) => setModuleDraft((prev) => ({ ...prev, title: event.target.value }))}
            />
            <input
              type="text"
              placeholder="Module description"
              className="p-3 text-white border rounded-lg bg-black border-stone-700"
              value={moduleDraft.description}
              onChange={(event) => setModuleDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
            <button
              type="submit"
              className="px-4 py-3 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60"
              disabled={busyAction === "module"}
            >
              {busyAction === "module" ? "Adding..." : "Add Module"}
            </button>
          </form>
        </section>

        <section className="mt-6 space-y-5">
          {modules.length === 0 ? (
            <div className="p-5 border rounded-xl border-fuchsia-700 bg-stone-950">
              No modules yet. Add your first module above.
            </div>
          ) : (
            modules.map((module) => {
              const lessonDraft = lessonDraftByModule[module.id] || defaultLessonDraft;
              return (
                <article key={module.id} className="p-5 border rounded-xl border-fuchsia-700 bg-stone-950">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{module.title}</h3>
                      <p className="mt-1 text-sm text-gray-300">{module.description || "No description"}</p>
                    </div>
                    <p className="text-sm text-gray-400">Lessons: {(module.lessons || []).length}</p>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {(module.lessons || []).map((lesson) => (
                      <li key={lesson.id} className="p-3 rounded-lg bg-black">
                        <p className="font-medium">{lesson.title}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {lesson.lessonType}
                          {lesson.videoUrl ? " | Video URL added" : " | No video URL"}
                          {lesson.isPreview ? " | Preview" : ""}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <form className="grid gap-3 mt-4 md:grid-cols-2" onSubmit={(event) => addLesson(event, module.id)}>
                    <input
                      type="text"
                      placeholder="Lesson title"
                      className="p-3 text-white border rounded-lg bg-black border-stone-700"
                      value={lessonDraft.title}
                      onChange={(event) => updateLessonDraft(module.id, "title", event.target.value)}
                    />
                    <select
                      className="p-3 text-white border rounded-lg bg-black border-stone-700"
                      value={lessonDraft.lessonType}
                      onChange={(event) => updateLessonDraft(module.id, "lessonType", event.target.value)}
                    >
                      <option value="video">Video</option>
                      <option value="article">Article</option>
                      <option value="live">Live</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Video URL (YouTube or MP4 URL)"
                      className="p-3 text-white border rounded-lg bg-black border-stone-700 md:col-span-2"
                      value={lessonDraft.videoUrl}
                      onChange={(event) => updateLessonDraft(module.id, "videoUrl", event.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Duration in minutes"
                      className="p-3 text-white border rounded-lg bg-black border-stone-700"
                      value={lessonDraft.durationMinutes}
                      onChange={(event) => updateLessonDraft(module.id, "durationMinutes", event.target.value)}
                    />
                    <label className="flex items-center gap-2 p-3 text-sm border rounded-lg border-stone-700">
                      <input
                        type="checkbox"
                        checked={!!lessonDraft.isPreview}
                        onChange={(event) => updateLessonDraft(module.id, "isPreview", event.target.checked)}
                      />
                      Mark as preview lesson
                    </label>
                    <textarea
                      placeholder="Lesson notes/content"
                      className="h-24 p-3 text-white border rounded-lg resize-none bg-black border-stone-700 md:col-span-2"
                      value={lessonDraft.content}
                      onChange={(event) => updateLessonDraft(module.id, "content", event.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 md:col-span-2 disabled:opacity-60"
                      disabled={busyAction === `lesson-${module.id}`}
                    >
                      {busyAction === `lesson-${module.id}` ? "Adding Lesson..." : "Add Lesson"}
                    </button>
                  </form>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
};

export default CourseContentManager;
