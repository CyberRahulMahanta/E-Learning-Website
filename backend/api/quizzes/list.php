<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'quizzes')) {
    json_success(['quizzes' => []], 'Quizzes fetched');
}

$authUser = ensure_authenticated($pdo);
$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, slug, instructor_id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$courseId = (int) $course['id'];
$isOwner = (int) $course['instructor_id'] === (int) $authUser['id'];
$isAdmin = (string) $authUser['role'] === 'admin';

if (!$isOwner && !$isAdmin) {
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
    if (!$enrollmentStmt->fetchColumn()) {
        json_error('Enroll in this course to access quizzes', null, 403);
    }
}

$quizStmt = $pdo->prepare(
    'SELECT q.*,
            COALESCE(meta.question_count, 0) AS question_count,
            COALESCE(meta.total_marks, 0) AS total_marks
     FROM quizzes q
     LEFT JOIN (
        SELECT quiz_id, COUNT(*) AS question_count, SUM(marks) AS total_marks
        FROM quiz_questions
        GROUP BY quiz_id
     ) meta ON meta.quiz_id = q.id
     WHERE q.course_id = ? AND q.is_active = 1
     ORDER BY q.created_at DESC'
);
$quizStmt->execute([$courseId]);
$quizRows = $quizStmt->fetchAll();

$quizIds = array_map(function ($quiz) {
    return (int) $quiz['id'];
}, $quizRows);

$questionsByQuiz = [];
if (!empty($quizIds) && table_exists($pdo, 'quiz_questions')) {
    $placeholders = implode(',', array_fill(0, count($quizIds), '?'));
    $questionStmt = $pdo->prepare(
        'SELECT id, quiz_id, question_text, question_type, options, marks, sort_order
         FROM quiz_questions
         WHERE quiz_id IN (' . $placeholders . ')
         ORDER BY sort_order ASC, id ASC'
    );
    $questionStmt->execute($quizIds);

    foreach ($questionStmt->fetchAll() as $question) {
        $questionsByQuiz[(int) $question['quiz_id']][] = [
            'id' => (int) $question['id'],
            '_id' => (int) $question['id'],
            'questionText' => $question['question_text'],
            'questionType' => $question['question_type'],
            'options' => $question['options'] ? json_decode($question['options'], true) : null,
            'marks' => (float) $question['marks'],
            'sortOrder' => (int) $question['sort_order']
        ];
    }
}

$attemptMap = [];
if (!empty($quizIds) && table_exists($pdo, 'quiz_attempts')) {
    $placeholders = implode(',', array_fill(0, count($quizIds), '?'));
    $attemptSql = 'SELECT t.*
                   FROM (
                      SELECT qa.*,
                             ROW_NUMBER() OVER (PARTITION BY qa.quiz_id ORDER BY qa.created_at DESC) AS rn
                      FROM quiz_attempts qa
                      WHERE qa.user_id = ? AND qa.quiz_id IN (' . $placeholders . ')
                   ) t
                   WHERE t.rn = 1';

    // MariaDB versions without ROW_NUMBER support will fail; fallback query.
    try {
        $attemptStmt = $pdo->prepare($attemptSql);
        $attemptStmt->execute(array_merge([(int) $authUser['id']], $quizIds));
        $attemptRows = $attemptStmt->fetchAll();
    } catch (Throwable $e) {
        $attemptRows = [];
        $fallbackStmt = $pdo->prepare(
            'SELECT qa.*
             FROM quiz_attempts qa
             INNER JOIN (
                SELECT quiz_id, MAX(created_at) AS max_created
                FROM quiz_attempts
                WHERE user_id = ?
                GROUP BY quiz_id
             ) latest ON latest.quiz_id = qa.quiz_id AND latest.max_created = qa.created_at
             WHERE qa.user_id = ?'
        );
        $fallbackStmt->execute([(int) $authUser['id'], (int) $authUser['id']]);
        $attemptRows = $fallbackStmt->fetchAll();
    }

    foreach ($attemptRows as $attempt) {
        $attemptMap[(int) $attempt['quiz_id']] = [
            'attemptId' => (int) $attempt['id'],
            'score' => (float) $attempt['score'],
            'totalMarks' => (float) $attempt['total_marks'],
            'status' => $attempt['status'],
            'submittedAt' => $attempt['submitted_at'],
            'createdAt' => $attempt['created_at']
        ];
    }
}

$quizzes = array_map(function ($quiz) use ($questionsByQuiz, $attemptMap) {
    $quizId = (int) $quiz['id'];
    return [
        'id' => $quizId,
        '_id' => $quizId,
        'courseId' => (int) $quiz['course_id'],
        'moduleId' => to_int($quiz['module_id']),
        'lessonId' => to_int($quiz['lesson_id']),
        'title' => $quiz['title'],
        'description' => $quiz['description'],
        'passPercentage' => (float) $quiz['pass_percentage'],
        'timeLimitMinutes' => to_int($quiz['time_limit_minutes']),
        'questionCount' => (int) $quiz['question_count'],
        'totalMarks' => (float) $quiz['total_marks'],
        'questions' => $questionsByQuiz[$quizId] ?? [],
        'latestAttempt' => $attemptMap[$quizId] ?? null,
        'created_at' => $quiz['created_at'],
        'updated_at' => $quiz['updated_at']
    ];
}, $quizRows);

json_success([
    'courseId' => $courseId,
    'courseSlug' => $course['slug'],
    'quizzes' => $quizzes
], 'Quizzes fetched');

