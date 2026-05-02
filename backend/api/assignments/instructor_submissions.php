<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'assignments') || !table_exists($pdo, 'assignment_submissions')) {
    json_error('Assignment feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'assignment.manage.own');

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, slug, name, instructor_id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$courseId = (int) $course['id'];
$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && (int) $course['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden: you can only view submissions for your own course', null, 403);
}

$assignmentStmt = $pdo->prepare(
    'SELECT id, title, description, max_marks, due_at, module_id, lesson_id, created_at, updated_at
     FROM assignments
     WHERE course_id = ? AND is_active = 1
     ORDER BY created_at DESC'
);
$assignmentStmt->execute([$courseId]);
$assignments = $assignmentStmt->fetchAll();

$assignmentIds = array_map(function ($row) {
    return (int) $row['id'];
}, $assignments);

$submissionsByAssignment = [];
if (!empty($assignmentIds)) {
    $placeholders = implode(',', array_fill(0, count($assignmentIds), '?'));
    $submissionStmt = $pdo->prepare(
        'SELECT s.id, s.assignment_id, s.user_id, s.submission_text, s.submission_url, s.status, s.marks, s.feedback, s.submitted_at, s.reviewed_at,
                u.username, u.email
         FROM assignment_submissions s
         JOIN users u ON u.id = s.user_id
         WHERE s.assignment_id IN (' . $placeholders . ')
         ORDER BY s.submitted_at DESC, s.created_at DESC'
    );
    $submissionStmt->execute($assignmentIds);
    foreach ($submissionStmt->fetchAll() as $row) {
        $assignmentId = (int) $row['assignment_id'];
        $submissionsByAssignment[$assignmentId][] = [
            'id' => (int) $row['id'],
            '_id' => (int) $row['id'],
            'assignmentId' => $assignmentId,
            'userId' => (int) $row['user_id'],
            'user' => [
                'id' => (int) $row['user_id'],
                '_id' => (int) $row['user_id'],
                'username' => $row['username'],
                'email' => $row['email']
            ],
            'submissionText' => $row['submission_text'],
            'submissionUrl' => $row['submission_url'],
            'status' => $row['status'],
            'marks' => $row['marks'] !== null ? (float) $row['marks'] : null,
            'feedback' => $row['feedback'],
            'submittedAt' => $row['submitted_at'],
            'reviewedAt' => $row['reviewed_at']
        ];
    }
}

$resultAssignments = array_map(function ($assignment) use ($submissionsByAssignment) {
    $assignmentId = (int) $assignment['id'];
    $submissions = $submissionsByAssignment[$assignmentId] ?? [];
    return [
        'id' => $assignmentId,
        '_id' => $assignmentId,
        'title' => $assignment['title'],
        'description' => $assignment['description'],
        'maxMarks' => (float) $assignment['max_marks'],
        'dueAt' => $assignment['due_at'],
        'moduleId' => to_int($assignment['module_id']),
        'lessonId' => to_int($assignment['lesson_id']),
        'submissionCount' => count($submissions),
        'submissions' => $submissions,
        'created_at' => $assignment['created_at'],
        'updated_at' => $assignment['updated_at']
    ];
}, $assignments);

json_success([
    'course' => [
        'id' => $courseId,
        'slug' => $course['slug'],
        'name' => $course['name']
    ],
    'assignments' => $resultAssignments
], 'Assignment submissions fetched');
