import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./UnifiedNavbar";
import Loader from "./Loader";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";
import { buildAssetUrl } from "../config/api";

const PROGRESS_SYNC_GAP_SECONDS = 12;
const COMPLETION_THRESHOLD = 95;

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (host.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.includes("/embed/")) return url;
    }
  } catch {
    return "";
  }
  return "";
};

const getPlayableVideoUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  return buildAssetUrl(url);
};

const SyllabusPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    fetchCourseById,
    getCourseById,
    fetchCourseContent,
    fetchCourseFlowStatus,
    fetchCourseProgress,
    updateLessonProgress,
    fetchCourseCertificate,
    isLoading
  } = useCourses();

  const [modules, setModules] = useState([]);
  const [fullAccess, setFullAccess] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [courseProgress, setCourseProgress] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [flowSteps, setFlowSteps] = useState([]);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [pageError, setPageError] = useState("");
  const [syncingLessonId, setSyncingLessonId] = useState(null);

  const videoRef = useRef(null);
  const lastSyncMapRef = useRef({});

  const course = getCourseById(courseId);

  const lessons = useMemo(() => {
    return modules.flatMap((module) =>
      (module.lessons || []).map((lesson) => ({
        ...lesson,
        moduleTitle: module.title
      }))
    );
  }, [modules]);

  const activeLesson = useMemo(() => {
    if (!lessons.length) return null;
    return lessons.find((lesson) => String(lesson.id) === String(activeLessonId)) || lessons[0];
  }, [lessons, activeLessonId]);

  const computedProgress = useMemo(() => {
    if (courseProgress) return courseProgress;
    const totalLessons = lessons.length;
    if (totalLessons === 0) {
      return {
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 0,
        status: "not_started"
      };
    }
    const completedLessons = lessons.reduce((count, lesson) => {
      return progressMap[lesson.id]?.status === "completed" ? count + 1 : count;
    }, 0);
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 10000) / 100 : 0;
    return {
      progressPercent,
      completedLessons,
      totalLessons,
      status: progressPercent >= 100 ? "completed" : progressPercent > 0 ? "in_progress" : "not_started"
    };
  }, [courseProgress, lessons, progressMap]);

  const pickInitialLessonId = useCallback((lessonList, lessonProgressMap) => {
    if (!lessonList.length) return null;

    const inProgressLesson = lessonList.find((lesson) => lessonProgressMap[lesson.id]?.status === "in_progress");
    if (inProgressLesson) return inProgressLesson.id;

    const firstIncomplete = lessonList.find((lesson) => lessonProgressMap[lesson.id]?.status !== "completed");
    if (firstIncomplete) return firstIncomplete.id;

    return lessonList[0].id;
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setPageError("");
      await fetchCourseById(courseId);

      const contentRes = await fetchCourseContent(courseId);
      if (!active) return;

      const nextModules = contentRes?.modules || [];
      setModules(nextModules);
      setFullAccess(!!contentRes?.fullAccess);

      let nextProgressMap = {};
      let nextCourseProgress = null;
      let nextCertificate = null;
      let nextFlowSteps = [];

      if (isAuthenticated && contentRes?.fullAccess) {
        const [progressRes, certRes, flowRes] = await Promise.all([
          fetchCourseProgress(courseId),
          fetchCourseCertificate(courseId),
          fetchCourseFlowStatus(courseId)
        ]);
        if (!active) return;

        if (progressRes.success) {
          const lessonProgress = progressRes?.data?.lessonProgress || [];
          nextProgressMap = lessonProgress.reduce((map, item) => {
            map[item.lessonId] = item;
            return map;
          }, {});
          nextCourseProgress = progressRes?.data?.courseProgress || null;
          nextCertificate = progressRes?.data?.certificate || null;
        }

        if (certRes.success && certRes?.data?.certificate) {
          nextCertificate = certRes.data.certificate;
        }

        if (flowRes.success) {
          nextFlowSteps = flowRes?.data?.flow || [];
          if (flowRes?.data?.certificate) {
            nextCertificate = flowRes.data.certificate;
          }
        }
      }

      setProgressMap(nextProgressMap);
      setCourseProgress(nextCourseProgress);
      setCertificate(nextCertificate || null);
      setFlowSteps(nextFlowSteps);

      const nextLessons = nextModules.flatMap((module) => module.lessons || []);
      setActiveLessonId(pickInitialLessonId(nextLessons, nextProgressMap));
    };

    load().catch((error) => {
      if (!active) return;
      setPageError(error?.message || "Failed to load course learning content.");
    });

    return () => {
      active = false;
    };
  }, [
    courseId,
    fetchCourseById,
    fetchCourseContent,
    fetchCourseFlowStatus,
    fetchCourseProgress,
    fetchCourseCertificate,
    isAuthenticated,
    pickInitialLessonId
  ]);

  const syncLessonProgress = useCallback(async (lesson, options = {}) => {
    if (!lesson || !isAuthenticated || !fullAccess) return;

    const { force = false, markCompleted = false } = options;
    const player = videoRef.current;
    const existing = progressMap[lesson.id] || {};
    const videoUrl = lesson.videoUrl || "";
    const isYouTube = !!getYouTubeEmbedUrl(videoUrl);

    let currentSecond = Number(existing.lastWatchedSecond || 0);
    let progressPercent = Number(existing.progressPercent || 0);

    if (!isYouTube && player && Number.isFinite(player.currentTime)) {
      currentSecond = Math.max(0, Math.floor(player.currentTime || 0));
      const durationSeconds = Number.isFinite(player.duration) && player.duration > 0
        ? player.duration
        : (Number(lesson.durationMinutes || 0) * 60);
      if (durationSeconds > 0) {
        progressPercent = (currentSecond / durationSeconds) * 100;
      }
    }

    progressPercent = Math.max(0, Math.min(100, markCompleted ? 100 : progressPercent));
    const roundedPercent = Math.round(progressPercent * 100) / 100;

    const status = markCompleted || roundedPercent >= COMPLETION_THRESHOLD
      ? "completed"
      : roundedPercent > 0
        ? "in_progress"
        : "not_started";

    const lastSnapshot = lastSyncMapRef.current[lesson.id];
    const shouldSkip = !force &&
      lastSnapshot &&
      lastSnapshot.status === status &&
      Math.abs(lastSnapshot.progressPercent - roundedPercent) < 2 &&
      Math.abs(lastSnapshot.lastWatchedSecond - currentSecond) < PROGRESS_SYNC_GAP_SECONDS;
    if (shouldSkip) return;

    lastSyncMapRef.current[lesson.id] = {
      progressPercent: roundedPercent,
      lastWatchedSecond: currentSecond,
      status
    };

    setSyncingLessonId(lesson.id);
    const result = await updateLessonProgress(lesson.id, {
      progressPercent: status === "completed" ? 100 : roundedPercent,
      lastWatchedSecond: currentSecond,
      status
    });

    if (result.success) {
      const lessonProgress = result?.data?.lessonProgress || {};
      setProgressMap((prev) => ({
        ...prev,
        [lesson.id]: {
          ...(prev[lesson.id] || {}),
          ...lessonProgress
        }
      }));
      if (result?.data?.courseProgress) {
        setCourseProgress(result.data.courseProgress);
      }
      if (result?.data?.certificate) {
        setCertificate(result.data.certificate);
      }
      if (result?.data?.completion && flowSteps.length > 0) {
        setFlowSteps((prev) => prev.map((step) => {
          if (step.key === "lessons") {
            const lessons = result.data.completion.steps?.lessons || {};
            return {
              ...step,
              passed: !!lessons.passed,
              required: Number(lessons.required || 0),
              completed: Number(lessons.completed || 0)
            };
          }
          if (step.key === "certificate" && result?.data?.certificate) {
            return { ...step, passed: true, completed: 1 };
          }
          return step;
        }));
      }
      setPageError("");
    } else {
      setPageError(result.error || "Unable to sync progress.");
    }

    setSyncingLessonId(null);
  }, [flowSteps.length, fullAccess, isAuthenticated, progressMap, updateLessonProgress]);

  const handleLessonChange = async (nextLessonId) => {
    if (!nextLessonId || String(nextLessonId) === String(activeLessonId)) return;

    if (activeLesson) {
      await syncLessonProgress(activeLesson, { force: true });
    }
    setActiveLessonId(nextLessonId);
  };

  const handleVideoLoadedMetadata = () => {
    const player = videoRef.current;
    if (!player || !activeLesson) return;
    const lastWatched = Number(progressMap[activeLesson.id]?.lastWatchedSecond || 0);
    if (lastWatched > 0 && Number.isFinite(player.duration) && lastWatched < player.duration - 3) {
      player.currentTime = lastWatched;
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!activeLesson) return;
    syncLessonProgress(activeLesson);
  };

  const handleVideoEnded = () => {
    if (!activeLesson) return;
    syncLessonProgress(activeLesson, { force: true, markCompleted: true });
  };

  const manualComplete = () => {
    if (!activeLesson) return;
    syncLessonProgress(activeLesson, { force: true, markCompleted: true });
  };

  if (isLoading && !course) {
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

  const activeLessonProgress = activeLesson ? progressMap[activeLesson.id] : null;
  const activeVideoUrl = activeLesson?.videoUrl || "";
  const youtubeEmbedUrl = getYouTubeEmbedUrl(activeVideoUrl);
  const playableVideoUrl = getPlayableVideoUrl(activeVideoUrl);
  const showCertificateCard = computedProgress.progressPercent >= 100 || Boolean(certificate);

  return (
    <div className="min-h-screen px-6 pb-16 text-white bg-black">
      <Navbar />
      <div className="max-w-7xl pt-28 mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold">{course.title || course.name}</h1>
            <p className="mt-2 text-sm text-gray-300">
              Welcome, {user?.username || "Learner"}.
              {" "}
              Keep going consistently to complete your course.
            </p>
          </div>
          <button
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
            onClick={() => navigate(`/courses/${courseId}`)}
          >
            Back to Course
          </button>
        </div>

        <div className="p-5 mt-6 border rounded-2xl border-fuchsia-700 bg-stone-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-200">
              Progress:
              {" "}
              <span className="text-fuchsia-300">
                {Number(computedProgress.progressPercent || 0).toFixed(2)}%
              </span>
              {" "}
              ({computedProgress.completedLessons || 0}/{computedProgress.totalLessons || 0} lessons)
            </p>
            {!fullAccess && (
              <p className="text-sm text-yellow-300">Preview mode active. Enroll to unlock all lessons.</p>
            )}
          </div>
          <div className="w-full h-3 mt-3 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-3 transition-all duration-500 bg-fuchsia-600"
              style={{ width: `${Math.max(0, Math.min(100, Number(computedProgress.progressPercent || 0)))}%` }}
            />
          </div>
        </div>

        {flowSteps.length > 0 && (
          <section className="p-5 mt-6 border rounded-2xl border-fuchsia-700 bg-stone-950">
            <h2 className="text-xl font-semibold">Completion Flow</h2>
            <p className="mt-1 text-sm text-gray-300">
              Browse Courses, Enroll, Lessons, Module Quizzes, Assignments, Progress, Final Assessment, Certificate
            </p>
            <div className="grid gap-3 mt-4 md:grid-cols-2">
              {flowSteps.map((step) => (
                <div
                  key={step.key}
                  className={`p-3 rounded-lg border ${step.passed ? "border-green-600 bg-green-950/20" : "border-stone-700 bg-black"}`}
                >
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="mt-1 text-xs text-gray-300">
                    {Number(step.completed || 0)} / {Number(step.required || 0)} completed
                  </p>
                  <p className={`mt-1 text-xs ${step.passed ? "text-green-300" : "text-yellow-300"}`}>
                    {step.passed ? "Completed" : "Pending"}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                className="px-4 py-2 text-sm text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600"
                onClick={() => navigate(`/courses/${courseId}/quizzes`)}
              >
                Go to Quizzes
              </button>
              <button
                className="px-4 py-2 text-sm text-white rounded-lg bg-stone-700 hover:bg-stone-600"
                onClick={() => navigate(`/courses/${courseId}/assignments`)}
              >
                Go to Assignments
              </button>
              <button
                className="px-4 py-2 text-sm text-white rounded-lg bg-green-700 hover:bg-green-600"
                onClick={() => navigate(`/courses/${courseId}/certificate`)}
              >
                Check Certificate
              </button>
            </div>
          </section>
        )}

        {pageError && (
          <p className="p-3 mt-4 text-red-300 border rounded-lg bg-red-950/20 border-red-800">{pageError}</p>
        )}

        <div className="grid gap-6 mt-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="p-5 border rounded-2xl border-fuchsia-700 bg-stone-950">
            {activeLesson ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-fuchsia-300">{activeLesson.moduleTitle}</p>
                    <h2 className="text-2xl font-semibold">{activeLesson.title}</h2>
                    <p className="mt-2 text-sm text-gray-300">
                      Type: {activeLesson.lessonType}
                      {activeLesson.durationMinutes ? ` | Duration: ${activeLesson.durationMinutes} min` : ""}
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60"
                    disabled={!fullAccess || syncingLessonId === activeLesson.id}
                    onClick={manualComplete}
                  >
                    {activeLessonProgress?.status === "completed"
                      ? "Completed"
                      : syncingLessonId === activeLesson.id
                        ? "Saving..."
                        : "Mark Complete"}
                  </button>
                </div>

                <div className="mt-5 overflow-hidden border rounded-xl border-stone-800 bg-black">
                  {youtubeEmbedUrl ? (
                    <iframe
                      title={activeLesson.title}
                      src={youtubeEmbedUrl}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : playableVideoUrl ? (
                    <video
                      ref={videoRef}
                      src={playableVideoUrl}
                      controls
                      className="w-full aspect-video bg-black"
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPause={() => syncLessonProgress(activeLesson, { force: true })}
                      onEnded={handleVideoEnded}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full text-gray-300 aspect-video">
                      No video URL uploaded for this lesson yet.
                    </div>
                  )}
                </div>

                {activeLesson?.content && (
                  <div className="p-4 mt-5 border rounded-xl border-stone-800 bg-black">
                    <h3 className="text-lg font-semibold">Lesson Notes</h3>
                    <p className="mt-2 text-gray-300 whitespace-pre-wrap">{activeLesson.content}</p>
                  </div>
                )}

                {(activeLesson?.resources || []).length > 0 && (
                  <div className="p-4 mt-5 border rounded-xl border-stone-800 bg-black">
                    <h3 className="text-lg font-semibold">Resources</h3>
                    <ul className="mt-3 space-y-2">
                      {activeLesson.resources.map((resource) => (
                        <li key={resource.id} className="flex items-center justify-between gap-3 p-2 rounded bg-stone-900">
                          <span className="text-sm">{resource.title}</span>
                          <a
                            href={resource.resourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-fuchsia-300 hover:text-fuchsia-200"
                          >
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-300">No lessons are available in this course yet.</p>
            )}
          </section>

          <section className="p-5 border rounded-2xl border-fuchsia-700 bg-stone-950">
            <h2 className="text-xl font-semibold">Course Lessons</h2>
            <div className="mt-4 space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {modules.length === 0 ? (
                <p className="text-sm text-gray-400">No modules available yet.</p>
              ) : (
                modules.map((module) => (
                  <div key={module.id} className="p-3 rounded-lg bg-black">
                    <h3 className="text-base font-semibold">{module.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {(module.lessons || []).map((lesson) => {
                        const lessonState = progressMap[lesson.id]?.status || "not_started";
                        const isSelected = String(activeLesson?.id) === String(lesson.id);
                        const isCompleted = lessonState === "completed";
                        return (
                          <li key={lesson.id}>
                            <button
                              className={`w-full p-3 text-left rounded-lg border transition ${
                                isSelected
                                  ? "border-fuchsia-500 bg-stone-900"
                                  : "border-stone-800 bg-stone-950 hover:bg-stone-900"
                              }`}
                              onClick={() => handleLessonChange(lesson.id)}
                            >
                              <p className="text-sm font-medium">{lesson.title}</p>
                              <p className="mt-1 text-xs text-gray-400">
                                {lesson.lessonType}
                                {lesson.isPreview ? " | Preview" : ""}
                                {" | "}
                                <span className={isCompleted ? "text-green-400" : "text-gray-300"}>
                                  {isCompleted ? "Completed" : lessonState.replace("_", " ")}
                                </span>
                              </p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {showCertificateCard && (
          <section className="p-5 mt-6 border rounded-2xl border-green-700 bg-green-950/20">
            <h2 className="text-2xl font-semibold text-green-300">Course Completed</h2>
            <p className="mt-2 text-sm text-gray-200">
              Great work! You completed all lessons and your certificate is ready.
            </p>
            {certificate?.certificateCode && (
              <p className="mt-2 text-sm text-gray-300">Certificate Code: {certificate.certificateCode}</p>
            )}
            <button
              className="px-5 py-2 mt-4 text-sm font-medium text-white rounded-lg bg-green-600 hover:bg-green-500"
              onClick={() => navigate(`/courses/${courseId}/certificate`)}
            >
              View Certificate
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default SyllabusPage;
