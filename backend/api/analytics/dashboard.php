<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
$role = (string) $authUser['role'];

if ($role === 'admin') {
    $userCountStmt = $pdo->query('SELECT role, COUNT(*) AS total FROM users GROUP BY role');
    $usersByRole = [];
    foreach ($userCountStmt->fetchAll() as $row) {
        $usersByRole[$row['role']] = (int) $row['total'];
    }

    $courseCount = (int) $pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn();
    $enrollmentCount = (int) $pdo->query('SELECT COUNT(*) FROM enrollments')->fetchColumn();

    $paidRevenue = 0.0;
    if (table_exists($pdo, 'payment_orders')) {
        $paidRevenue = (float) $pdo->query('SELECT COALESCE(SUM(final_amount), 0) FROM payment_orders WHERE status = "paid"')->fetchColumn();
    }

    $avgRating = 0.0;
    $reviewCount = 0;
    if (table_exists($pdo, 'course_reviews')) {
        $reviewStmt = $pdo->query('SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total FROM course_reviews WHERE is_published = 1');
        $review = $reviewStmt->fetch();
        $avgRating = (float) $review['avg_rating'];
        $reviewCount = (int) $review['total'];
    }

    json_success([
        'scope' => 'admin',
        'stats' => [
            'usersByRole' => $usersByRole,
            'courseCount' => $courseCount,
            'enrollmentCount' => $enrollmentCount,
            'paidRevenue' => round($paidRevenue, 2),
            'avgRating' => round($avgRating, 2),
            'reviewCount' => $reviewCount
        ]
    ], 'Admin analytics fetched');
}

if ($role === 'instructor') {
    $instructorId = (int) $authUser['id'];

    $courseCountStmt = $pdo->prepare('SELECT COUNT(*) FROM courses WHERE instructor_id = ?');
    $courseCountStmt->execute([$instructorId]);
    $courseCount = (int) $courseCountStmt->fetchColumn();

    $enrollmentStmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE c.instructor_id = ?'
    );
    $enrollmentStmt->execute([$instructorId]);
    $enrollmentCount = (int) $enrollmentStmt->fetchColumn();

    $avgRating = 0.0;
    if (table_exists($pdo, 'course_reviews')) {
        $ratingStmt = $pdo->prepare(
            'SELECT COALESCE(AVG(r.rating), 0)
             FROM course_reviews r
             JOIN courses c ON c.id = r.course_id
             WHERE c.instructor_id = ? AND r.is_published = 1'
        );
        $ratingStmt->execute([$instructorId]);
        $avgRating = (float) $ratingStmt->fetchColumn();
    }

    $inProgress = 0;
    if (table_exists($pdo, 'user_course_progress')) {
        $progressStmt = $pdo->prepare(
            'SELECT COUNT(*)
             FROM user_course_progress p
             JOIN courses c ON c.id = p.course_id
             WHERE c.instructor_id = ? AND p.status = "in_progress"'
        );
        $progressStmt->execute([$instructorId]);
        $inProgress = (int) $progressStmt->fetchColumn();
    }

    json_success([
        'scope' => 'instructor',
        'stats' => [
            'courseCount' => $courseCount,
            'enrollmentCount' => $enrollmentCount,
            'avgRating' => round($avgRating, 2),
            'activeLearners' => $inProgress
        ]
    ], 'Instructor analytics fetched');
}

$studentId = (int) $authUser['id'];
$enrollmentCountStmt = $pdo->prepare('SELECT COUNT(*) FROM enrollments WHERE user_id = ?');
$enrollmentCountStmt->execute([$studentId]);
$enrollmentCount = (int) $enrollmentCountStmt->fetchColumn();

$completedCourses = 0;
$overallProgress = 0.0;
if (table_exists($pdo, 'user_course_progress')) {
    $completedStmt = $pdo->prepare('SELECT COUNT(*) FROM user_course_progress WHERE user_id = ? AND status = "completed"');
    $completedStmt->execute([$studentId]);
    $completedCourses = (int) $completedStmt->fetchColumn();

    $progressStmt = $pdo->prepare('SELECT COALESCE(AVG(progress_percent), 0) FROM user_course_progress WHERE user_id = ?');
    $progressStmt->execute([$studentId]);
    $overallProgress = (float) $progressStmt->fetchColumn();
}

$orderCount = 0;
if (table_exists($pdo, 'payment_orders')) {
    $orderStmt = $pdo->prepare('SELECT COUNT(*) FROM payment_orders WHERE user_id = ?');
    $orderStmt->execute([$studentId]);
    $orderCount = (int) $orderStmt->fetchColumn();
}

json_success([
    'scope' => 'student',
    'stats' => [
        'enrollmentCount' => $enrollmentCount,
        'completedCourses' => $completedCourses,
        'overallProgress' => round($overallProgress, 2),
        'orderCount' => $orderCount
    ]
], 'Student analytics fetched');

