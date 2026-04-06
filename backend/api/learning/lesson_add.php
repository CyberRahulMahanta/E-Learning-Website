<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$moduleId = to_int($_GET['id'] ?? null);
if (!$moduleId || $moduleId <= 0) {
    json_error('Valid module id required', null, 422);
}

$moduleStmt = $pdo->prepare('SELECT id, course_id FROM course_modules WHERE id = ? LIMIT 1');
$moduleStmt->execute([$moduleId]);
$module = $moduleStmt->fetch();
if (!$module) {
    json_error('Module not found', null, 404);
}

ensure_course_manage_access($pdo, $authUser, (int) $module['course_id']);

$data = get_input_data();
$title = sanitize($data['title'] ?? '');
$lessonType = sanitize($data['lessonType'] ?? $data['lesson_type'] ?? 'video');
$content = trim((string) ($data['content'] ?? ''));
$videoUrl = trim((string) ($data['videoUrl'] ?? $data['video_url'] ?? ''));
$durationMinutes = to_int($data['durationMinutes'] ?? $data['duration_minutes'] ?? null);
$isPreview = to_bool($data['isPreview'] ?? $data['is_preview'] ?? false, false);
$isPublished = to_bool($data['isPublished'] ?? $data['is_published'] ?? true, true);
$sortOrder = to_int($data['sortOrder'] ?? $data['sort_order'] ?? null);

$validTypes = ['video', 'article', 'quiz', 'assignment', 'live'];
if ($title === '') {
    json_error('Lesson title is required', null, 422);
}
if (!in_array($lessonType, $validTypes, true)) {
    json_error('Invalid lesson type', null, 422);
}

if (!$sortOrder || $sortOrder <= 0) {
    $orderStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM course_lessons WHERE module_id = ?');
    $orderStmt->execute([$moduleId]);
    $sortOrder = (int) $orderStmt->fetchColumn();
}

$insertStmt = $pdo->prepare(
    'INSERT INTO course_lessons
     (module_id, title, lesson_type, content, video_url, duration_minutes, is_preview, is_published, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$insertStmt->execute([
    $moduleId,
    $title,
    $lessonType,
    $content !== '' ? $content : null,
    $videoUrl !== '' ? $videoUrl : null,
    $durationMinutes && $durationMinutes > 0 ? $durationMinutes : null,
    $isPreview ? 1 : 0,
    $isPublished ? 1 : 0,
    $sortOrder
]);

$lessonId = (int) $pdo->lastInsertId();
$fetchStmt = $pdo->prepare('SELECT * FROM course_lessons WHERE id = ? LIMIT 1');
$fetchStmt->execute([$lessonId]);
$lesson = $fetchStmt->fetch();

json_success([
    'lesson' => [
        'id' => (int) $lesson['id'],
        '_id' => (int) $lesson['id'],
        'moduleId' => (int) $lesson['module_id'],
        'title' => $lesson['title'],
        'lessonType' => $lesson['lesson_type'],
        'content' => $lesson['content'],
        'videoUrl' => $lesson['video_url'],
        'durationMinutes' => to_int($lesson['duration_minutes']),
        'isPreview' => (bool) $lesson['is_preview'],
        'isPublished' => (bool) $lesson['is_published'],
        'sortOrder' => (int) $lesson['sort_order'],
        'created_at' => $lesson['created_at'],
        'updated_at' => $lesson['updated_at']
    ]
], 'Lesson created', 201);

