<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);

$courseId = (int) ($_GET['id'] ?? 0);
if ($courseId <= 0) {
    json_error('Course id required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, instructor_id FROM courses WHERE id = ? LIMIT 1');
$courseStmt->execute([$courseId]);
$course = $courseStmt->fetch();

if (!$course) {
    json_error('Course not found', null, 404);
}

if ($authUser['role'] !== 'admin' && (int) $course['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden', null, 403);
}

$deleteStmt = $pdo->prepare('DELETE FROM courses WHERE id = ?');
$deleteStmt->execute([$courseId]);

json_success(['deleted' => true], 'Course deleted');
