<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.enroll');
$data = get_input_data();

$courseInput = $data['course_id'] ?? '';
$paymentMethod = sanitize($data['paymentMethod'] ?? $data['payment_method'] ?? 'unknown');
$transactionId = sanitize($data['transactionId'] ?? $data['transaction_id'] ?? '');

if ($courseInput === '' || $courseInput === null) {
    json_error('Course id required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, (string) $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$courseId = (int) $course['id'];

$existsStmt = $pdo->prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
$existsStmt->execute([(int) $authUser['id'], $courseId]);
if ($existsStmt->fetch()) {
    json_success(['alreadyEnrolled' => true], 'Already enrolled');
}

$insertStmt = $pdo->prepare(
    'INSERT INTO enrollments (user_id, course_id, payment_method, transaction_id)
     VALUES (?, ?, ?, ?)'
);
$insertStmt->execute([
    (int) $authUser['id'],
    $courseId,
    $paymentMethod !== '' ? $paymentMethod : 'unknown',
    $transactionId !== '' ? $transactionId : null
]);

if (table_exists($pdo, 'user_course_progress')) {
    $totalStmt = $pdo->prepare(
        'SELECT COUNT(l.id)
         FROM course_modules m
         JOIN course_lessons l ON l.module_id = m.id
         WHERE m.course_id = ? AND l.is_published = 1'
    );
    $totalStmt->execute([$courseId]);
    $totalLessons = (int) $totalStmt->fetchColumn();

    $progressStmt = $pdo->prepare(
        'INSERT INTO user_course_progress
         (user_id, course_id, progress_percent, completed_lessons, total_lessons, status, last_activity_at)
         VALUES (?, ?, 0, 0, ?, "not_started", NOW())
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP'
    );
    $progressStmt->execute([
        (int) $authUser['id'],
        $courseId,
        $totalLessons
    ]);
}

if (table_exists($pdo, 'user_notifications')) {
    $notifyStmt = $pdo->prepare(
        'INSERT INTO user_notifications (user_id, type, title, message, data, is_read)
         VALUES (?, "enrollment", "Enrollment Successful", "You are now enrolled in the course.", ?, 0)'
    );
    $notifyStmt->execute([
        (int) $authUser['id'],
        json_encode(['courseId' => $courseId], JSON_UNESCAPED_SLASHES)
    ]);
}

json_success(['alreadyEnrolled' => false], 'Enrollment successful', 201);
