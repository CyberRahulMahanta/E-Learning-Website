<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH', 'POST'], true)) {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'assignment_submissions') || !table_exists($pdo, 'assignments')) {
    json_error('Assignment feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'assignment.manage.own');

$submissionId = to_int($_GET['id'] ?? null);
if (!$submissionId || $submissionId <= 0) {
    json_error('Valid submission id required', null, 422);
}

$submissionStmt = $pdo->prepare(
    'SELECT s.*, a.course_id, a.max_marks
     FROM assignment_submissions s
     JOIN assignments a ON a.id = s.assignment_id
     WHERE s.id = ?
     LIMIT 1'
);
$submissionStmt->execute([$submissionId]);
$submission = $submissionStmt->fetch();
if (!$submission) {
    json_error('Submission not found', null, 404);
}

$courseStmt = $pdo->prepare('SELECT instructor_id FROM courses WHERE id = ? LIMIT 1');
$courseStmt->execute([(int) $submission['course_id']]);
$ownerId = (int) $courseStmt->fetchColumn();

$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && $ownerId !== (int) $authUser['id']) {
    json_error('Forbidden: you can only review submissions for your own course', null, 403);
}

$data = get_input_data();
$status = sanitize($data['status'] ?? 'reviewed');
$feedback = trim((string) ($data['feedback'] ?? ''));
$marks = array_key_exists('marks', $data) ? (float) $data['marks'] : null;

$validStatuses = ['reviewed', 'accepted', 'rejected'];
if (!in_array($status, $validStatuses, true)) {
    json_error('Invalid review status', null, 422);
}

if ($marks !== null) {
    if ($marks < 0 || $marks > (float) $submission['max_marks']) {
        json_error('Marks must be between 0 and max marks', null, 422);
    }
}

$updateStmt = $pdo->prepare(
    'UPDATE assignment_submissions
     SET status = ?,
         marks = ?,
         feedback = ?,
         reviewed_at = NOW(),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?'
);
$updateStmt->execute([
    $status,
    $marks,
    $feedback !== '' ? $feedback : null,
    $submissionId
]);

$submissionStmt->execute([$submissionId]);
$updated = $submissionStmt->fetch();

json_success([
    'submission' => [
        'id' => (int) $updated['id'],
        '_id' => (int) $updated['id'],
        'assignmentId' => (int) $updated['assignment_id'],
        'userId' => (int) $updated['user_id'],
        'status' => $updated['status'],
        'marks' => $updated['marks'] !== null ? (float) $updated['marks'] : null,
        'feedback' => $updated['feedback'],
        'submittedAt' => $updated['submitted_at'],
        'reviewedAt' => $updated['reviewed_at']
    ]
], 'Submission reviewed');
