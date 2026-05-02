<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
$role = (string) $authUser['role'];

function scalar_query($pdo, $sql, $params = [], $default = 0) {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $value = $stmt->fetchColumn();
        if ($value === false || $value === null) {
            return $default;
        }
        return $value;
    } catch (Throwable $e) {
        return $default;
    }
}

if ($role === 'admin') {
    $usersByRole = [];
    try {
        $userCountStmt = $pdo->query('SELECT role, COUNT(*) AS total FROM users GROUP BY role');
        foreach (($userCountStmt ? $userCountStmt->fetchAll() : []) as $row) {
            $usersByRole[$row['role']] = (int) $row['total'];
        }
    } catch (Throwable $e) {
        $usersByRole = [];
    }

    $courseCount = (int) scalar_query($pdo, 'SELECT COUNT(*) FROM courses', [], 0);
    $enrollmentCount = table_exists($pdo, 'enrollments')
        ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM enrollments', [], 0)
        : 0;

    $paidRevenue = table_exists($pdo, 'payment_orders')
        ? (float) scalar_query($pdo, 'SELECT COALESCE(SUM(final_amount), 0) FROM payment_orders WHERE status = "paid"', [], 0)
        : 0.0;

    $avgRating = 0.0;
    $reviewCount = 0;
    if (table_exists($pdo, 'course_reviews')) {
        try {
            $reviewStmt = $pdo->query('SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total FROM course_reviews WHERE is_published = 1');
            $review = $reviewStmt ? $reviewStmt->fetch() : null;
            $avgRating = (float) ($review['avg_rating'] ?? 0);
            $reviewCount = (int) ($review['total'] ?? 0);
        } catch (Throwable $e) {
            $avgRating = 0.0;
            $reviewCount = 0;
        }
    }

    $quizCount = table_exists($pdo, 'quizzes')
        ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM quizzes WHERE is_active = 1', [], 0)
        : 0;
    $assignmentCount = table_exists($pdo, 'assignments')
        ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM assignments WHERE is_active = 1', [], 0)
        : 0;
    $certificateCount = table_exists($pdo, 'certificates')
        ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM certificates', [], 0)
        : 0;

    $completionRate = 0.0;
    if (table_exists($pdo, 'user_course_progress')) {
        $totalProgressRows = (int) scalar_query($pdo, 'SELECT COUNT(*) FROM user_course_progress', [], 0);
        $completedRows = (int) scalar_query($pdo, 'SELECT COUNT(*) FROM user_course_progress WHERE status = "completed"', [], 0);
        $completionRate = $totalProgressRows > 0 ? round(($completedRows / $totalProgressRows) * 100, 2) : 0.0;
    }

    $pendingAssignmentReviews = table_exists($pdo, 'assignment_submissions')
        ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM assignment_submissions WHERE status = "submitted"', [], 0)
        : 0;

    $topCourses = [];
    try {
        $topCourseSql = '
            SELECT c.id, c.slug, c.name,
                   COALESCE(en.enrollments, 0) AS enrollments,
                   COALESCE(pg.avg_progress, 0) AS avg_progress,
                   COALESCE(pg.completion_rate, 0) AS completion_rate
            FROM courses c
        ';

        if (table_exists($pdo, 'enrollments')) {
            $topCourseSql .= '
                LEFT JOIN (
                    SELECT course_id, COUNT(*) AS enrollments
                    FROM enrollments
                    GROUP BY course_id
                ) en ON en.course_id = c.id
            ';
        } else {
            $topCourseSql .= ' LEFT JOIN (SELECT 0 AS enrollments, NULL AS course_id) en ON en.course_id = c.id ';
        }

        if (table_exists($pdo, 'user_course_progress')) {
            $topCourseSql .= '
                LEFT JOIN (
                    SELECT course_id,
                           AVG(progress_percent) AS avg_progress,
                           AVG(CASE WHEN status = "completed" THEN 100 ELSE 0 END) AS completion_rate
                    FROM user_course_progress
                    GROUP BY course_id
                ) pg ON pg.course_id = c.id
            ';
        } else {
            $topCourseSql .= ' LEFT JOIN (SELECT 0 AS avg_progress, 0 AS completion_rate, NULL AS course_id) pg ON pg.course_id = c.id ';
        }

        $topCourseSql .= ' ORDER BY enrollments DESC, c.created_at DESC LIMIT 8';

        $topCoursesStmt = $pdo->query($topCourseSql);
        $topCourses = array_map(function ($row) {
            return [
                'id' => (int) $row['id'],
                'slug' => $row['slug'],
                'name' => $row['name'],
                'enrollments' => (int) $row['enrollments'],
                'avgProgress' => round((float) $row['avg_progress'], 2),
                'completionRate' => round((float) $row['completion_rate'], 2)
            ];
        }, $topCoursesStmt ? $topCoursesStmt->fetchAll() : []);
    } catch (Throwable $e) {
        $topCourses = [];
    }

    $monthlyEnrollments = [];
    if (table_exists($pdo, 'enrollments')) {
        $enrollTimeColumn = null;
        if (column_exists($pdo, 'enrollments', 'enrolled_at')) {
            $enrollTimeColumn = 'enrolled_at';
        } elseif (column_exists($pdo, 'enrollments', 'created_at')) {
            $enrollTimeColumn = 'created_at';
        }

        if ($enrollTimeColumn) {
            try {
                $monthlyStmt = $pdo->query(
                    'SELECT DATE_FORMAT(' . $enrollTimeColumn . ', "%Y-%m") AS month_key, COUNT(*) AS total
                     FROM enrollments
                     WHERE ' . $enrollTimeColumn . ' >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                     GROUP BY month_key
                     ORDER BY month_key ASC'
                );
                $monthlyEnrollments = array_map(function ($row) {
                    return [
                        'month' => $row['month_key'],
                        'count' => (int) $row['total']
                    ];
                }, $monthlyStmt ? $monthlyStmt->fetchAll() : []);
            } catch (Throwable $e) {
                $monthlyEnrollments = [];
            }
        }
    }

    json_success([
        'scope' => 'admin',
        'stats' => [
            'usersByRole' => $usersByRole,
            'courseCount' => $courseCount,
            'enrollmentCount' => $enrollmentCount,
            'paidRevenue' => round($paidRevenue, 2),
            'avgRating' => round($avgRating, 2),
            'reviewCount' => $reviewCount,
            'quizCount' => $quizCount,
            'assignmentCount' => $assignmentCount,
            'certificateCount' => $certificateCount,
            'completionRate' => $completionRate,
            'pendingAssignmentReviews' => $pendingAssignmentReviews
        ],
        'topCourses' => $topCourses,
        'monthlyEnrollments' => $monthlyEnrollments
    ], 'Admin analytics fetched');
}

