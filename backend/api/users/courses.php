<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);

$stmt = $pdo->prepare(
    'SELECT e.id AS enrollment_id, e.course_id, e.payment_method, e.transaction_id, e.enrolled_at, e.status,
            c.*, u.username AS instructor_username, u.email AS instructor_email
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN users u ON u.id = c.instructor_id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC'
);
$stmt->execute([(int) $authUser['id']]);
$rows = $stmt->fetchAll();

$progressMap = [];
$completionMap = [];
if (table_exists($pdo, 'user_course_progress')) {
    $progressStmt = $pdo->prepare(
        'SELECT course_id, progress_percent, completed_lessons, total_lessons, status, last_activity_at, completed_at
         FROM user_course_progress
         WHERE user_id = ?'
    );
    $progressStmt->execute([(int) $authUser['id']]);
    foreach ($progressStmt->fetchAll() as $progressRow) {
        $progressMap[(int) $progressRow['course_id']] = [
            'progressPercent' => (float) $progressRow['progress_percent'],
            'completedLessons' => (int) $progressRow['completed_lessons'],
            'totalLessons' => (int) $progressRow['total_lessons'],
            'status' => $progressRow['status'],
            'lastActivityAt' => $progressRow['last_activity_at'],
            'completedAt' => $progressRow['completed_at']
        ];
    }
}

foreach ($rows as $row) {
    $courseId = (int) $row['course_id'];
    $completionMap[$courseId] = evaluate_course_completion_requirements($pdo, (int) $authUser['id'], $courseId);
}

$certificateMap = [];
if (table_exists($pdo, 'certificates')) {
    foreach ($rows as $row) {
        $courseId = (int) $row['course_id'];
        if (!empty($completionMap[$courseId]['eligible'])) {
            issue_course_certificate(
                $pdo,
                (int) $authUser['id'],
                $courseId,
                ['issuedFrom' => 'users.courses']
            );
        }
    }

    $certStmt = $pdo->prepare(
        'SELECT id, user_id, course_id, certificate_code, issue_date, metadata, created_at
         FROM certificates
         WHERE user_id = ?'
    );
    $certStmt->execute([(int) $authUser['id']]);
    foreach ($certStmt->fetchAll() as $certRow) {
        $certificateMap[(int) $certRow['course_id']] = normalize_certificate($certRow);
    }
}

$courses = array_map(function ($row) use ($progressMap, $certificateMap, $completionMap) {
    $course = normalize_course($row);

    return [
        'id' => (int) $row['enrollment_id'],
        '_id' => (int) $row['enrollment_id'],
        'course_id' => (int) $row['course_id'],
        'payment_method' => $row['payment_method'],
        'transaction_id' => $row['transaction_id'],
        'status' => $row['status'],
        'enrolledAt' => $row['enrolled_at'],
        'createdAt' => $row['enrolled_at'],
        'progress' => $progressMap[(int) $row['course_id']] ?? null,
        'completion' => $completionMap[(int) $row['course_id']] ?? null,
        'certificate' => $certificateMap[(int) $row['course_id']] ?? null,
        'course' => $course
    ];
}, $rows);

json_success(['courses' => $courses], 'Enrolled courses fetched');
