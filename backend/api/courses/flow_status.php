<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, slug, instructor_id, name FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$courseId = (int) $course['id'];
$isAdmin = (string) $authUser['role'] === 'admin';
$isOwner = (int) $course['instructor_id'] === (int) $authUser['id'];

$enrolled = false;
$enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
$enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
$enrolled = (bool) $enrollmentStmt->fetchColumn();

if (!$isAdmin && !$isOwner && !$enrolled) {
    json_error('Enroll in this course to view progression flow', null, 403);
}

$completion = evaluate_course_completion_requirements($pdo, (int) $authUser['id'], $courseId);

$courseProgress = null;
if (table_exists($pdo, 'user_course_progress')) {
    $progressStmt = $pdo->prepare(
        'SELECT progress_percent, completed_lessons, total_lessons, status, last_activity_at, completed_at
         FROM user_course_progress
         WHERE user_id = ? AND course_id = ?
         LIMIT 1'
    );
    $progressStmt->execute([(int) $authUser['id'], $courseId]);
    $row = $progressStmt->fetch();
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

$certificate = null;
if (!empty($completion['eligible'])) {
    $certificate = issue_course_certificate(
        $pdo,
        (int) $authUser['id'],
        $courseId,
        ['issuedFrom' => 'courses.flow_status']
    );
} else {
    $certificate = get_user_course_certificate($pdo, (int) $authUser['id'], $courseId);
}

$lessonStep = $completion['steps']['lessons'] ?? ['required' => 0, 'completed' => 0, 'passed' => false];
$quizStep = $completion['steps']['moduleQuizzes'] ?? ['required' => 0, 'completed' => 0, 'passed' => false];
$assignmentStep = $completion['steps']['assignments'] ?? ['required' => 0, 'completed' => 0, 'passed' => false];
$finalStep = $completion['steps']['finalAssessment'] ?? ['required' => 0, 'completed' => 0, 'passed' => false];

$flow = [
    [
        'key' => 'browse',
        'label' => 'Browse Courses',
        'passed' => true,
        'required' => 1,
        'completed' => 1
    ],
    [
        'key' => 'enroll',
        'label' => 'Enroll in Course',
        'passed' => $enrolled || $isAdmin || $isOwner,
        'required' => 1,
        'completed' => ($enrolled || $isAdmin || $isOwner) ? 1 : 0
    ],
    [
        'key' => 'lessons',
        'label' => 'Watch Lessons (Videos/Notes)',
        'passed' => (bool) $lessonStep['passed'],
        'required' => (int) $lessonStep['required'],
        'completed' => (int) $lessonStep['completed']
    ],
    [
        'key' => 'moduleQuizzes',
        'label' => 'Take Quiz (after each module)',
        'passed' => (bool) $quizStep['passed'],
        'required' => (int) $quizStep['required'],
        'completed' => (int) $quizStep['completed']
    ],
    [
        'key' => 'assignments',
        'label' => 'Submit Assignment',
        'passed' => (bool) $assignmentStep['passed'],
        'required' => (int) $assignmentStep['required'],
        'completed' => (int) $assignmentStep['completed']
    ],
    [
        'key' => 'progress',
        'label' => 'Track Progress',
        'passed' => (float) ($courseProgress['progressPercent'] ?? 0) > 0,
        'required' => 100,
        'completed' => (float) ($courseProgress['progressPercent'] ?? 0)
    ],
    [
        'key' => 'finalAssessment',
        'label' => 'Final Assessment',
        'passed' => (bool) $finalStep['passed'],
        'required' => (int) $finalStep['required'],
        'completed' => (int) $finalStep['completed']
    ],
    [
        'key' => 'certificate',
        'label' => 'Generate Certificate',
        'passed' => (bool) $certificate,
        'required' => 1,
        'completed' => $certificate ? 1 : 0
    ]
];

json_success([
    'courseId' => $courseId,
    'courseSlug' => $course['slug'],
    'courseName' => $course['name'],
    'flow' => $flow,
    'completion' => $completion,
    'courseProgress' => $courseProgress,
    'certificate' => $certificate
], 'Course flow status fetched');
