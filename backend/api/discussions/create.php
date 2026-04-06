<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'course_discussions')) {
    json_error('Discussion feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'discussion.create');

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, instructor_id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}
$courseId = (int) $course['id'];

$allowed = false;
if ((string) $authUser['role'] === 'admin') {
    $allowed = true;
} elseif ((int) $course['instructor_id'] === (int) $authUser['id']) {
    $allowed = true;
} else {
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
    $allowed = (bool) $enrollmentStmt->fetchColumn();
}

if (!$allowed) {
    json_error('Join the course to participate in discussions', null, 403);
}

$data = get_input_data();
$message = trim((string) ($data['message'] ?? ''));
$parentId = to_int($data['parentId'] ?? $data['parent_id'] ?? null);

if ($message === '') {
    json_error('Message is required', null, 422);
}

if ($parentId) {
    $parentStmt = $pdo->prepare('SELECT id FROM course_discussions WHERE id = ? AND course_id = ? LIMIT 1');
    $parentStmt->execute([$parentId, $courseId]);
    if (!$parentStmt->fetch()) {
        json_error('Parent discussion message not found', null, 404);
    }
}

$insertStmt = $pdo->prepare(
    'INSERT INTO course_discussions (course_id, user_id, parent_id, message, is_deleted)
     VALUES (?, ?, ?, ?, 0)'
);
$insertStmt->execute([
    $courseId,
    (int) $authUser['id'],
    $parentId ?: null,
    $message
]);

$id = (int) $pdo->lastInsertId();

json_success([
    'discussion' => [
        'id' => $id,
        '_id' => $id,
        'courseId' => $courseId,
        'parentId' => $parentId ?: null,
        'message' => $message,
        'user' => normalize_user($authUser),
        'created_at' => date('Y-m-d H:i:s')
    ]
], 'Discussion message posted', 201);

