<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'progress.update');

$lessonId = to_int($_GET['id'] ?? null);
if (!$lessonId || $lessonId <= 0) {
    json_error('Valid lesson id required', null, 422);
}

$lessonStmt = $pdo->prepare(
    'SELECT l.id, l.is_published, m.course_id
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

$courseId = (int) $lesson['course_id'];

$hasEnrollment = false;
if ((string) $authUser['role'] === 'admin') {
    $hasEnrollment = true;
} else {
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
    $hasEnrollment = (bool) $enrollmentStmt->fetchColumn();
}
if (!$hasEnrollment) {
    json_error('Enroll in this course to track progress', null, 403);
}

$data = get_input_data();
$progressPercent = isset($data['progressPercent']) ? (float) $data['progressPercent'] : (isset($data['progress_percent']) ? (float) $data['progress_percent'] : null);
$lastWatchedSecond = to_int($data['lastWatchedSecond'] ?? $data['last_watched_second'] ?? 0);
$status = sanitize($data['status'] ?? '');

if ($progressPercent === null) {
    $progressPercent = 0.0;
}
$progressPercent = max(0.0, min(100.0, $progressPercent));

$validStatuses = ['not_started', 'in_progress', 'completed'];
if ($status === '') {
    if ($progressPercent >= 100) {
        $status = 'completed';
    } elseif ($progressPercent > 0) {
        $status = 'in_progress';
    } else {
        $status = 'not_started';
    }
}
if (!in_array($status, $validStatuses, true)) {
    json_error('Invalid progress status', null, 422);
}

$upsertStmt = $pdo->prepare(
    'INSERT INTO user_lesson_progress (user_id, lesson_id, progress_percent, status, last_watched_second, completed_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       progress_percent = VALUES(progress_percent),
       status = VALUES(status),
       last_watched_second = VALUES(last_watched_second),
       completed_at = VALUES(completed_at),
       updated_at = CURRENT_TIMESTAMP'
);
$completedAt = $status === 'completed' ? date('Y-m-d H:i:s') : null;
$upsertStmt->execute([
    (int) $authUser['id'],
    $lessonId,
    $progressPercent,
    $status,
    $lastWatchedSecond ? max(0, $lastWatchedSecond) : 0,
    $completedAt
]);

$totalStmt = $pdo->prepare(
    'SELECT COUNT(l.id)
     FROM course_modules m
     JOIN course_lessons l ON l.module_id = m.id
     WHERE m.course_id = ? AND l.is_published = 1'
);
$totalStmt->execute([$courseId]);
$totalLessons = (int) $totalStmt->fetchColumn();

$completedStmt = $pdo->prepare(
    'SELECT COUNT(lp.id)
     FROM user_lesson_progress lp
     JOIN course_lessons l ON l.id = lp.lesson_id
     JOIN course_modules m ON m.id = l.module_id
     WHERE lp.user_id = ?
       AND m.course_id = ?
       AND lp.status = "completed"'
);
$completedStmt->execute([(int) $authUser['id'], $courseId]);
$completedLessons = (int) $completedStmt->fetchColumn();

$courseProgressPercent = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0.0;
$courseStatus = 'not_started';
if ($courseProgressPercent >= 100 && $totalLessons > 0) {
    $courseStatus = 'completed';
} elseif ($courseProgressPercent > 0) {
    $courseStatus = 'in_progress';
}

$courseProgressStmt = $pdo->prepare(
    'INSERT INTO user_course_progress
     (user_id, course_id, progress_percent, completed_lessons, total_lessons, status, last_activity_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       progress_percent = VALUES(progress_percent),
       completed_lessons = VALUES(completed_lessons),
       total_lessons = VALUES(total_lessons),
       status = VALUES(status),
       last_activity_at = NOW(),
       completed_at = VALUES(completed_at),
       updated_at = CURRENT_TIMESTAMP'
);
$courseCompletedAt = $courseStatus === 'completed' ? date('Y-m-d H:i:s') : null;
$courseProgressStmt->execute([
    (int) $authUser['id'],
    $courseId,
    $courseProgressPercent,
    $completedLessons,
    $totalLessons,
    $courseStatus,
    $courseCompletedAt
]);

$certificate = null;
if ($courseStatus === 'completed' && $totalLessons > 0) {
    $certificate = issue_course_certificate(
        $pdo,
        (int) $authUser['id'],
        $courseId,
        [
            'issuedFrom' => 'progress.update',
            'completedLessons' => $completedLessons,
            'totalLessons' => $totalLessons
        ]
    );
}

json_success([
    'lessonProgress' => [
        'lessonId' => $lessonId,
        'progressPercent' => $progressPercent,
        'status' => $status,
        'lastWatchedSecond' => $lastWatchedSecond ? max(0, $lastWatchedSecond) : 0
    ],
    'courseProgress' => [
        'courseId' => $courseId,
        'progressPercent' => $courseProgressPercent,
        'completedLessons' => $completedLessons,
        'totalLessons' => $totalLessons,
        'status' => $courseStatus
    ],
    'certificate' => $certificate
], 'Progress updated');
