<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH', 'POST'], true)) {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'quizzes') || !table_exists($pdo, 'quiz_questions')) {
    json_error('Quiz feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'quiz.manage.own');

$quizId = to_int($_GET['id'] ?? null);
if (!$quizId || $quizId <= 0) {
    json_error('Valid quiz id required', null, 422);
}

$quizStmt = $pdo->prepare('SELECT * FROM quizzes WHERE id = ? LIMIT 1');
$quizStmt->execute([$quizId]);
$quiz = $quizStmt->fetch();
if (!$quiz) {
    json_error('Quiz not found', null, 404);
}

$courseId = (int) $quiz['course_id'];
$courseStmt = $pdo->prepare('SELECT id, slug, instructor_id FROM courses WHERE id = ? LIMIT 1');
$courseStmt->execute([$courseId]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && (int) $course['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden: you can only edit quiz for your own course', null, 403);
}

$data = get_input_data();
$fields = [];
$params = [];

if (isset($data['title'])) {
    $title = sanitize($data['title']);
    if ($title === '') {
        json_error('Quiz title cannot be empty', null, 422);
    }
    $fields[] = 'title = ?';
    $params[] = $title;
}

if (array_key_exists('description', $data)) {
    $description = trim((string) $data['description']);
    $fields[] = 'description = ?';
    $params[] = $description !== '' ? $description : null;
}

if (isset($data['passPercentage']) || isset($data['pass_percentage'])) {
    $passPercentage = isset($data['passPercentage']) ? (float) $data['passPercentage'] : (float) $data['pass_percentage'];
    if ($passPercentage < 0 || $passPercentage > 100) {
        json_error('Pass percentage must be between 0 and 100', null, 422);
    }
    $fields[] = 'pass_percentage = ?';
    $params[] = $passPercentage;
}

if (isset($data['timeLimitMinutes']) || isset($data['time_limit_minutes'])) {
    $timeLimitMinutes = to_int($data['timeLimitMinutes'] ?? $data['time_limit_minutes']);
    if ($timeLimitMinutes !== null && $timeLimitMinutes <= 0) {
        json_error('Time limit must be greater than zero', null, 422);
    }
    $fields[] = 'time_limit_minutes = ?';
    $params[] = $timeLimitMinutes;
}

if (isset($data['isActive']) || isset($data['is_active'])) {
    $isActive = to_bool($data['isActive'] ?? $data['is_active'], true);
    $fields[] = 'is_active = ?';
    $params[] = $isActive ? 1 : 0;
}

$moduleIdInput = null;
$lessonIdInput = null;
if (isset($data['moduleId']) || isset($data['module_id'])) {
    $moduleIdInput = to_int($data['moduleId'] ?? $data['module_id']);
}
if (isset($data['lessonId']) || isset($data['lesson_id'])) {
    $lessonIdInput = to_int($data['lessonId'] ?? $data['lesson_id']);
}

$hasFinalAssessmentColumn = column_exists($pdo, 'quizzes', 'is_final_assessment');
$isFinalAssessmentInput = null;
if ($hasFinalAssessmentColumn && (isset($data['isFinalAssessment']) || isset($data['is_final_assessment']))) {
    $isFinalAssessmentInput = to_bool($data['isFinalAssessment'] ?? $data['is_final_assessment'], false);
    $fields[] = 'is_final_assessment = ?';
    $params[] = $isFinalAssessmentInput ? 1 : 0;
}

if ($isFinalAssessmentInput === true) {
    $moduleIdInput = null;
    $lessonIdInput = null;
}

if ($moduleIdInput !== null || array_key_exists('moduleId', $data) || array_key_exists('module_id', $data)) {
    $fields[] = 'module_id = ?';
    $params[] = $moduleIdInput;
}
if ($lessonIdInput !== null || array_key_exists('lessonId', $data) || array_key_exists('lesson_id', $data)) {
    $fields[] = 'lesson_id = ?';
    $params[] = $lessonIdInput;
}

$questionsProvided = array_key_exists('questions', $data);
$normalizedQuestions = [];
if ($questionsProvided) {
    $questions = $data['questions'];
    if (!is_array($questions) || count($questions) === 0) {
        json_error('At least one question is required', null, 422);
    }

    foreach ($questions as $index => $question) {
        if (!is_array($question)) {
            json_error('Invalid question payload at index ' . $index, null, 422);
        }

        $questionText = trim((string) ($question['questionText'] ?? $question['question_text'] ?? ''));
        $questionType = sanitize($question['questionType'] ?? $question['question_type'] ?? 'single');
        $marks = isset($question['marks']) ? (float) $question['marks'] : 1.0;
        $sortOrder = isset($question['sortOrder']) ? (int) $question['sortOrder'] : ($index + 1);
        $options = $question['options'] ?? null;
        $correctAnswer = $question['correctAnswer'] ?? $question['correct_answer'] ?? null;

        if ($questionText === '') {
            json_error('Question text is required at index ' . $index, null, 422);
        }
        if (!in_array($questionType, ['single', 'multiple', 'text'], true)) {
            json_error('Invalid question type at index ' . $index, null, 422);
        }
        if ($marks <= 0) {
            json_error('Marks must be greater than zero at index ' . $index, null, 422);
        }

        $normalizedOptions = null;
        if ($questionType !== 'text') {
            if (!is_array($options) || count($options) < 2) {
                json_error('At least 2 options required at index ' . $index, null, 422);
            }
            $normalizedOptions = array_values(array_filter(array_map(function ($value) {
                return trim((string) $value);
            }, $options), function ($value) {
                return $value !== '';
            }));
            if (count($normalizedOptions) < 2) {
                json_error('At least 2 valid options required at index ' . $index, null, 422);
            }
        }

        if ($questionType === 'multiple') {
            if (!is_array($correctAnswer) || count($correctAnswer) === 0) {
                json_error('Correct answer array required at index ' . $index, null, 422);
            }
            $correctAnswer = array_values(array_filter(array_map(function ($value) {
                return trim((string) $value);
            }, $correctAnswer), function ($value) {
                return $value !== '';
            }));
            if (count($correctAnswer) === 0) {
                json_error('Correct answers cannot be empty at index ' . $index, null, 422);
            }
            foreach ($correctAnswer as $answerItem) {
                if ($normalizedOptions !== null && !in_array($answerItem, $normalizedOptions, true)) {
                    json_error('Correct answer "' . $answerItem . '" not found in options at index ' . $index, null, 422);
                }
            }
        } else {
            if (is_array($correctAnswer)) {
                json_error('Correct answer must be a single value at index ' . $index, null, 422);
            }
            $correctAnswer = trim((string) $correctAnswer);
            if ($correctAnswer === '') {
                json_error('Correct answer is required at index ' . $index, null, 422);
            }
            if ($normalizedOptions !== null && !in_array($correctAnswer, $normalizedOptions, true)) {
                json_error('Correct answer not found in options at index ' . $index, null, 422);
            }
        }

        $normalizedQuestions[] = [
            'questionText' => $questionText,
            'questionType' => $questionType,
            'options' => $normalizedOptions,
            'correctAnswer' => $correctAnswer,
            'marks' => $marks,
            'sortOrder' => $sortOrder
        ];
    }
}

if (empty($fields) && !$questionsProvided) {
    json_error('No valid fields provided', null, 422);
}

try {
    $pdo->beginTransaction();

    if (!empty($fields)) {
        $params[] = $quizId;
        $updateStmt = $pdo->prepare('UPDATE quizzes SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $updateStmt->execute($params);
    }

    if ($questionsProvided) {
        $deleteQuestionsStmt = $pdo->prepare('DELETE FROM quiz_questions WHERE quiz_id = ?');
        $deleteQuestionsStmt->execute([$quizId]);

        $insertQuestionStmt = $pdo->prepare(
            'INSERT INTO quiz_questions
             (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        foreach ($normalizedQuestions as $question) {
            $insertQuestionStmt->execute([
                $quizId,
                $question['questionText'],
                $question['questionType'],
                $question['options'] !== null ? json_encode($question['options'], JSON_UNESCAPED_SLASHES) : null,
                json_encode($question['correctAnswer'], JSON_UNESCAPED_SLASHES),
                $question['marks'],
                $question['sortOrder']
            ]);
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error('Failed to update quiz', ['error' => $e->getMessage()], 500);
}

$quizStmt->execute([$quizId]);
$updatedQuiz = $quizStmt->fetch();

$questionStmt = $pdo->prepare(
    'SELECT id, question_text, question_type, options, correct_answer, marks, sort_order
     FROM quiz_questions
     WHERE quiz_id = ?
     ORDER BY sort_order ASC, id ASC'
);
$questionStmt->execute([$quizId]);
$updatedQuestions = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'questionText' => $row['question_text'],
        'questionType' => $row['question_type'],
        'options' => $row['options'] ? json_decode($row['options'], true) : null,
        'correctAnswer' => $row['correct_answer'] ? json_decode($row['correct_answer'], true) : null,
        'marks' => (float) $row['marks'],
        'sortOrder' => (int) $row['sort_order']
    ];
}, $questionStmt->fetchAll());

json_success([
    'quiz' => [
        'id' => (int) $updatedQuiz['id'],
        '_id' => (int) $updatedQuiz['id'],
        'courseId' => (int) $updatedQuiz['course_id'],
        'moduleId' => to_int($updatedQuiz['module_id']),
        'lessonId' => to_int($updatedQuiz['lesson_id']),
        'title' => $updatedQuiz['title'],
        'description' => $updatedQuiz['description'],
        'passPercentage' => (float) $updatedQuiz['pass_percentage'],
        'timeLimitMinutes' => to_int($updatedQuiz['time_limit_minutes']),
        'isActive' => (bool) $updatedQuiz['is_active'],
        'isFinalAssessment' => $hasFinalAssessmentColumn ? (bool) $updatedQuiz['is_final_assessment'] : false,
        'questions' => $updatedQuestions,
        'updated_at' => $updatedQuiz['updated_at']
    ]
], 'Quiz updated');
