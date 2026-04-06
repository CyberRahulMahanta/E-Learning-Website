<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'POST'], true)) {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin', 'instructor']);
ensure_permission($pdo, $authUser, 'course.manage.own');

$courseId = (int) ($_GET['id'] ?? 0);
if ($courseId <= 0) {
    json_error('Course id is required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT * FROM courses WHERE id = ? LIMIT 1');
$courseStmt->execute([$courseId]);
$existingCourse = $courseStmt->fetch();
if (!$existingCourse) {
    json_error('Course not found', null, 404);
}

if ($authUser['role'] !== 'admin' && (int) $existingCourse['instructor_id'] !== (int) $authUser['id']) {
    json_error('Forbidden', null, 403);
}

$data = get_input_data();
$fields = [];
$params = [];

if (isset($data['slug'])) {
    $slug = sanitize($data['slug']);
    if ($slug !== '') {
        $dupStmt = $pdo->prepare('SELECT id FROM courses WHERE slug = ? AND id <> ? LIMIT 1');
        $dupStmt->execute([$slug, $courseId]);
        if ($dupStmt->fetch()) {
            json_error('Slug already exists', null, 409);
        }
        $fields[] = 'slug = ?';
        $params[] = $slug;
    }
}

if (isset($data['name'])) {
    $fields[] = 'name = ?';
    $params[] = sanitize($data['name']);
}

if (isset($data['title'])) {
    $fields[] = 'title = ?';
    $params[] = sanitize($data['title']);
}

if (isset($data['titleHighlight']) || isset($data['title_highlight'])) {
    $value = sanitize($data['titleHighlight'] ?? $data['title_highlight'] ?? '');
    $fields[] = 'title_highlight = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['titleSuffix']) || isset($data['title_suffix'])) {
    $value = sanitize($data['titleSuffix'] ?? $data['title_suffix'] ?? '');
    $fields[] = 'title_suffix = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['subtitle'])) {
    $value = sanitize($data['subtitle']);
    $fields[] = 'subtitle = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['description'])) {
    $value = trim((string) $data['description']);
    $fields[] = 'description = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['roadmap'])) {
    $value = trim((string) $data['roadmap']);
    $fields[] = 'roadmap = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['youtubeUrl']) || isset($data['youtube_url'])) {
    $value = trim((string) ($data['youtubeUrl'] ?? $data['youtube_url'] ?? ''));
    $fields[] = 'youtube_url = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['tags'])) {
    $fields[] = 'tags = ?';
    $params[] = json_encode(parse_tags($data['tags']));
}

if (isset($data['price']) && $data['price'] !== '') {
    $fields[] = 'price = ?';
    $params[] = (float) $data['price'];
}

if (isset($data['originalPrice']) || isset($data['original_price'])) {
    $value = (float) ($data['originalPrice'] ?? $data['original_price'] ?? 0);
    $fields[] = 'original_price = ?';
    $params[] = $value > 0 ? $value : null;
}

if (isset($data['batchDate']) || isset($data['batch_date'])) {
    $value = sanitize($data['batchDate'] ?? $data['batch_date'] ?? '');
    $fields[] = 'batch_date = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['learnButtonText']) || isset($data['learn_button_text'])) {
    $value = sanitize($data['learnButtonText'] ?? $data['learn_button_text'] ?? '');
    $fields[] = 'learn_button_text = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['baseAmount']) || isset($data['base_amount'])) {
    $value = (float) ($data['baseAmount'] ?? $data['base_amount'] ?? 0);
    $fields[] = 'base_amount = ?';
    $params[] = $value > 0 ? $value : null;
}

if (isset($data['platformFees']) || isset($data['platform_fees'])) {
    $value = (float) ($data['platformFees'] ?? $data['platform_fees'] ?? 0);
    $fields[] = 'platform_fees = ?';
    $params[] = $value > 0 ? $value : null;
}

if (isset($data['gst'])) {
    $value = (float) ($data['gst'] ?? 0);
    $fields[] = 'gst = ?';
    $params[] = $value > 0 ? $value : null;
}

if (isset($data['language'])) {
    $value = sanitize($data['language']);
    $fields[] = 'language = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['totalContentHours']) || isset($data['total_content_hours'])) {
    $value = sanitize($data['totalContentHours'] ?? $data['total_content_hours'] ?? '');
    $fields[] = 'total_content_hours = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['difficultyLevel']) || isset($data['difficulty_level'])) {
    $value = sanitize($data['difficultyLevel'] ?? $data['difficulty_level'] ?? 'beginner');
    if (!in_array($value, ['beginner', 'intermediate', 'advanced'], true)) {
        json_error('Invalid difficulty level', null, 422);
    }
    $fields[] = 'difficulty_level = ?';
    $params[] = $value;
}

if (isset($data['categoryId']) || isset($data['category_id'])) {
    $value = to_int($data['categoryId'] ?? $data['category_id']);
    $fields[] = 'category_id = ?';
    $params[] = $value && $value > 0 ? $value : null;
}

if (isset($data['isPublished']) || isset($data['is_published'])) {
    $value = to_bool($data['isPublished'] ?? $data['is_published'], true);
    $fields[] = 'is_published = ?';
    $params[] = $value ? 1 : 0;
}

if (isset($data['isFeatured']) || isset($data['is_featured'])) {
    $value = to_bool($data['isFeatured'] ?? $data['is_featured'], false);
    $fields[] = 'is_featured = ?';
    $params[] = $value ? 1 : 0;
}

if (isset($data['introVideoUrl']) || isset($data['intro_video_url'])) {
    $value = trim((string) ($data['introVideoUrl'] ?? $data['intro_video_url'] ?? ''));
    $fields[] = 'intro_video_url = ?';
    $params[] = $value !== '' ? $value : null;
}

if (isset($data['instructorId']) || isset($data['instructor'])) {
    $instructorId = (int) ($data['instructorId'] ?? $data['instructor']);
    if ($authUser['role'] !== 'admin' && $instructorId !== (int) $authUser['id']) {
        json_error('Instructors can only assign themselves to their courses', null, 403);
    }

    if ($instructorId <= 0) {
        json_error('Invalid instructor', null, 422);
    }

    $instructorStmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ? LIMIT 1');
    $instructorStmt->execute([$instructorId]);
    $instructor = $instructorStmt->fetch();
    if (!$instructor || !in_array($instructor['role'], ['instructor', 'admin'], true)) {
        json_error('Selected instructor is invalid', null, 422);
    }

    $fields[] = 'instructor_id = ?';
    $params[] = $instructorId;
}

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

    $fields[] = 'image = ?';
    $params[] = '/uploads/' . $filename;
}

if (empty($fields)) {
    json_error('No updates provided', null, 422);
}

$params[] = $courseId;
$updateSql = 'UPDATE courses SET ' . implode(', ', $fields) . ' WHERE id = ?';
$updateStmt = $pdo->prepare($updateSql);
$updateStmt->execute($params);

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
], 'Course updated');
