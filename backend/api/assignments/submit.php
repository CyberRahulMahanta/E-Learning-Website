<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'assignments') || !table_exists($pdo, 'assignment_submissions')) {
    json_error('Assignment feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'assignment.submit');

$assignmentId = to_int($_GET['id'] ?? null);
if (!$assignmentId || $assignmentId <= 0) {
    json_error('Valid assignment id required', null, 422);
}

$assignmentStmt = $pdo->prepare('SELECT * FROM assignments WHERE id = ? AND is_active = 1 LIMIT 1');
$assignmentStmt->execute([$assignmentId]);
$assignment = $assignmentStmt->fetch();
if (!$assignment) {
    json_error('Assignment not found', null, 404);
}

$courseId = (int) $assignment['course_id'];
$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin) {
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
    if (!$enrollmentStmt->fetchColumn()) {
        json_error('Enroll in this course to submit assignment', null, 403);
    }
}

$data = get_input_data();
$submissionText = trim((string) ($data['submissionText'] ?? $data['submission_text'] ?? ''));
$submissionUrl = trim((string) ($data['submissionUrl'] ?? $data['submission_url'] ?? ''));

if ($submissionText === '' && $submissionUrl === '') {
    json_error('Provide assignment text or submission URL', null, 422);
}

$dueAt = $assignment['due_at'];
if ($dueAt !== null && strtotime($dueAt) < time()) {
    json_error('Assignment deadline has passed', null, 422);
}

$upsertStmt = $pdo->prepare(
    'INSERT INTO assignment_submissions
     (assignment_id, user_id, submission_text, submission_url, status, submitted_at)
     VALUES (?, ?, ?, ?, "submitted", NOW())
     ON DUPLICATE KEY UPDATE
       submission_text = VALUES(submission_text),
       submission_url = VALUES(submission_url),
       status = "submitted",
       submitted_at = NOW(),
       updated_at = CURRENT_TIMESTAMP'
);
$upsertStmt->execute([
    $assignmentId,
    (int) $authUser['id'],
    $submissionText !== '' ? $submissionText : null,
    $submissionUrl !== '' ? $submissionUrl : null
]);

$fetchStmt = $pdo->prepare(
    'SELECT *
     FROM assignment_submissions
     WHERE assignment_id = ? AND user_id = ?
     LIMIT 1'
);
$fetchStmt->execute([$assignmentId, (int) $authUser['id']]);
$submission = $fetchStmt->fetch();

json_success([
    'submission' => [
        'id' => (int) $submission['id'],
        '_id' => (int) $submission['id'],
        'assignmentId' => (int) $submission['assignment_id'],
        'userId' => (int) $submission['user_id'],
        'submissionText' => $submission['submission_text'],
        'submissionUrl' => $submission['submission_url'],
        'status' => $submission['status'],
        'marks' => $submission['marks'] !== null ? (float) $submission['marks'] : null,
        'feedback' => $submission['feedback'],
        'submittedAt' => $submission['submitted_at'],
        'reviewedAt' => $submission['reviewed_at']
    ]
], 'Assignment submitted');

