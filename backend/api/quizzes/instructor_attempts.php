<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'quizzes') || !table_exists($pdo, 'quiz_questions') || !table_exists($pdo, 'quiz_attempts')) {
    json_error('Quiz feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'quiz.manage.own');

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, slug, name, instructor_id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$courseId = (int) $course['id'];
$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && (int) $course['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden: you can only check quizzes for your own course', null, 403);
}

$quizFilterId = to_int($_GET['quizId'] ?? null);

$quizSql = 'SELECT id, title, description, pass_percentage, time_limit_minutes, created_at
            FROM quizzes
            WHERE course_id = ? AND is_active = 1';
$quizParams = [$courseId];
if ($quizFilterId && $quizFilterId > 0) {
    $quizSql .= ' AND id = ?';
    $quizParams[] = $quizFilterId;
}
$quizSql .= ' ORDER BY created_at DESC';

$quizStmt = $pdo->prepare($quizSql);
$quizStmt->execute($quizParams);
$quizRows = $quizStmt->fetchAll();

if (empty($quizRows)) {
    json_success([
        'course' => [
            'id' => $courseId,
            'slug' => $course['slug'],
            'name' => $course['name']
        ],
        'quizzes' => []
    ], 'Quiz attempts fetched');
}

$quizIds = array_map(function ($quiz) {
    return (int) $quiz['id'];
}, $quizRows);

$questionsByQuiz = [];
$questionMetaByQuiz = [];
$placeholders = implode(',', array_fill(0, count($quizIds), '?'));
$questionStmt = $pdo->prepare(
    'SELECT id, quiz_id, question_text, question_type, correct_answer, marks, sort_order
     FROM quiz_questions
     WHERE quiz_id IN (' . $placeholders . ')
     ORDER BY sort_order ASC, id ASC'
);
$questionStmt->execute($quizIds);

foreach ($questionStmt->fetchAll() as $question) {
    $quizId = (int) $question['quiz_id'];
    $questionId = (int) $question['id'];
    $marks = (float) $question['marks'];

    $questionsByQuiz[$quizId][] = [
        'id' => $questionId,
        '_id' => $questionId,
        'questionText' => $question['question_text'],
        'questionType' => $question['question_type'],
        'marks' => $marks,
        'sortOrder' => (int) $question['sort_order']
    ];

    $questionMetaByQuiz[$quizId][$questionId] = [
        'questionText' => $question['question_text'],
        'questionType' => $question['question_type'],
        'correctAnswer' => json_decode($question['correct_answer'], true),
        'marks' => $marks
    ];
}

$attemptStmt = $pdo->prepare(
    'SELECT qa.id, qa.quiz_id, qa.user_id, qa.score, qa.total_marks, qa.status, qa.answers, qa.submitted_at, qa.created_at,
            u.username, u.email
     FROM quiz_attempts qa
     JOIN users u ON u.id = qa.user_id
     WHERE qa.quiz_id IN (' . $placeholders . ')
     ORDER BY qa.submitted_at DESC, qa.created_at DESC, qa.id DESC'
);
$attemptStmt->execute($quizIds);
$attemptRows = $attemptStmt->fetchAll();

$attemptsByQuiz = [];
foreach ($attemptRows as $attempt) {
    $quizId = (int) $attempt['quiz_id'];
    $answers = json_decode($attempt['answers'] ?? '[]', true);
    if (!is_array($answers)) {
        $answers = [];
    }

    $breakdown = [];
    $questionMeta = $questionMetaByQuiz[$quizId] ?? [];
    foreach ($questionMeta as $questionId => $meta) {
        $providedAnswer = null;
        if (array_key_exists((string) $questionId, $answers)) {
            $providedAnswer = $answers[(string) $questionId];
        } elseif (array_key_exists($questionId, $answers)) {
            $providedAnswer = $answers[$questionId];
        }

        $correctAnswer = $meta['correctAnswer'];
        $isCorrect = false;

        if ($meta['questionType'] === 'multiple') {
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

        $breakdown[] = [
            'questionId' => (int) $questionId,
            'questionText' => $meta['questionText'],
            'providedAnswer' => $providedAnswer,
            'correctAnswer' => $correctAnswer,
            'isCorrect' => $isCorrect,
            'marks' => (float) $meta['marks'],
            'awarded' => $isCorrect ? (float) $meta['marks'] : 0.0
        ];
    }

    $attemptsByQuiz[$quizId][] = [
        'id' => (int) $attempt['id'],
        '_id' => (int) $attempt['id'],
        'user' => [
            'id' => (int) $attempt['user_id'],
            '_id' => (int) $attempt['user_id'],
            'username' => $attempt['username'],
            'email' => $attempt['email']
        ],
        'score' => (float) $attempt['score'],
        'totalMarks' => (float) $attempt['total_marks'],
        'percentage' => (float) ($attempt['total_marks'] > 0 ? round(((float) $attempt['score'] / (float) $attempt['total_marks']) * 100, 2) : 0),
        'status' => $attempt['status'],
        'submittedAt' => $attempt['submitted_at'],
        'createdAt' => $attempt['created_at'],
        'answers' => $answers,
        'breakdown' => $breakdown
    ];
}

$quizzes = [];
foreach ($quizRows as $quiz) {
    $quizId = (int) $quiz['id'];
    $attempts = $attemptsByQuiz[$quizId] ?? [];
    $passPercentage = (float) $quiz['pass_percentage'];
    $passCount = 0;
    $scoreSum = 0.0;

    foreach ($attempts as $attempt) {
        $scoreSum += (float) $attempt['score'];
        if ((float) $attempt['percentage'] >= $passPercentage) {
            $passCount++;
        }
    }

    $attemptCount = count($attempts);
    $avgScore = $attemptCount > 0 ? round($scoreSum / $attemptCount, 2) : 0.0;
    $passRate = $attemptCount > 0 ? round(($passCount / $attemptCount) * 100, 2) : 0.0;

    $quizzes[] = [
        'id' => $quizId,
        '_id' => $quizId,
        'title' => $quiz['title'],
        'description' => $quiz['description'],
        'passPercentage' => $passPercentage,
        'timeLimitMinutes' => to_int($quiz['time_limit_minutes']),
        'questions' => $questionsByQuiz[$quizId] ?? [],
        'stats' => [
            'attemptCount' => $attemptCount,
            'avgScore' => $avgScore,
            'passCount' => $passCount,
            'passRate' => $passRate
        ],
        'attempts' => $attempts,
        'created_at' => $quiz['created_at']
    ];
}

json_success([
    'course' => [
        'id' => $courseId,
        'slug' => $course['slug'],
        'name' => $course['name']
    ],
    'quizzes' => $quizzes
], 'Quiz attempts fetched');
