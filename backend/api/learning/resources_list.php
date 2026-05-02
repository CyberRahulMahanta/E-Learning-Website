<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'lesson_resources')) {
    json_success(['resources' => []], 'Lesson resources fetched');
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$lessonId = to_int($_GET['id'] ?? null);
if (!$lessonId || $lessonId <= 0) {
    json_error('Valid lesson id required', null, 422);
}

$lessonStmt = $pdo->prepare(
    'SELECT l.id, m.course_id
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

$stmt = $pdo->prepare(
    'SELECT id, lesson_id, title, resource_type, resource_url, sort_order, created_at, updated_at
     FROM lesson_resources
     WHERE lesson_id = ?
     ORDER BY sort_order ASC, id ASC'
);
$stmt->execute([$lessonId]);
$rows = $stmt->fetchAll();

$resources = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'lessonId' => (int) $row['lesson_id'],
        'title' => $row['title'],
        'resourceType' => $row['resource_type'],
        'resourceUrl' => $row['resource_url'],
        'sortOrder' => (int) $row['sort_order'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}, $rows);

json_success([
    'lessonId' => $lessonId,
    'resources' => $resources
], 'Lesson resources fetched');
