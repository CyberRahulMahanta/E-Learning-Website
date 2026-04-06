<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'quizzes') || !table_exists($pdo, 'quiz_questions') || !table_exists($pdo, 'quiz_attempts')) {
    json_error('Quiz feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'quiz.attempt');

$quizId = to_int($_GET['id'] ?? null);
if (!$quizId || $quizId <= 0) {
    json_error('Valid quiz id required', null, 422);
}

$quizStmt = $pdo->prepare('SELECT * FROM quizzes WHERE id = ? AND is_active = 1 LIMIT 1');
$quizStmt->execute([$quizId]);
$quiz = $quizStmt->fetch();
if (!$quiz) {
    json_error('Quiz not found', null, 404);
}

$courseId = (int) $quiz['course_id'];
$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin) {
    $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
    if (!$enrollmentStmt->fetchColumn()) {
        json_error('Enroll in this course to attempt quiz', null, 403);
    }
}

$data = get_input_data();
$answers = $data['answers'] ?? [];
if (!is_array($answers)) {
    json_error('Answers must be an object keyed by question id', null, 422);
}

$questionStmt = $pdo->prepare(
    'SELECT id, question_text, question_type, options, correct_answer, marks
     FROM quiz_questions
     WHERE quiz_id = ?
     ORDER BY sort_order ASC, id ASC'
);
$questionStmt->execute([$quizId]);
$questions = $questionStmt->fetchAll();
if (empty($questions)) {
    json_error('Quiz has no questions configured', null, 422);
}

$score = 0.0;
$totalMarks = 0.0;
$breakdown = [];

foreach ($questions as $question) {
    $questionId = (int) $question['id'];
    $marks = (float) $question['marks'];
    $totalMarks += $marks;

    $providedAnswer = null;
    if (array_key_exists((string) $questionId, $answers)) {
        $providedAnswer = $answers[(string) $questionId];
    } elseif (array_key_exists($questionId, $answers)) {
        $providedAnswer = $answers[$questionId];
    }

    $correctAnswer = json_decode($question['correct_answer'], true);
    $isCorrect = false;

    if ($question['question_type'] === 'multiple') {
        $given = is_array($providedAnswer) ? $providedAnswer : [];
        $expected = is_array($correctAnswer) ? $correctAnswer : [];
        sort($given);
        sort($expected);
        $isCorrect = $given === $expected;
    } else {
        $givenString = trim(strtolower((string) (is_array($providedAnswer) ? json_encode($providedAnswer) : $providedAnswer)));
        $expectedString = trim(strtolower((string) (is_array($correctAnswer) ? json_encode($correctAnswer) : $correctAnswer)));
        $isCorrect = ($givenString !== '' && $givenString === $expectedString);
    }

    if ($isCorrect) {
        $score += $marks;
    }

    $breakdown[] = [
        'questionId' => $questionId,
        'questionText' => $question['question_text'],
        'isCorrect' => $isCorrect,
        'marks' => $marks,
        'awarded' => $isCorrect ? $marks : 0.0
    ];
}

$passPercentage = (float) $quiz['pass_percentage'];
$achievedPercentage = $totalMarks > 0 ? round(($score / $totalMarks) * 100, 2) : 0.0;
$passed = $achievedPercentage >= $passPercentage;

$attemptStmt = $pdo->prepare(
    'INSERT INTO quiz_attempts
     (quiz_id, user_id, score, total_marks, status, answers, started_at, submitted_at)
     VALUES (?, ?, ?, ?, "evaluated", ?, NOW(), NOW())'
);
$attemptStmt->execute([
    $quizId,
    (int) $authUser['id'],
    $score,
    $totalMarks,
    json_encode($answers, JSON_UNESCAPED_SLASHES)
]);
$attemptId = (int) $pdo->lastInsertId();

json_success([
    'attempt' => [
        'id' => $attemptId,
        '_id' => $attemptId,
        'quizId' => $quizId,
        'score' => round($score, 2),
        'totalMarks' => round($totalMarks, 2),
        'percentage' => $achievedPercentage,
        'passPercentage' => $passPercentage,
        'passed' => $passed,
        'breakdown' => $breakdown
    ]
], 'Quiz submitted');

