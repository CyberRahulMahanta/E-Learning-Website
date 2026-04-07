<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'quizzes') || !table_exists($pdo, 'quiz_questions')) {
    json_error('Quiz feature unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'quiz.manage.own');

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
$isAdmin = (string) $authUser['role'] === 'admin';
if (!$isAdmin && (int) $course['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden: you can only create quiz for your own course', null, 403);
}

$data = get_input_data();
$title = sanitize($data['title'] ?? '');
$description = trim((string) ($data['description'] ?? ''));
$passPercentage = isset($data['passPercentage']) ? (float) $data['passPercentage'] : 60.0;
$timeLimitMinutes = to_int($data['timeLimitMinutes'] ?? null);
$moduleId = to_int($data['moduleId'] ?? null);
$lessonId = to_int($data['lessonId'] ?? null);
$isFinalAssessment = to_bool($data['isFinalAssessment'] ?? $data['is_final_assessment'] ?? false, false);
$questions = $data['questions'] ?? [];

if ($isFinalAssessment) {
    $moduleId = null;
    $lessonId = null;
}

if ($title === '') {
    json_error('Quiz title is required', null, 422);
}

if ($passPercentage < 0 || $passPercentage > 100) {
    json_error('Pass percentage must be between 0 and 100', null, 422);
}

if (!is_array($questions) || count($questions) === 0) {
    json_error('At least one question is required', null, 422);
}

$normalizedQuestions = [];
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
            json_error('At least 2 options required for non-text questions at index ' . $index, null, 422);
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
            json_error('Correct answer must be a non-empty array for multiple questions at index ' . $index, null, 422);
        }
        $correctAnswer = array_values(array_filter(array_map(function ($value) {
            return trim((string) $value);
        }, $correctAnswer), function ($value) {
            return $value !== '';
        }));
        if (count($correctAnswer) === 0) {
            json_error('Correct answers cannot be empty at index ' . $index, null, 422);
        }
    } else {
        if (is_array($correctAnswer)) {
            json_error('Correct answer must be a single value at index ' . $index, null, 422);
        }
        $correctAnswer = trim((string) $correctAnswer);
        if ($correctAnswer === '') {
            json_error('Correct answer is required at index ' . $index, null, 422);
        }
    }

    if ($normalizedOptions !== null) {
        if ($questionType === 'multiple') {
            foreach ($correctAnswer as $answerItem) {
                if (!in_array($answerItem, $normalizedOptions, true)) {
                    json_error('Multiple correct answer "' . $answerItem . '" not found in options at index ' . $index, null, 422);
                }
            }
        } elseif (!in_array($correctAnswer, $normalizedOptions, true)) {
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

try {
    $pdo->beginTransaction();

    $hasFinalAssessmentColumn = column_exists($pdo, 'quizzes', 'is_final_assessment');
    if ($hasFinalAssessmentColumn) {
        $quizStmt = $pdo->prepare(
            'INSERT INTO quizzes
             (course_id, module_id, lesson_id, title, description, pass_percentage, time_limit_minutes, is_active, is_final_assessment)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)'
        );
        $quizStmt->execute([
            $courseId,
            $moduleId,
            $lessonId,
            $title,
            $description !== '' ? $description : null,
            $passPercentage,
            $timeLimitMinutes,
            $isFinalAssessment ? 1 : 0
        ]);
    } else {
        $quizStmt = $pdo->prepare(
            'INSERT INTO quizzes
             (course_id, module_id, lesson_id, title, description, pass_percentage, time_limit_minutes, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
        );
        $quizStmt->execute([
            $courseId,
            $moduleId,
            $lessonId,
            $title,
            $description !== '' ? $description : null,
            $passPercentage,
            $timeLimitMinutes
        ]);
    }

    $quizId = (int) $pdo->lastInsertId();

    $questionStmt = $pdo->prepare(
        'INSERT INTO quiz_questions
         (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($normalizedQuestions as $question) {
        $questionStmt->execute([
            $quizId,
            $question['questionText'],
            $question['questionType'],
            $question['options'] !== null ? json_encode($question['options'], JSON_UNESCAPED_SLASHES) : null,
            json_encode($question['correctAnswer'], JSON_UNESCAPED_SLASHES),
            $question['marks'],
            $question['sortOrder']
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error('Failed to create quiz', ['error' => $e->getMessage()], 500);
}

json_success([
    'quiz' => [
        'id' => $quizId,
        '_id' => $quizId,
        'courseId' => $courseId,
        'courseSlug' => $course['slug'],
        'title' => $title,
        'description' => $description !== '' ? $description : null,
        'passPercentage' => $passPercentage,
        'timeLimitMinutes' => $timeLimitMinutes,
        'isFinalAssessment' => $isFinalAssessment,
        'questionCount' => count($normalizedQuestions),
        'questions' => $normalizedQuestions
    ]
], 'Quiz created', 201);
