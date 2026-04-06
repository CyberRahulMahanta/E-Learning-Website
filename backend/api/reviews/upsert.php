<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'course_reviews')) {
    json_error('Review feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.review.create');

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

$enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
$enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
if (!$enrollmentStmt->fetchColumn()) {
    json_error('Only enrolled students can review this course', null, 403);
}

$data = get_input_data();
$rating = to_int($data['rating'] ?? null);
$reviewText = trim((string) ($data['review'] ?? $data['review_text'] ?? ''));

if (!$rating || $rating < 1 || $rating > 5) {
    json_error('Rating must be between 1 and 5', null, 422);
}

$stmt = $pdo->prepare(
    'INSERT INTO course_reviews (user_id, course_id, rating, review_text, is_published)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       rating = VALUES(rating),
       review_text = VALUES(review_text),
       is_published = 1,
       updated_at = CURRENT_TIMESTAMP'
);
$stmt->execute([
    (int) $authUser['id'],
    $courseId,
    $rating,
    $reviewText !== '' ? $reviewText : null
]);

$aggStmt = $pdo->prepare(
    'SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS review_count
     FROM course_reviews
     WHERE course_id = ? AND is_published = 1'
);
$aggStmt->execute([$courseId]);
$agg = $aggStmt->fetch();

json_success([
    'review' => [
        'userId' => (int) $authUser['id'],
        'courseId' => $courseId,
        'rating' => $rating,
        'review' => $reviewText !== '' ? $reviewText : null
    ],
    'stats' => [
        'avgRating' => (float) $agg['avg_rating'],
        'reviewCount' => (int) $agg['review_count']
    ]
], 'Review saved');

