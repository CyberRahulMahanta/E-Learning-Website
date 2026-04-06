<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed', null, 405);
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

$deleteStmt = $pdo->prepare('DELETE FROM course_lessons WHERE id = ?');
$deleteStmt->execute([$lessonId]);

json_success(['deleted' => true], 'Lesson deleted');

