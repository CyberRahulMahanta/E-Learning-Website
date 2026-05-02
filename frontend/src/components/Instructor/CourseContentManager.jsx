import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { useCourses } from "../../context/CourseContext";
import { useAuth } from "../../context/AuthContext";

const lessonTypes = ["video", "article", "live", "quiz", "assignment"];
const resourceTypes = ["link", "pdf", "code", "image", "zip", "other"];

const emptyLesson = { title: "", lessonType: "video", videoUrl: "", durationMinutes: "", content: "", isPreview: false, isPublished: true };
const emptyResource = { title: "", resourceType: "link", resourceUrl: "" };

const rulesFor = (type) => ({
  needsVideo: type === "video" || type === "live",
  needsContent: type === "article" || type === "live" || type === "quiz" || type === "assignment",
  allowPreview: type === "video" || type === "article"
});

const CourseContentManager = ({ panel = "instructor" }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuth();
  const { fetchCourseById, getCourseById, fetchCourseContent } = useCourses();

  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState("");

  const [moduleDraft, setModuleDraft] = useState({ title: "", description: "" });
  const [moduleEdit, setModuleEdit] = useState({ id: null, title: "", description: "", isPublished: true });

  const [lessonDraftByModule, setLessonDraftByModule] = useState({});
  const [lessonEdit, setLessonEdit] = useState({ id: null, ...emptyLesson });

  const [resourceDraftByLesson, setResourceDraftByLesson] = useState({});
  const [resourceEdit, setResourceEdit] = useState({ id: null, ...emptyResource });

  const course = getCourseById(courseId);
  const backRoute = panel === "admin" ? "/admin/courses" : "/instructor/courses";
  const sortedModules = useMemo(() => [...modules].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)), [modules]);
  const tokenHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const setInfo = (nextError = "", nextSuccess = "") => {
    setError(nextError);
    setSuccess(nextSuccess);
  };

  const loadContent = async () => {
    setIsLoading(true);
    await fetchCourseById(courseId);
    const content = await fetchCourseContent(courseId);
    setModules(content?.modules || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadContent().catch((err) => {
      setError(err?.message || "Failed to load content.");
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const validateLesson = (draft) => {
    const t = draft.lessonType || "video";
    const rules = rulesFor(t);
    if (!draft.title?.trim()) return "Lesson title is required.";
    if (rules.needsVideo && !draft.videoUrl?.trim()) return "Video/live URL is required.";
    if (rules.needsContent && !draft.content?.trim()) return "Content is required.";
    return "";
  };

  const doAction = async (key, fn) => {
    setBusy(key);
    setInfo("", "");
    try {
      await fn();
    } catch (err) {
      setInfo(err?.response?.data?.message || "Action failed.", "");
    } finally {
      setBusy("");
    }
  };

  const saveModuleOrder = async (list) => {
    await api.post(`/courses/${courseId}/modules/reorder`, {
      moduleOrders: list.map((m, idx) => ({ id: m.id, sortOrder: idx + 1 }))
    }, { headers: tokenHeaders });
  };

  const moveModule = async (moduleId, dir) => {
    const idx = sortedModules.findIndex((m) => String(m.id) === String(moduleId));
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= sortedModules.length) return;
    const next = [...sortedModules];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    await doAction(`move-module-${moduleId}`, async () => {
      await saveModuleOrder(next);
      setInfo("", "Module order updated.");
      await loadContent();
    });
  };

  const moveLesson = async (module, lessonId, dir) => {
    const list = [...(module.lessons || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    const idx = list.findIndex((l) => String(l.id) === String(lessonId));
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    const next = [...list];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    await doAction(`move-lesson-${lessonId}`, async () => {
      await api.post(`/modules/${module.id}/lessons/reorder`, {
        lessonOrders: next.map((l, order) => ({ id: l.id, sortOrder: order + 1 }))
      }, { headers: tokenHeaders });
      setInfo("", "Lesson order updated.");
      await loadContent();
    });
  };

  const moduleActions = {
    create: async (event) => {
      event.preventDefault();
      if (!moduleDraft.title.trim()) return setInfo("Module title is required.", "");
      await doAction("create-module", async () => {
        await api.post(`/courses/${courseId}/modules`, {
          title: moduleDraft.title.trim(),
          description: moduleDraft.description.trim()
        }, { headers: tokenHeaders });
        setModuleDraft({ title: "", description: "" });
        setInfo("", "Module created.");
        await loadContent();
      });
    },
    startEdit: (module) => setModuleEdit({ id: module.id, title: module.title || "", description: module.description || "", isPublished: !!module.isPublished }),
    saveEdit: async () => {
      if (!moduleEdit.id) return;
      if (!moduleEdit.title.trim()) return setInfo("Module title is required.", "");
      await doAction(`save-module-${moduleEdit.id}`, async () => {
        await api.put(`/modules/${moduleEdit.id}`, {
          title: moduleEdit.title.trim(),
          description: moduleEdit.description.trim(),
          isPublished: !!moduleEdit.isPublished
        }, { headers: tokenHeaders });
        setModuleEdit({ id: null, title: "", description: "", isPublished: true });
        setInfo("", "Module updated.");
        await loadContent();
      });
    },
    remove: async (moduleId) => {
      if (!window.confirm("Delete this module and all lessons?")) return;
      await doAction(`delete-module-${moduleId}`, async () => {
        await api.delete(`/modules/${moduleId}`, { headers: tokenHeaders });
        setInfo("", "Module deleted.");
        await loadContent();
      });
    }
  };

  const lessonActions = {
    setDraftField: (moduleId, field, value) => setLessonDraftByModule((prev) => ({ ...prev, [moduleId]: { ...(prev[moduleId] || { ...emptyLesson }), [field]: value } })),
    create: async (event, moduleId) => {
      event.preventDefault();
      const draft = lessonDraftByModule[moduleId] || { ...emptyLesson };
      const validation = validateLesson(draft);
      if (validation) return setInfo(validation, "");
      const t = draft.lessonType || "video";
      const r = rulesFor(t);
      await doAction(`create-lesson-${moduleId}`, async () => {
        await api.post(`/modules/${moduleId}/lessons`, {
          title: draft.title.trim(),
          lessonType: t,
          videoUrl: r.needsVideo ? draft.videoUrl.trim() : "",
          durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : null,
          content: draft.content?.trim() || "",
          isPreview: r.allowPreview ? !!draft.isPreview : false,
          isPublished: !!draft.isPublished
        }, { headers: tokenHeaders });
        setLessonDraftByModule((prev) => ({ ...prev, [moduleId]: { ...emptyLesson } }));
        setInfo("", "Lesson created.");
        await loadContent();
      });
    },
    startEdit: (lesson) => setLessonEdit({
      id: lesson.id,
      title: lesson.title || "",
      lessonType: lesson.lessonType || "video",
      videoUrl: lesson.videoUrl || "",
      durationMinutes: lesson.durationMinutes || "",
      content: lesson.content || "",
      isPreview: !!lesson.isPreview,
      isPublished: !!lesson.isPublished
    }),
    saveEdit: async () => {
      if (!lessonEdit.id) return;
      const validation = validateLesson(lessonEdit);
      if (validation) return setInfo(validation, "");
      const r = rulesFor(lessonEdit.lessonType);
      await doAction(`save-lesson-${lessonEdit.id}`, async () => {
        await api.put(`/lessons/${lessonEdit.id}`, {
          title: lessonEdit.title.trim(),
          lessonType: lessonEdit.lessonType,
          videoUrl: r.needsVideo ? lessonEdit.videoUrl.trim() : "",
          durationMinutes: lessonEdit.durationMinutes ? Number(lessonEdit.durationMinutes) : null,
          content: lessonEdit.content?.trim() || "",
          isPreview: r.allowPreview ? !!lessonEdit.isPreview : false,
          isPublished: !!lessonEdit.isPublished
        }, { headers: tokenHeaders });
        setLessonEdit({ id: null, ...emptyLesson });
        setInfo("", "Lesson updated.");
        await loadContent();
      });
    },
    remove: async (lessonId) => {
      if (!window.confirm("Delete this lesson?")) return;
      await doAction(`delete-lesson-${lessonId}`, async () => {
        await api.delete(`/lessons/${lessonId}`, { headers: tokenHeaders });
        setInfo("", "Lesson deleted.");
        await loadContent();
      });
    }
  };

  const resourceActions = {
    draft: (lessonId) => resourceDraftByLesson[lessonId] || { ...emptyResource },
    setDraftField: (lessonId, field, value) => setResourceDraftByLesson((prev) => ({ ...prev, [lessonId]: { ...(prev[lessonId] || { ...emptyResource }), [field]: value } })),
    create: async (lessonId) => {
      const draft = resourceActions.draft(lessonId);
      if (!draft.title.trim() || !draft.resourceUrl.trim()) return setInfo("Resource title and URL are required.", "");
      await doAction(`create-resource-${lessonId}`, async () => {
        await api.post(`/lessons/${lessonId}/resources`, { title: draft.title.trim(), resourceType: draft.resourceType, resourceUrl: draft.resourceUrl.trim() }, { headers: tokenHeaders });
        setResourceDraftByLesson((prev) => ({ ...prev, [lessonId]: { ...emptyResource } }));
        setInfo("", "Resource added.");
        await loadContent();
      });
    },
    startEdit: (resource) => setResourceEdit({ id: resource.id, title: resource.title || "", resourceType: resource.resourceType || "link", resourceUrl: resource.resourceUrl || "" }),
    saveEdit: async () => {
      if (!resourceEdit.id) return;
      if (!resourceEdit.title.trim() || !resourceEdit.resourceUrl.trim()) return setInfo("Resource title and URL are required.", "");
      await doAction(`save-resource-${resourceEdit.id}`, async () => {
        await api.put(`/resources/${resourceEdit.id}`, {
          title: resourceEdit.title.trim(),
          resourceType: resourceEdit.resourceType,
          resourceUrl: resourceEdit.resourceUrl.trim()
        }, { headers: tokenHeaders });
        setResourceEdit({ id: null, ...emptyResource });
        setInfo("", "Resource updated.");
        await loadContent();
      });
    },
    remove: async (resourceId) => {
      if (!window.confirm("Delete this resource?")) return;
      await doAction(`delete-resource-${resourceId}`, async () => {
        await api.delete(`/resources/${resourceId}`, { headers: tokenHeaders });
        setInfo("", "Resource deleted.");
        await loadContent();
      });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-white bg-black">Loading content manager...</div>;

  return (
    <main className="min-h-screen px-6 py-10 text-white bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Course Content Manager</h1>
            <p className="text-sm text-gray-300">{course?.name || course?.title || "Course"} | Logged in as {user?.role}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm rounded bg-fuchsia-700 hover:bg-fuchsia-600" onClick={() => navigate(`/courses/${courseId}/syllabus`)}>Open Learning View</button>
            <button className="px-4 py-2 text-sm rounded bg-stone-700 hover:bg-stone-600" onClick={() => navigate(backRoute)}>Back</button>
          </div>
        </div>
        {error ? <p className="p-3 mt-4 text-red-300 border rounded bg-red-950/30 border-red-800">{error}</p> : null}
        {success ? <p className="p-3 mt-4 text-green-300 border rounded bg-green-950/30 border-green-800">{success}</p> : null}

        <section className="p-4 mt-6 border rounded border-fuchsia-700 bg-stone-950">
          <h2 className="text-lg font-semibold">Add Module</h2>
          <form className="grid gap-2 mt-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={moduleActions.create}>
            <input className="p-2 border rounded bg-black border-stone-700" placeholder="Module title" value={moduleDraft.title} onChange={(e) => setModuleDraft((p) => ({ ...p, title: e.target.value }))} />
            <input className="p-2 border rounded bg-black border-stone-700" placeholder="Module description" value={moduleDraft.description} onChange={(e) => setModuleDraft((p) => ({ ...p, description: e.target.value }))} />
            <button type="submit" className="px-4 py-2 rounded bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60" disabled={busy === "create-module"}>{busy === "create-module" ? "Adding..." : "Add"}</button>
          </form>
        </section>

        <section className="mt-6 space-y-4">
          {sortedModules.map((module, moduleIndex) => {
            const lessons = [...(module.lessons || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
            const addingLesson = lessonDraftByModule[module.id] || { ...emptyLesson };
            const addRules = rulesFor(addingLesson.lessonType);
            const editingThisModule = moduleEdit.id === module.id;

            return (
              <article key={module.id} className="p-4 border rounded border-fuchsia-700 bg-stone-950">
                {editingThisModule ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    <input className="p-2 border rounded bg-black border-stone-700" value={moduleEdit.title} onChange={(e) => setModuleEdit((p) => ({ ...p, title: e.target.value }))} />
                    <input className="p-2 border rounded bg-black border-stone-700" value={moduleEdit.description} onChange={(e) => setModuleEdit((p) => ({ ...p, description: e.target.value }))} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!moduleEdit.isPublished} onChange={(e) => setModuleEdit((p) => ({ ...p, isPublished: e.target.checked }))} />Published</label>
                    <div className="flex gap-2 md:col-span-2"><button className="px-3 py-2 text-sm rounded bg-fuchsia-700 hover:bg-fuchsia-600" onClick={moduleActions.saveEdit}>Save Module</button><button className="px-3 py-2 text-sm rounded bg-stone-700 hover:bg-stone-600" onClick={() => setModuleEdit({ id: null, title: "", description: "", isPublished: true })}>Cancel</button></div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><h3 className="text-xl font-semibold">{module.title}</h3><p className="text-sm text-gray-300">{module.description || "No description"}</p></div>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-2 py-1 text-xs rounded bg-stone-700 hover:bg-stone-600" onClick={() => moduleActions.startEdit(module)}>Edit</button>
                      <button className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600" onClick={() => moduleActions.remove(module.id)}>Delete</button>
                      <button className="px-2 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-60" disabled={moduleIndex === 0 || busy === `move-module-${module.id}`} onClick={() => moveModule(module.id, "up")}>Up</button>
                      <button className="px-2 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-60" disabled={moduleIndex === sortedModules.length - 1 || busy === `move-module-${module.id}`} onClick={() => moveModule(module.id, "down")}>Down</button>
                    </div>
                  </div>
                )}

                <div className="mt-3 space-y-3">
                  {lessons.map((lesson, lessonIndex) => {
                    const editingThisLesson = lessonEdit.id === lesson.id;
                    const editRules = rulesFor(editingThisLesson ? lessonEdit.lessonType : lesson.lessonType);
                    return (
                      <div key={lesson.id} className="p-3 border rounded bg-black border-stone-800">
                        {editingThisLesson ? (
                          <div className="grid gap-2 md:grid-cols-2">
                            <input className="p-2 border rounded bg-stone-900 border-stone-700" value={lessonEdit.title} onChange={(e) => setLessonEdit((p) => ({ ...p, title: e.target.value }))} />
                            <select className="p-2 border rounded bg-stone-900 border-stone-700" value={lessonEdit.lessonType} onChange={(e) => setLessonEdit((p) => ({ ...p, lessonType: e.target.value }))}>{lessonTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                            {editRules.needsVideo ? <input className="p-2 border rounded bg-stone-900 border-stone-700 md:col-span-2" placeholder="Video/live URL" value={lessonEdit.videoUrl} onChange={(e) => setLessonEdit((p) => ({ ...p, videoUrl: e.target.value }))} /> : null}
                            <input type="number" min="1" className="p-2 border rounded bg-stone-900 border-stone-700" placeholder="Duration minutes" value={lessonEdit.durationMinutes} onChange={(e) => setLessonEdit((p) => ({ ...p, durationMinutes: e.target.value }))} />
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!lessonEdit.isPublished} onChange={(e) => setLessonEdit((p) => ({ ...p, isPublished: e.target.checked }))} />Published</label>
                            {editRules.allowPreview ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!lessonEdit.isPreview} onChange={(e) => setLessonEdit((p) => ({ ...p, isPreview: e.target.checked }))} />Preview</label> : null}
                            <textarea className="h-20 p-2 border rounded resize-none bg-stone-900 border-stone-700 md:col-span-2" placeholder="Content / notes" value={lessonEdit.content} onChange={(e) => setLessonEdit((p) => ({ ...p, content: e.target.value }))} />
                            <div className="flex gap-2 md:col-span-2"><button className="px-3 py-2 text-sm rounded bg-fuchsia-700 hover:bg-fuchsia-600" onClick={lessonActions.saveEdit}>Save Lesson</button><button className="px-3 py-2 text-sm rounded bg-stone-700 hover:bg-stone-600" onClick={() => setLessonEdit({ id: null, ...emptyLesson })}>Cancel</button></div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div><p className="font-medium">{lesson.title}</p><p className="text-xs text-gray-400">{lesson.lessonType} | {lesson.isPublished ? "Published" : "Draft"}{lesson.isPreview ? " | Preview" : ""}</p></div>
                              <div className="flex flex-wrap gap-2">
                                <button className="px-2 py-1 text-xs rounded bg-stone-700 hover:bg-stone-600" onClick={() => lessonActions.startEdit(lesson)}>Edit</button>
                                <button className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600" onClick={() => lessonActions.remove(lesson.id)}>Delete</button>
                                <button className="px-2 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-60" disabled={lessonIndex === 0 || busy === `move-lesson-${lesson.id}`} onClick={() => moveLesson(module, lesson.id, "up")}>Up</button>
                                <button className="px-2 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-60" disabled={lessonIndex === lessons.length - 1 || busy === `move-lesson-${lesson.id}`} onClick={() => moveLesson(module, lesson.id, "down")}>Down</button>
                              </div>
                            </div>

                            <div className="mt-2 space-y-2">
                              {(lesson.resources || []).map((resource) => (
                                <div key={resource.id} className="p-2 border rounded bg-stone-950 border-stone-700">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm">{resource.title} <span className="text-xs text-gray-400">({resource.resourceType})</span></p>
                                    <div className="flex gap-2">
                                      <a href={resource.resourceUrl} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs rounded bg-stone-700 hover:bg-stone-600">Open</a>
                                      <button className="px-2 py-1 text-xs rounded bg-stone-700 hover:bg-stone-600" onClick={() => resourceActions.startEdit(resource)}>Edit</button>
                                      <button className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600" onClick={() => resourceActions.remove(resource.id)}>Delete</button>
                                    </div>
                                  </div>
                                  {resourceEdit.id === resource.id ? (
                                    <div className="grid gap-2 mt-2">
                                      <input className="p-2 border rounded bg-black border-stone-700" value={resourceEdit.title} onChange={(e) => setResourceEdit((p) => ({ ...p, title: e.target.value }))} />
                                      <select className="p-2 border rounded bg-black border-stone-700" value={resourceEdit.resourceType} onChange={(e) => setResourceEdit((p) => ({ ...p, resourceType: e.target.value }))}>{resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                                      <input className="p-2 border rounded bg-black border-stone-700" value={resourceEdit.resourceUrl} onChange={(e) => setResourceEdit((p) => ({ ...p, resourceUrl: e.target.value }))} />
                                      <div className="flex gap-2"><button className="px-3 py-2 text-sm rounded bg-fuchsia-700 hover:bg-fuchsia-600" onClick={resourceActions.saveEdit}>Save</button><button className="px-3 py-2 text-sm rounded bg-stone-700 hover:bg-stone-600" onClick={() => setResourceEdit({ id: null, ...emptyResource })}>Cancel</button></div>
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-2 mt-2">
                              <input className="p-2 border rounded bg-stone-900 border-stone-700" placeholder="Resource title" value={resourceActions.draft(lesson.id).title} onChange={(e) => resourceActions.setDraftField(lesson.id, "title", e.target.value)} />
                              <select className="p-2 border rounded bg-stone-900 border-stone-700" value={resourceActions.draft(lesson.id).resourceType} onChange={(e) => resourceActions.setDraftField(lesson.id, "resourceType", e.target.value)}>{resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                              <input className="p-2 border rounded bg-stone-900 border-stone-700" placeholder="Resource URL" value={resourceActions.draft(lesson.id).resourceUrl} onChange={(e) => resourceActions.setDraftField(lesson.id, "resourceUrl", e.target.value)} />
                              <button className="px-3 py-2 text-sm rounded bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60" disabled={busy === `create-resource-${lesson.id}`} onClick={() => resourceActions.create(lesson.id)}>{busy === `create-resource-${lesson.id}` ? "Adding..." : "Add Resource"}</button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <form className="grid gap-2 mt-3 md:grid-cols-2" onSubmit={(event) => lessonActions.create(event, module.id)}>
                  <input className="p-2 border rounded bg-black border-stone-700" placeholder="Lesson title" value={addingLesson.title} onChange={(e) => lessonActions.setDraftField(module.id, "title", e.target.value)} />
                  <select className="p-2 border rounded bg-black border-stone-700" value={addingLesson.lessonType} onChange={(e) => lessonActions.setDraftField(module.id, "lessonType", e.target.value)}>{lessonTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                  {addRules.needsVideo ? <input className="p-2 border rounded bg-black border-stone-700 md:col-span-2" placeholder="Video/live URL" value={addingLesson.videoUrl} onChange={(e) => lessonActions.setDraftField(module.id, "videoUrl", e.target.value)} /> : null}
                  <input type="number" min="1" className="p-2 border rounded bg-black border-stone-700" placeholder="Duration minutes" value={addingLesson.durationMinutes} onChange={(e) => lessonActions.setDraftField(module.id, "durationMinutes", e.target.value)} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!addingLesson.isPublished} onChange={(e) => lessonActions.setDraftField(module.id, "isPublished", e.target.checked)} />Published</label>
                  {addRules.allowPreview ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!addingLesson.isPreview} onChange={(e) => lessonActions.setDraftField(module.id, "isPreview", e.target.checked)} />Preview</label> : null}
                  <textarea className="h-20 p-2 border rounded resize-none bg-black border-stone-700 md:col-span-2" placeholder="Content / notes" value={addingLesson.content} onChange={(e) => lessonActions.setDraftField(module.id, "content", e.target.value)} />
                  <button type="submit" className="px-3 py-2 text-sm rounded bg-fuchsia-700 hover:bg-fuchsia-600 md:col-span-2 disabled:opacity-60" disabled={busy === `create-lesson-${module.id}`}>{busy === `create-lesson-${module.id}` ? "Adding..." : "Add Lesson"}</button>
                </form>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default CourseContentManager;