if ($role === 'instructor') {
    $instructorId = (int) $authUser['id'];

    $courseCount = (int) scalar_query($pdo, 'SELECT COUNT(*) FROM courses WHERE instructor_id = ?', [$instructorId], 0);

    $enrollmentCount = 0;
    if (table_exists($pdo, 'enrollments')) {
        $enrollmentCount = (int) scalar_query(
            $pdo,
            'SELECT COUNT(*)
             FROM enrollments e
             JOIN courses c ON c.id = e.course_id
             WHERE c.instructor_id = ?',
            [$instructorId],
            0
        );
    }

    $avgRating = 0.0;
    if (table_exists($pdo, 'course_reviews')) {
        $avgRating = (float) scalar_query(
            $pdo,
            'SELECT COALESCE(AVG(r.rating), 0)
             FROM course_reviews r
             JOIN courses c ON c.id = r.course_id
             WHERE c.instructor_id = ? AND r.is_published = 1',
            [$instructorId],
            0
        );
    }

    $inProgress = 0;
    $completionRate = 0.0;
    if (table_exists($pdo, 'user_course_progress')) {
        $inProgress = (int) scalar_query(
            $pdo,
            'SELECT COUNT(*)
             FROM user_course_progress p
             JOIN courses c ON c.id = p.course_id
             WHERE c.instructor_id = ? AND p.status = "in_progress"',
            [$instructorId],
            0
        );

        try {
            $completionStmt = $pdo->prepare(
                'SELECT COUNT(*) AS total_rows,
                        SUM(CASE WHEN p.status = "completed" THEN 1 ELSE 0 END) AS completed_rows
                 FROM user_course_progress p
                 JOIN courses c ON c.id = p.course_id
                 WHERE c.instructor_id = ?'
            );
            $completionStmt->execute([$instructorId]);
            $completionRow = $completionStmt->fetch();
            $totalRows = (int) ($completionRow['total_rows'] ?? 0);
            $completedRows = (int) ($completionRow['completed_rows'] ?? 0);
            $completionRate = $totalRows > 0 ? round(($completedRows / $totalRows) * 100, 2) : 0.0;
        } catch (Throwable $e) {
            $completionRate = 0.0;
        }
    }

    $pendingAssignmentReviews = 0;
    if (table_exists($pdo, 'assignment_submissions') && table_exists($pdo, 'assignments')) {
        $pendingAssignmentReviews = (int) scalar_query(
            $pdo,
            'SELECT COUNT(*)
             FROM assignment_submissions s
             JOIN assignments a ON a.id = s.assignment_id
             JOIN courses c ON c.id = a.course_id
             WHERE c.instructor_id = ? AND s.status = "submitted"',
            [$instructorId],
            0
        );
    }

    $certificateCount = 0;
    if (table_exists($pdo, 'certificates')) {
        $certificateCount = (int) scalar_query(
            $pdo,
            'SELECT COUNT(*)
             FROM certificates cert
             JOIN courses c ON c.id = cert.course_id
             WHERE c.instructor_id = ?',
            [$instructorId],
            0
        );
    }

    $coursePerformance = [];
    try {
        $coursePerfSql = '
            SELECT c.id, c.slug, c.name,
                   COALESCE(en.total_enrollments, 0) AS enrollments,
                   COALESCE(pg.avg_progress, 0) AS avg_progress,
                   COALESCE(pg.completed_count, 0) AS completed_count
            FROM courses c
        ';

        if (table_exists($pdo, 'enrollments')) {
            $coursePerfSql .= '
                LEFT JOIN (
                    SELECT course_id, COUNT(*) AS total_enrollments
                    FROM enrollments
                    GROUP BY course_id
                ) en ON en.course_id = c.id
            ';
        } else {
            $coursePerfSql .= ' LEFT JOIN (SELECT 0 AS total_enrollments, NULL AS course_id) en ON en.course_id = c.id ';
        }

        if (table_exists($pdo, 'user_course_progress')) {
            $coursePerfSql .= '
                LEFT JOIN (
                    SELECT course_id,
                           AVG(progress_percent) AS avg_progress,
                           SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) AS completed_count
                    FROM user_course_progress
                    GROUP BY course_id
                ) pg ON pg.course_id = c.id
            ';
        } else {
            $coursePerfSql .= ' LEFT JOIN (SELECT 0 AS avg_progress, 0 AS completed_count, NULL AS course_id) pg ON pg.course_id = c.id ';
        }

        $coursePerfSql .= '
            WHERE c.instructor_id = ?
            ORDER BY enrollments DESC, c.created_at DESC
            LIMIT 10
        ';

        $coursePerfStmt = $pdo->prepare($coursePerfSql);
        $coursePerfStmt->execute([$instructorId]);
        $coursePerformance = array_map(function ($row) {
            return [
                'id' => (int) $row['id'],
                'slug' => $row['slug'],
                'name' => $row['name'],
                'enrollments' => (int) $row['enrollments'],
                'avgProgress' => round((float) $row['avg_progress'], 2),
                'completedCount' => (int) $row['completed_count']
            ];
        }, $coursePerfStmt->fetchAll());
    } catch (Throwable $e) {
        $coursePerformance = [];
    }

    json_success([
        'scope' => 'instructor',
        'stats' => [
            'courseCount' => $courseCount,
            'enrollmentCount' => $enrollmentCount,
            'avgRating' => round($avgRating, 2),
            'activeLearners' => $inProgress,
            'completionRate' => $completionRate,
            'pendingAssignmentReviews' => $pendingAssignmentReviews,
            'certificateCount' => $certificateCount
        ],
        'coursePerformance' => $coursePerformance
    ], 'Instructor analytics fetched');
}

