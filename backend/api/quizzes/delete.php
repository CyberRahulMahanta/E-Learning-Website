<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'quizzes')) {
    json_error('Quiz feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'quiz.manage.own');

$quizId = to_int($_GET['id'] ?? null);
if (!$quizId || $quizId <= 0) {
    json_error('Valid quiz id required', null, 422);
}

$quizStmt = $pdo->prepare('SELECT id, course_id FROM quizzes WHERE id = ? LIMIT 1');
$quizStmt->execute([$quizId]);
$quiz = $quizStmt->fetch();
if (!$quiz) {
    json_error('Quiz not found', null, 404);
}

$courseStmt = $pdo->prepare('SELECT instructor_id FROM courses WHERE id = ? LIMIT 1');
$courseStmt->execute([(int) $quiz['course_id']]);
$ownerId = (int) $courseStmt->fetchColumn();

$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && $ownerId !== (int) $authUser['id']) {
    json_error('Forbidden: you can only delete quiz for your own course', null, 403);
}

$softDeleteStmt = $pdo->prepare('UPDATE quizzes SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
$softDeleteStmt->execute([$quizId]);

json_success(['deleted' => true], 'Quiz deleted');
