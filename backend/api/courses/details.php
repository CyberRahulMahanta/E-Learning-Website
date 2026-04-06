<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$idOrSlug = sanitize($_GET['id'] ?? '');
if ($idOrSlug === '') {
    json_error('Course id or slug required', null, 422);
}

$hasReviews = table_exists($pdo, 'course_reviews');

$sql = 'SELECT c.*, u.username AS instructor_username, u.email AS instructor_email';
if ($hasReviews) {
    $sql .= ', COALESCE(rv.avg_rating, 0) AS avg_rating, COALESCE(rv.review_count, 0) AS review_count';
}
$sql .= '
        FROM courses c
        JOIN users u ON c.instructor_id = u.id ';
if ($hasReviews) {
    $sql .= '
        LEFT JOIN (
            SELECT course_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
            FROM course_reviews
            WHERE is_published = 1
            GROUP BY course_id
        ) rv ON rv.course_id = c.id ';
}
$sql .= '
        WHERE c.id = :id OR c.slug = :slug
        LIMIT 1';

$stmt = $pdo->prepare($sql);
$stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
$course = $stmt->fetch();

if (!$course) {
    json_error('Course not found', null, 404);
}

$normalized = normalize_course($course);
$normalized = attach_course_syllabus($pdo, $normalized);

$response = ['course' => $normalized];

if ($hasReviews) {
    $reviewStmt = $pdo->prepare(
        'SELECT r.id, r.rating, r.review_text, r.created_at, u.id AS user_id, u.username
         FROM course_reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.course_id = ? AND r.is_published = 1
         ORDER BY r.created_at DESC
         LIMIT 20'
    );
    $reviewStmt->execute([(int) $course['id']]);
    $response['reviews'] = array_map(function ($row) {
        return [
            'id' => (int) $row['id'],
            'rating' => (int) $row['rating'],
            'review' => $row['review_text'],
            'created_at' => $row['created_at'],
            'user' => [
                'id' => (int) $row['user_id'],
                'username' => $row['username']
            ]
        ];
    }, $reviewStmt->fetchAll());
}

$authUser = get_authenticated_user($pdo);
if ($authUser) {
    $enrolled = false;
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([(int) $authUser['id'], (int) $course['id']]);
    $enrolled = (bool) $enrollmentStmt->fetchColumn();

    $wishlisted = false;
    if (table_exists($pdo, 'course_wishlist')) {
        $wishlistStmt = $pdo->prepare('SELECT 1 FROM course_wishlist WHERE user_id = ? AND course_id = ? LIMIT 1');
        $wishlistStmt->execute([(int) $authUser['id'], (int) $course['id']]);
        $wishlisted = (bool) $wishlistStmt->fetchColumn();
    }

    $progress = null;
    $certificate = null;
    if (table_exists($pdo, 'user_course_progress')) {
        $progressStmt = $pdo->prepare(
            'SELECT progress_percent, completed_lessons, total_lessons, status, last_activity_at, completed_at
             FROM user_course_progress
             WHERE user_id = ? AND course_id = ?
             LIMIT 1'
        );
        $progressStmt->execute([(int) $authUser['id'], (int) $course['id']]);
        $row = $progressStmt->fetch();
        if ($row) {
            $progress = [
                'progressPercent' => (float) $row['progress_percent'],
                'completedLessons' => (int) $row['completed_lessons'],
                'totalLessons' => (int) $row['total_lessons'],
                'status' => $row['status'],
                'lastActivityAt' => $row['last_activity_at'],
                'completedAt' => $row['completed_at']
            ];
        }
    }

    if ($progress && (string) ($progress['status'] ?? '') === 'completed') {
        $certificate = issue_course_certificate(
            $pdo,
            (int) $authUser['id'],
            (int) $course['id'],
            [
                'issuedFrom' => 'courses.details'
            ]
        );
    } else {
        $certificate = get_user_course_certificate($pdo, (int) $authUser['id'], (int) $course['id']);
    }

    $response['userState'] = [
        'enrolled' => $enrolled,
        'wishlisted' => $wishlisted,
        'progress' => $progress,
        'certificate' => $certificate
    ];
}

json_success($response, 'Course fetched');
