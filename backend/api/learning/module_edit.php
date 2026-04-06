<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH', 'POST'], true)) {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$moduleId = to_int($_GET['id'] ?? null);
if (!$moduleId || $moduleId <= 0) {
    json_error('Valid module id required', null, 422);
}

$moduleStmt = $pdo->prepare('SELECT * FROM course_modules WHERE id = ? LIMIT 1');
$moduleStmt->execute([$moduleId]);
$module = $moduleStmt->fetch();
if (!$module) {
    json_error('Module not found', null, 404);
}

ensure_course_manage_access($pdo, $authUser, (int) $module['course_id']);

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

if (array_key_exists('description', $data)) {
    $description = trim((string) $data['description']);
    $fields[] = 'description = ?';
    $params[] = $description !== '' ? $description : null;
}

if (isset($data['sortOrder']) || isset($data['sort_order'])) {
    $sortOrder = to_int($data['sortOrder'] ?? $data['sort_order']);
    if (!$sortOrder || $sortOrder <= 0) {
        json_error('Invalid sort order', null, 422);
    }
    $fields[] = 'sort_order = ?';
    $params[] = $sortOrder;
}

if (isset($data['isPublished']) || isset($data['is_published'])) {
    $isPublished = to_bool($data['isPublished'] ?? $data['is_published'], true);
    $fields[] = 'is_published = ?';
    $params[] = $isPublished ? 1 : 0;
}

if (empty($fields)) {
    json_error('No valid fields provided', null, 422);
}

$params[] = $moduleId;
$sql = 'UPDATE course_modules SET ' . implode(', ', $fields) . ' WHERE id = ?';
$updateStmt = $pdo->prepare($sql);
$updateStmt->execute($params);

$moduleStmt->execute([$moduleId]);
$updated = $moduleStmt->fetch();

json_success([
    'module' => [
        'id' => (int) $updated['id'],
        '_id' => (int) $updated['id'],
        'courseId' => (int) $updated['course_id'],
        'title' => $updated['title'],
        'description' => $updated['description'],
        'sortOrder' => (int) $updated['sort_order'],
        'isPublished' => (bool) $updated['is_published'],
        'created_at' => $updated['created_at'],
        'updated_at' => $updated['updated_at']
    ]
], 'Module updated');

