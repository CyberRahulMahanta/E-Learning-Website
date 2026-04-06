<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'course_wishlist')) {
    json_error('Wishlist feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.wishlist.manage');

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}
$courseId = (int) $course['id'];

$existsStmt = $pdo->prepare('SELECT id FROM course_wishlist WHERE user_id = ? AND course_id = ? LIMIT 1');
$existsStmt->execute([(int) $authUser['id'], $courseId]);
$existing = $existsStmt->fetch();

if ($existing) {
    $deleteStmt = $pdo->prepare('DELETE FROM course_wishlist WHERE id = ?');
    $deleteStmt->execute([(int) $existing['id']]);
    json_success([
        'wishlisted' => false,
        'courseId' => $courseId
    ], 'Removed from wishlist');
}

$insertStmt = $pdo->prepare('INSERT INTO course_wishlist (user_id, course_id) VALUES (?, ?)');
$insertStmt->execute([(int) $authUser['id'], $courseId]);

json_success([
    'wishlisted' => true,
    'courseId' => $courseId
], 'Added to wishlist', 201);

