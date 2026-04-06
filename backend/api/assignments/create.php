<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'assignments')) {
    json_error('Assignment feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'assignment.manage.own');

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, slug, instructor_id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$courseId = (int) $course['id'];
$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && (int) $course['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden: you can only create assignment for your own course', null, 403);
}

$data = get_input_data();
$title = sanitize($data['title'] ?? '');
$description = trim((string) ($data['description'] ?? ''));
$maxMarks = isset($data['maxMarks']) ? (float) $data['maxMarks'] : 100.0;
$dueAt = trim((string) ($data['dueAt'] ?? $data['due_at'] ?? ''));
$moduleId = to_int($data['moduleId'] ?? null);
$lessonId = to_int($data['lessonId'] ?? null);

if ($title === '') {
    json_error('Assignment title is required', null, 422);
}

if ($maxMarks <= 0) {
    json_error('Max marks must be greater than zero', null, 422);
}

$normalizedDueAt = null;
if ($dueAt !== '') {
    $timestamp = strtotime($dueAt);
    if ($timestamp === false) {
        json_error('Invalid due date format', null, 422);
    }
    $normalizedDueAt = date('Y-m-d H:i:s', $timestamp);
}

$stmt = $pdo->prepare(
    'INSERT INTO assignments
     (course_id, module_id, lesson_id, title, description, max_marks, due_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
);
$stmt->execute([
    $courseId,
    $moduleId,
    $lessonId,
    $title,
    $description !== '' ? $description : null,
    $maxMarks,
    $normalizedDueAt
]);

$assignmentId = (int) $pdo->lastInsertId();

json_success([
    'assignment' => [
        'id' => $assignmentId,
        '_id' => $assignmentId,
        'courseId' => $courseId,
        'courseSlug' => $course['slug'],
        'title' => $title,
        'description' => $description !== '' ? $description : null,
        'maxMarks' => $maxMarks,
        'dueAt' => $normalizedDueAt
    ]
], 'Assignment created', 201);
