<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$courseId = to_int($_GET['id'] ?? null);
if (!$courseId || $courseId <= 0) {
    json_error('Valid course id required', null, 422);
}

ensure_course_manage_access($pdo, $authUser, $courseId);

$data = get_input_data();
$title = sanitize($data['title'] ?? '');
$description = trim((string) ($data['description'] ?? ''));
$sortOrder = to_int($data['sortOrder'] ?? $data['sort_order'] ?? null);
$isPublished = to_bool($data['isPublished'] ?? $data['is_published'] ?? 1, true);

if ($title === '') {
    json_error('Module title is required', null, 422);
}

if (!$sortOrder || $sortOrder <= 0) {
    $orderStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM course_modules WHERE course_id = ?');
    $orderStmt->execute([$courseId]);
    $sortOrder = (int) $orderStmt->fetchColumn();
}

$stmt = $pdo->prepare(
    'INSERT INTO course_modules (course_id, title, description, sort_order, is_published)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([
    $courseId,
    $title,
    $description !== '' ? $description : null,
    $sortOrder,
    $isPublished ? 1 : 0
]);

$moduleId = (int) $pdo->lastInsertId();
$fetchStmt = $pdo->prepare('SELECT * FROM course_modules WHERE id = ? LIMIT 1');
$fetchStmt->execute([$moduleId]);
$module = $fetchStmt->fetch();

json_success([
    'module' => [
        'id' => (int) $module['id'],
        '_id' => (int) $module['id'],
        'courseId' => (int) $module['course_id'],
        'title' => $module['title'],
        'description' => $module['description'],
        'sortOrder' => (int) $module['sort_order'],
        'isPublished' => (bool) $module['is_published'],
        'created_at' => $module['created_at'],
        'updated_at' => $module['updated_at']
    ]
], 'Module created', 201);

