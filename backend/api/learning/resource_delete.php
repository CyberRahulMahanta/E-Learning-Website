<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    'SELECT r.id, m.course_id
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

$deleteStmt = $pdo->prepare('DELETE FROM lesson_resources WHERE id = ?');
$deleteStmt->execute([$resourceId]);

json_success(['deleted' => true], 'Resource deleted');
