<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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

$deleteStmt = $pdo->prepare('DELETE FROM course_modules WHERE id = ?');
$deleteStmt->execute([$moduleId]);

json_success(['deleted' => true], 'Module deleted');

