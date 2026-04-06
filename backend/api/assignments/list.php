<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'assignments')) {
    json_success(['assignments' => []], 'Assignments fetched');
}

$authUser = ensure_authenticated($pdo);
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
$isOwner = (int) $course['instructor_id'] === (int) $authUser['id'];
$isAdmin = (string) $authUser['role'] === 'admin';

if (!$isOwner && !$isAdmin) {
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
    if (!$enrollmentStmt->fetchColumn()) {
        json_error('Enroll in this course to access assignments', null, 403);
    }
}

$assignmentStmt = $pdo->prepare(
    'SELECT * FROM assignments
     WHERE course_id = ? AND is_active = 1
     ORDER BY created_at DESC'
);
$assignmentStmt->execute([$courseId]);
$assignmentRows = $assignmentStmt->fetchAll();

$assignmentIds = array_map(function ($assignment) {
    return (int) $assignment['id'];
}, $assignmentRows);

$submissionMap = [];
if (!empty($assignmentIds) && table_exists($pdo, 'assignment_submissions')) {
    $placeholders = implode(',', array_fill(0, count($assignmentIds), '?'));
    $submissionStmt = $pdo->prepare(
        'SELECT * FROM assignment_submissions
         WHERE user_id = ? AND assignment_id IN (' . $placeholders . ')'
    );
    $submissionStmt->execute(array_merge([(int) $authUser['id']], $assignmentIds));
    foreach ($submissionStmt->fetchAll() as $submission) {
        $submissionMap[(int) $submission['assignment_id']] = [
            'submissionId' => (int) $submission['id'],
            'submissionText' => $submission['submission_text'],
            'submissionUrl' => $submission['submission_url'],
            'status' => $submission['status'],
            'marks' => $submission['marks'] !== null ? (float) $submission['marks'] : null,
            'feedback' => $submission['feedback'],
            'submittedAt' => $submission['submitted_at'],
            'reviewedAt' => $submission['reviewed_at']
        ];
    }
}

$assignments = array_map(function ($assignment) use ($submissionMap) {
    $assignmentId = (int) $assignment['id'];
    return [
        'id' => $assignmentId,
        '_id' => $assignmentId,
        'courseId' => (int) $assignment['course_id'],
        'moduleId' => to_int($assignment['module_id']),
        'lessonId' => to_int($assignment['lesson_id']),
        'title' => $assignment['title'],
        'description' => $assignment['description'],
        'maxMarks' => (float) $assignment['max_marks'],
        'dueAt' => $assignment['due_at'],
        'submission' => $submissionMap[$assignmentId] ?? null,
        'created_at' => $assignment['created_at'],
        'updated_at' => $assignment['updated_at']
    ];
}, $assignmentRows);

json_success([
    'courseId' => $courseId,
    'courseSlug' => $course['slug'],
    'assignments' => $assignments
], 'Assignments fetched');