$studentId = (int) $authUser['id'];
$enrollmentCount = table_exists($pdo, 'enrollments')
    ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM enrollments WHERE user_id = ?', [$studentId], 0)
    : 0;

$completedCourses = 0;
$overallProgress = 0.0;
if (table_exists($pdo, 'user_course_progress')) {
    $completedCourses = (int) scalar_query(
        $pdo,
        'SELECT COUNT(*) FROM user_course_progress WHERE user_id = ? AND status = "completed"',
        [$studentId],
        0
    );
    $overallProgress = (float) scalar_query(
        $pdo,
        'SELECT COALESCE(AVG(progress_percent), 0) FROM user_course_progress WHERE user_id = ?',
        [$studentId],
        0
    );
}

$orderCount = table_exists($pdo, 'payment_orders')
    ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM payment_orders WHERE user_id = ?', [$studentId], 0)
    : 0;

$certificateCount = table_exists($pdo, 'certificates')
    ? (int) scalar_query($pdo, 'SELECT COUNT(*) FROM certificates WHERE user_id = ?', [$studentId], 0)
    : 0;

json_success([
    'scope' => 'student',
    'stats' => [
        'enrollmentCount' => $enrollmentCount,
        'completedCourses' => $completedCourses,
        'overallProgress' => round($overallProgress, 2),
        'orderCount' => $orderCount,
        'certificateCount' => $certificateCount
    ]
], 'Student analytics fetched');
