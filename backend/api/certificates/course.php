<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);

$idOrSlug = sanitize($_GET['id'] ?? '');
if ($idOrSlug === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare(
    'SELECT id, slug, name, instructor_id
     FROM courses
     WHERE id = :id OR slug = :slug
     LIMIT 1'
);
$courseStmt->execute([
    ':id' => $idOrSlug,
    ':slug' => $idOrSlug
]);
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

$canView = false;
if ((string) $authUser['role'] === 'admin') {
    $canView = true;
} elseif ((int) $course['instructor_id'] === (int) $authUser['id']) {
    $canView = true;
} elseif ($targetUserId === (int) $authUser['id']) {
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([$targetUserId, $courseId]);
    $canView = (bool) $enrollmentStmt->fetchColumn();
}

if (!$canView) {
    json_error('Forbidden', null, 403);
}

$progressPercent = 0.0;
$completedLessons = 0;
$totalLessons = 0;
$status = 'not_started';
$completedAt = null;

if (table_exists($pdo, 'user_course_progress')) {
    $progressStmt = $pdo->prepare(
        'SELECT progress_percent, completed_lessons, total_lessons, status, completed_at
         FROM user_course_progress
         WHERE user_id = ? AND course_id = ?
         LIMIT 1'
    );
    $progressStmt->execute([$targetUserId, $courseId]);
    $progressRow = $progressStmt->fetch();
    if ($progressRow) {
        $progressPercent = (float) $progressRow['progress_percent'];
        $completedLessons = (int) $progressRow['completed_lessons'];
        $totalLessons = (int) $progressRow['total_lessons'];
        $status = (string) $progressRow['status'];
        $completedAt = $progressRow['completed_at'];
    }
}

if ($totalLessons <= 0) {
    $totalStmt = $pdo->prepare(
        'SELECT COUNT(l.id)
         FROM course_modules m
         JOIN course_lessons l ON l.module_id = m.id
         WHERE m.course_id = ? AND l.is_published = 1'
    );
    $totalStmt->execute([$courseId]);
    $totalLessons = (int) $totalStmt->fetchColumn();
}

if ($completedLessons <= 0 && table_exists($pdo, 'user_lesson_progress')) {
    $completedStmt = $pdo->prepare(
        'SELECT COUNT(lp.id)
         FROM user_lesson_progress lp
         JOIN course_lessons l ON l.id = lp.lesson_id
         JOIN course_modules m ON m.id = l.module_id
         WHERE lp.user_id = ?
           AND m.course_id = ?
           AND lp.status = "completed"'
    );
    $completedStmt->execute([$targetUserId, $courseId]);
    $completedLessons = (int) $completedStmt->fetchColumn();
}

if ($totalLessons > 0) {
    $computedPercent = round(($completedLessons / $totalLessons) * 100, 2);
    if ($computedPercent > $progressPercent) {
        $progressPercent = $computedPercent;
    }
}

if ($status !== 'completed') {
    if ($totalLessons > 0 && $completedLessons >= $totalLessons) {
        $status = 'completed';
    } elseif ($progressPercent > 0) {
        $status = 'in_progress';
    }
}

$eligible = ($status === 'completed') || ($totalLessons > 0 && $progressPercent >= 100);

$certificate = null;
if ($eligible) {
    $certificate = issue_course_certificate(
        $pdo,
        $targetUserId,
        $courseId,
        [
            'issuedFrom' => 'certificates.course'
        ]
    );
} else {
    $certificate = get_user_course_certificate($pdo, $targetUserId, $courseId);
}

$targetUser = null;
if ($targetUserId > 0) {
    $userStmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $userStmt->execute([$targetUserId]);
    $targetUser = $userStmt->fetch() ?: null;
}

json_success([
    'courseId' => $courseId,
    'courseSlug' => $course['slug'],
    'eligible' => (bool) $eligible,
    'issued' => (bool) $certificate,
    'certificate' => $certificate,
    'courseProgress' => [
        'progressPercent' => $progressPercent,
        'completedLessons' => $completedLessons,
        'totalLessons' => $totalLessons,
        'status' => $status,
        'completedAt' => $completedAt
    ],
    'user' => $targetUser ? normalize_user($targetUser) : null
], $certificate ? 'Certificate available' : 'Certificate not issued yet');
