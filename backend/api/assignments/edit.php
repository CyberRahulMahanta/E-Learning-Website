<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH', 'POST'], true)) {
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

$assignmentStmt = $pdo->prepare('SELECT * FROM assignments WHERE id = ? LIMIT 1');
$assignmentStmt->execute([$assignmentId]);
$assignment = $assignmentStmt->fetch();
if (!$assignment) {
    json_error('Assignment not found', null, 404);
}

$courseStmt = $pdo->prepare('SELECT id, slug, instructor_id FROM courses WHERE id = ? LIMIT 1');
$courseStmt->execute([(int) $assignment['course_id']]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && (int) $course['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden: you can only edit assignment for your own course', null, 403);
}

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

if (isset($data['maxMarks']) || isset($data['max_marks'])) {
    $maxMarks = isset($data['maxMarks']) ? (float) $data['maxMarks'] : (float) $data['max_marks'];
    if ($maxMarks <= 0) {
        json_error('Max marks must be greater than zero', null, 422);
    }
    $fields[] = 'max_marks = ?';
    $params[] = $maxMarks;
}

if (isset($data['dueAt']) || isset($data['due_at'])) {
    $dueAtInput = trim((string) ($data['dueAt'] ?? $data['due_at'] ?? ''));
    $normalizedDueAt = null;
    if ($dueAtInput !== '') {
        $timestamp = strtotime($dueAtInput);
        if ($timestamp === false) {
            json_error('Invalid due date format', null, 422);
        }
        $normalizedDueAt = date('Y-m-d H:i:s', $timestamp);
    }
    $fields[] = 'due_at = ?';
    $params[] = $normalizedDueAt;
}

if (isset($data['moduleId']) || isset($data['module_id'])) {
    $moduleId = to_int($data['moduleId'] ?? $data['module_id']);
    $fields[] = 'module_id = ?';
    $params[] = $moduleId;
}

if (isset($data['lessonId']) || isset($data['lesson_id'])) {
    $lessonId = to_int($data['lessonId'] ?? $data['lesson_id']);
    $fields[] = 'lesson_id = ?';
    $params[] = $lessonId;
}

if (isset($data['isActive']) || isset($data['is_active'])) {
    $isActive = to_bool($data['isActive'] ?? $data['is_active'], true);
    $fields[] = 'is_active = ?';
    $params[] = $isActive ? 1 : 0;
}

if (empty($fields)) {
    json_error('No valid fields provided', null, 422);
}

$params[] = $assignmentId;
$updateStmt = $pdo->prepare('UPDATE assignments SET ' . implode(', ', $fields) . ' WHERE id = ?');
$updateStmt->execute($params);

$assignmentStmt->execute([$assignmentId]);
$updated = $assignmentStmt->fetch();

json_success([
    'assignment' => [
        'id' => (int) $updated['id'],
        '_id' => (int) $updated['id'],
        'courseId' => (int) $updated['course_id'],
        'moduleId' => to_int($updated['module_id']),
        'lessonId' => to_int($updated['lesson_id']),
        'title' => $updated['title'],
        'description' => $updated['description'],
        'maxMarks' => (float) $updated['max_marks'],
        'dueAt' => $updated['due_at'],
        'isActive' => (bool) $updated['is_active'],
        'updated_at' => $updated['updated_at']
    ]
], 'Assignment updated');
