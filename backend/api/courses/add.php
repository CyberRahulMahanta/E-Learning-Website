<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'course.manage.own');

$slug = sanitize($_POST['slug'] ?? '');
$name = sanitize($_POST['name'] ?? '');
$title = sanitize($_POST['title'] ?? '');
$titleHighlight = sanitize($_POST['titleHighlight'] ?? $_POST['title_highlight'] ?? '');
$titleSuffix = sanitize($_POST['titleSuffix'] ?? $_POST['title_suffix'] ?? '');
$subtitle = sanitize($_POST['subtitle'] ?? '');
$description = trim((string) ($_POST['description'] ?? ''));
$roadmap = trim((string) ($_POST['roadmap'] ?? ''));
$youtubeUrl = trim((string) ($_POST['youtubeUrl'] ?? $_POST['youtube_url'] ?? ''));
$price = (float) ($_POST['price'] ?? 0);
$originalPrice = (float) ($_POST['originalPrice'] ?? $_POST['original_price'] ?? 0);
$batchDate = sanitize($_POST['batchDate'] ?? $_POST['batch_date'] ?? '');
$learnButtonText = sanitize($_POST['learnButtonText'] ?? $_POST['learn_button_text'] ?? '');
$baseAmount = (float) ($_POST['baseAmount'] ?? $_POST['base_amount'] ?? 0);
$platformFees = (float) ($_POST['platformFees'] ?? $_POST['platform_fees'] ?? 0);
$gst = (float) ($_POST['gst'] ?? 0);
$language = sanitize($_POST['language'] ?? '');
$totalContentHours = sanitize($_POST['totalContentHours'] ?? $_POST['total_content_hours'] ?? '');
$difficultyLevel = sanitize($_POST['difficultyLevel'] ?? $_POST['difficulty_level'] ?? 'beginner');
$categoryId = to_int($_POST['categoryId'] ?? $_POST['category_id'] ?? null);
$isPublished = to_bool($_POST['isPublished'] ?? $_POST['is_published'] ?? 1, true);
$isFeatured = to_bool($_POST['isFeatured'] ?? $_POST['is_featured'] ?? 0, false);
$introVideoUrl = trim((string) ($_POST['introVideoUrl'] ?? $_POST['intro_video_url'] ?? ''));
$tags = parse_tags($_POST['tags'] ?? []);
$instructorId = (int) ($_POST['instructorId'] ?? $_POST['instructor'] ?? $authUser['id']);

if ($name === '') {
    json_error('Course name is required', null, 422);
}

if ($slug === '') {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
}

if ($slug === '') {
    json_error('Invalid slug generated. Provide a valid slug.', null, 422);
}

if ($authUser['role'] !== 'admin') {
    $instructorId = (int) $authUser['id'];
}

if ($instructorId <= 0) {
    json_error('Instructor is required', null, 422);
}

if (!in_array($difficultyLevel, ['beginner', 'intermediate', 'advanced'], true)) {
    $difficultyLevel = 'beginner';
}

$instructorStmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ? LIMIT 1');
$instructorStmt->execute([$instructorId]);
$instructor = $instructorStmt->fetch();
if (!$instructor || !in_array($instructor['role'], ['instructor', 'admin'], true)) {
    json_error('Selected instructor is invalid', null, 422);
}

$dupStmt = $pdo->prepare('SELECT id FROM courses WHERE slug = ? LIMIT 1');
$dupStmt->execute([$slug]);
if ($dupStmt->fetch()) {
    json_error('Slug already exists', null, 409);
}

$imagePath = null;
if (isset($_FILES['image']) && (int) $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/../../uploads';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        json_error('Unable to create uploads directory', null, 500);
    }

    $extension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    if ($extension === '') {
        $extension = 'jpg';
    }
    $filename = uniqid('course_', true) . '.' . $extension;
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($_FILES['image']['tmp_name'], $destination)) {
        json_error('Image upload failed', null, 500);
    }

    $imagePath = '/uploads/' . $filename;
}

$insertStmt = $pdo->prepare(
    'INSERT INTO courses
    (slug, name, title, title_highlight, title_suffix, subtitle, description, roadmap, youtube_url, tags, price, original_price, batch_date, learn_button_text, base_amount, platform_fees, gst, language, total_content_hours, difficulty_level, category_id, is_published, is_featured, intro_video_url, instructor_id, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$insertStmt->execute([
    $slug,
    $name,
    $title !== '' ? $title : $name,
    $titleHighlight !== '' ? $titleHighlight : null,
    $titleSuffix !== '' ? $titleSuffix : null,
    $subtitle !== '' ? $subtitle : null,
    $description !== '' ? $description : null,
    $roadmap !== '' ? $roadmap : null,
    $youtubeUrl !== '' ? $youtubeUrl : null,
    json_encode($tags),
    $price,
    $originalPrice > 0 ? $originalPrice : null,
    $batchDate !== '' ? $batchDate : null,
    $learnButtonText !== '' ? $learnButtonText : null,
    $baseAmount > 0 ? $baseAmount : null,
    $platformFees > 0 ? $platformFees : null,
    $gst > 0 ? $gst : null,
    $language !== '' ? $language : null,
    $totalContentHours !== '' ? $totalContentHours : null,
    $difficultyLevel,
    $categoryId,
    $isPublished ? 1 : 0,
    $isFeatured ? 1 : 0,
    $introVideoUrl !== '' ? $introVideoUrl : null,
    $instructorId,
    $imagePath
]);

$courseId = (int) $pdo->lastInsertId();

$fetchStmt = $pdo->prepare(
    'SELECT c.*, u.username AS instructor_username, u.email AS instructor_email
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     WHERE c.id = ? LIMIT 1'
);
$fetchStmt->execute([$courseId]);
$course = $fetchStmt->fetch();

json_success([
    'course' => normalize_course($course)
], 'Course created', 201);
