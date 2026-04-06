<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH', 'POST'], true)) {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$lessonId = to_int($_GET['id'] ?? null);
if (!$lessonId || $lessonId <= 0) {
    json_error('Valid lesson id required', null, 422);
}

$lessonStmt = $pdo->prepare(
    'SELECT l.*, m.course_id
     FROM course_lessons l
     JOIN course_modules m ON m.id = l.module_id
     WHERE l.id = ?
     LIMIT 1'
);
$lessonStmt->execute([$lessonId]);
$lesson = $lessonStmt->fetch();
if (!$lesson) {
    json_error('Lesson not found', null, 404);
}

ensure_course_manage_access($pdo, $authUser, (int) $lesson['course_id']);

$data = get_input_data();
$fields = [];
$params = [];

if (isset($data['title'])) {
    $title = sanitize($data['title']);
    if ($title === '') {
        json_error('Title cannot be empty', null, 422);
    }
    $fields[] = 'title = ?';
    $params[] = $title;
}

if (isset($data['lessonType']) || isset($data['lesson_type'])) {
    $lessonType = sanitize($data['lessonType'] ?? $data['lesson_type'] ?? '');
    $validTypes = ['video', 'article', 'quiz', 'assignment', 'live'];
    if (!in_array($lessonType, $validTypes, true)) {
        json_error('Invalid lesson type', null, 422);
    }
    $fields[] = 'lesson_type = ?';
    $params[] = $lessonType;
}

if (array_key_exists('content', $data)) {
    $content = trim((string) $data['content']);
    $fields[] = 'content = ?';
    $params[] = $content !== '' ? $content : null;
}

if (isset($data['videoUrl']) || isset($data['video_url'])) {
    $videoUrl = trim((string) ($data['videoUrl'] ?? $data['video_url'] ?? ''));
    $fields[] = 'video_url = ?';
    $params[] = $videoUrl !== '' ? $videoUrl : null;
}

if (isset($data['durationMinutes']) || isset($data['duration_minutes'])) {
    $durationMinutes = to_int($data['durationMinutes'] ?? $data['duration_minutes']);
    $fields[] = 'duration_minutes = ?';
    $params[] = $durationMinutes && $durationMinutes > 0 ? $durationMinutes : null;
}

if (isset($data['isPreview']) || isset($data['is_preview'])) {
    $isPreview = to_bool($data['isPreview'] ?? $data['is_preview'], false);
    $fields[] = 'is_preview = ?';
    $params[] = $isPreview ? 1 : 0;
}

if (isset($data['isPublished']) || isset($data['is_published'])) {
    $isPublished = to_bool($data['isPublished'] ?? $data['is_published'], true);
    $fields[] = 'is_published = ?';
    $params[] = $isPublished ? 1 : 0;
}

if (isset($data['sortOrder']) || isset($data['sort_order'])) {
    $sortOrder = to_int($data['sortOrder'] ?? $data['sort_order']);
    if (!$sortOrder || $sortOrder <= 0) {
        json_error('Invalid sort order', null, 422);
    }
    $fields[] = 'sort_order = ?';
    $params[] = $sortOrder;
}

if (empty($fields)) {
    json_error('No valid fields provided', null, 422);
}

$params[] = $lessonId;
$sql = 'UPDATE course_lessons SET ' . implode(', ', $fields) . ' WHERE id = ?';
$updateStmt = $pdo->prepare($sql);
$updateStmt->execute($params);

$lessonStmt->execute([$lessonId]);
$updated = $lessonStmt->fetch();

json_success([
    'lesson' => [
        'id' => (int) $updated['id'],
        '_id' => (int) $updated['id'],
        'moduleId' => (int) $updated['module_id'],
        'title' => $updated['title'],
        'lessonType' => $updated['lesson_type'],
        'content' => $updated['content'],
        'videoUrl' => $updated['video_url'],
        'durationMinutes' => to_int($updated['duration_minutes']),
        'isPreview' => (bool) $updated['is_preview'],
        'isPublished' => (bool) $updated['is_published'],
        'sortOrder' => (int) $updated['sort_order'],
        'created_at' => $updated['created_at'],
        'updated_at' => $updated['updated_at']
    ]
], 'Lesson updated');

