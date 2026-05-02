<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH', 'POST'], true)) {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'lesson_resources')) {
    json_error('Lesson resources feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$resourceId = to_int($_GET['id'] ?? null);
if (!$resourceId || $resourceId <= 0) {
    json_error('Valid resource id required', null, 422);
}

$resourceStmt = $pdo->prepare(
    'SELECT r.*, m.course_id
     FROM lesson_resources r
     JOIN course_lessons l ON l.id = r.lesson_id
     JOIN course_modules m ON m.id = l.module_id
     WHERE r.id = ?
     LIMIT 1'
);
$resourceStmt->execute([$resourceId]);
$resource = $resourceStmt->fetch();
if (!$resource) {
    json_error('Resource not found', null, 404);
}

ensure_course_manage_access($pdo, $authUser, (int) $resource['course_id']);

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

if (isset($data['resourceType']) || isset($data['resource_type'])) {
    $resourceType = sanitize($data['resourceType'] ?? $data['resource_type'] ?? '');
    $validTypes = ['pdf', 'link', 'code', 'image', 'zip', 'other'];
    if (!in_array($resourceType, $validTypes, true)) {
        json_error('Invalid resource type', null, 422);
    }
    $fields[] = 'resource_type = ?';
    $params[] = $resourceType;
}

if (isset($data['resourceUrl']) || isset($data['resource_url'])) {
    $resourceUrl = trim((string) ($data['resourceUrl'] ?? $data['resource_url'] ?? ''));
    if ($resourceUrl === '') {
        json_error('Resource URL cannot be empty', null, 422);
    }
    $fields[] = 'resource_url = ?';
    $params[] = $resourceUrl;
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

$params[] = $resourceId;
$updateStmt = $pdo->prepare('UPDATE lesson_resources SET ' . implode(', ', $fields) . ' WHERE id = ?');
$updateStmt->execute($params);

$resourceStmt->execute([$resourceId]);
$updated = $resourceStmt->fetch();

json_success([
    'resource' => [
        'id' => (int) $updated['id'],
        '_id' => (int) $updated['id'],
        'lessonId' => (int) $updated['lesson_id'],
        'title' => $updated['title'],
        'resourceType' => $updated['resource_type'],
        'resourceUrl' => $updated['resource_url'],
        'sortOrder' => (int) $updated['sort_order'],
        'created_at' => $updated['created_at'],
        'updated_at' => $updated['updated_at']
    ]
], 'Resource updated');
