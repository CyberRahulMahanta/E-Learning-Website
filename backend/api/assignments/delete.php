<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'assignments')) {
    json_error('Assignment feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'assignment.manage.own');

$assignmentId = to_int($_GET['id'] ?? null);
if (!$assignmentId || $assignmentId <= 0) {
    json_error('Valid assignment id required', null, 422);
}

$assignmentStmt = $pdo->prepare('SELECT id, course_id FROM assignments WHERE id = ? LIMIT 1');
$assignmentStmt->execute([$assignmentId]);
$assignment = $assignmentStmt->fetch();
if (!$assignment) {
    json_error('Assignment not found', null, 404);
}

$courseStmt = $pdo->prepare('SELECT instructor_id FROM courses WHERE id = ? LIMIT 1');
$courseStmt->execute([(int) $assignment['course_id']]);
$ownerId = (int) $courseStmt->fetchColumn();

$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && $ownerId !== (int) $authUser['id']) {
    json_error('Forbidden: you can only delete assignment for your own course', null, 403);
}

$deleteStmt = $pdo->prepare('UPDATE assignments SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
$deleteStmt->execute([$assignmentId]);

json_success(['deleted' => true], 'Assignment deleted');
