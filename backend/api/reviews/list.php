<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'course_reviews')) {
    json_success(['reviews' => []], 'Reviews fetched');
}

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

$pagination = get_pagination_params(10, 100);

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM course_reviews WHERE course_id = ? AND is_published = 1');
$countStmt->execute([$courseId]);
$total = (int) $countStmt->fetchColumn();

$stmt = $pdo->prepare(
    'SELECT r.id, r.user_id, r.rating, r.review_text, r.created_at, r.updated_at, u.username
     FROM course_reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.course_id = ? AND r.is_published = 1
     ORDER BY r.updated_at DESC
     LIMIT ? OFFSET ?'
);
$stmt->execute([$courseId, $pagination['limit'], $pagination['offset']]);

$reviews = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'rating' => (int) $row['rating'],
        'review' => $row['review_text'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'user' => [
            'id' => (int) $row['user_id'],
            '_id' => (int) $row['user_id'],
            'username' => $row['username']
        ]
    ];
}, $stmt->fetchAll());

$aggStmt = $pdo->prepare(
    'SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS review_count
     FROM course_reviews
     WHERE course_id = ? AND is_published = 1'
);
$aggStmt->execute([$courseId]);
$agg = $aggStmt->fetch();

json_success([
    'reviews' => $reviews,
    'stats' => [
        'avgRating' => (float) $agg['avg_rating'],
        'reviewCount' => (int) $agg['review_count']
    ],
    'pagination' => paginate_items([], $total, $pagination['page'], $pagination['limit'])['pagination']
], 'Reviews fetched');

