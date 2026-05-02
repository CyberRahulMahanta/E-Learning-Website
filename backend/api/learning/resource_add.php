<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'lesson_resources')) {
    json_error('Lesson resources feature unavailable. Run migrations.', null, 500);
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

$data = get_input_data();
$title = sanitize($data['title'] ?? '');
$resourceType = sanitize($data['resourceType'] ?? $data['resource_type'] ?? 'link');
$resourceUrl = trim((string) ($data['resourceUrl'] ?? $data['resource_url'] ?? ''));
$sortOrder = to_int($data['sortOrder'] ?? $data['sort_order'] ?? null);

$validTypes = ['pdf', 'link', 'code', 'image', 'zip', 'other'];
if ($title === '') {
    json_error('Resource title is required', null, 422);
}
if (!in_array($resourceType, $validTypes, true)) {
    json_error('Invalid resource type', null, 422);
}
if ($resourceUrl === '') {
    json_error('Resource URL is required', null, 422);
}

if (!$sortOrder || $sortOrder <= 0) {
    $orderStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM lesson_resources WHERE lesson_id = ?');
    $orderStmt->execute([$lessonId]);
    $sortOrder = (int) $orderStmt->fetchColumn();
}

$stmt = $pdo->prepare(
    'INSERT INTO lesson_resources (lesson_id, title, resource_type, resource_url, sort_order)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$lessonId, $title, $resourceType, $resourceUrl, $sortOrder]);

$resourceId = (int) $pdo->lastInsertId();
$fetchStmt = $pdo->prepare(
    'SELECT id, lesson_id, title, resource_type, resource_url, sort_order, created_at, updated_at
     FROM lesson_resources
     WHERE id = ?
     LIMIT 1'
);
$fetchStmt->execute([$resourceId]);
$row = $fetchStmt->fetch();

json_success([
    'resource' => [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'lessonId' => (int) $row['lesson_id'],
        'title' => $row['title'],
        'resourceType' => $row['resource_type'],
        'resourceUrl' => $row['resource_url'],
        'sortOrder' => (int) $row['sort_order'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ]
], 'Resource created', 201);
