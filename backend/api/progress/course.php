<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Valid course id required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}
$courseId = (int) $course['id'];

$targetUserId = to_int($_GET['userId'] ?? $_GET['user_id'] ?? null);
if (!$targetUserId || $targetUserId <= 0) {
    $targetUserId = (int) $authUser['id'];
}

if ($targetUserId !== (int) $authUser['id']) {
    if ((string) $authUser['role'] === 'admin') {
        // allowed
    } else {
        ensure_permission($pdo, $authUser, 'student.progress.view.own');
        ensure_course_manage_access($pdo, $authUser, $courseId);
    }
}

$courseProgress = null;
if (table_exists($pdo, 'user_course_progress')) {
    $courseStmt = $pdo->prepare(
        'SELECT progress_percent, completed_lessons, total_lessons, status, last_activity_at, completed_at
         FROM user_course_progress
         WHERE user_id = ? AND course_id = ?
         LIMIT 1'
    );
    $courseStmt->execute([$targetUserId, $courseId]);
    $row = $courseStmt->fetch();
    if ($row) {
        $courseProgress = [
            'progressPercent' => (float) $row['progress_percent'],
            'completedLessons' => (int) $row['completed_lessons'],
            'totalLessons' => (int) $row['total_lessons'],
            'status' => $row['status'],
            'lastActivityAt' => $row['last_activity_at'],
            'completedAt' => $row['completed_at']
        ];
    }
}

$completion = evaluate_course_completion_requirements($pdo, (int) $targetUserId, $courseId);
$certificate = null;
if (!empty($completion['eligible'])) {
    $certificate = issue_course_certificate(
        $pdo,
        (int) $targetUserId,
        $courseId,
        [
            'issuedFrom' => 'progress.course'
        ]
    );
} else {
    $certificate = get_user_course_certificate($pdo, (int) $targetUserId, $courseId);
}

$lessonProgress = [];
if (table_exists($pdo, 'user_lesson_progress')) {
    $lessonStmt = $pdo->prepare(
        'SELECT lp.lesson_id, lp.progress_percent, lp.status, lp.last_watched_second, lp.completed_at
         FROM user_lesson_progress lp
         JOIN course_lessons l ON l.id = lp.lesson_id
         JOIN course_modules m ON m.id = l.module_id
         WHERE lp.user_id = ? AND m.course_id = ?
         ORDER BY lp.updated_at DESC'
    );
    $lessonStmt->execute([$targetUserId, $courseId]);
    $lessonProgress = array_map(function ($row) {
        return [
            'lessonId' => (int) $row['lesson_id'],
            'progressPercent' => (float) $row['progress_percent'],
            'status' => $row['status'],
            'lastWatchedSecond' => (int) $row['last_watched_second'],
            'completedAt' => $row['completed_at']
        ];
    }, $lessonStmt->fetchAll());
}

json_success([
    'userId' => (int) $targetUserId,
    'courseId' => $courseId,
    'courseProgress' => $courseProgress,
    'lessonProgress' => $lessonProgress,
    'completion' => $completion,
    'certificate' => $certificate
], 'Course progress fetched');
