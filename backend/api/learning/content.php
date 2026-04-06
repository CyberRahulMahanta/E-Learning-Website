<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$idOrSlug = sanitize($_GET['id'] ?? '');
if ($idOrSlug === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id, slug, instructor_id FROM courses WHERE id = :id OR slug = :slug LIMIT 1');
$courseStmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}

$courseId = (int) $course['id'];
$authUser = get_authenticated_user($pdo);

$canSeeAll = false;
if ($authUser) {
    if ((string) $authUser['role'] === 'admin') {
        $canSeeAll = true;
    } elseif ((int) $course['instructor_id'] === (int) $authUser['id']) {
        $canSeeAll = true;
    } else {
        $enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
        $enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
        $canSeeAll = (bool) $enrollmentStmt->fetchColumn();
    }
}

$modules = get_course_modules($pdo, $courseId, true);

$visibleLessonIds = [];
foreach ($modules as &$module) {
    if (!$canSeeAll) {
        $module['lessons'] = array_values(array_filter($module['lessons'], function ($lesson) {
            return !empty($lesson['isPreview']);
        }));
    }

    foreach ($module['lessons'] as $lesson) {
        $visibleLessonIds[] = (int) $lesson['id'];
    }
}
unset($module);

$resourcesByLesson = [];
if (table_exists($pdo, 'lesson_resources') && !empty($visibleLessonIds)) {
    $placeholders = implode(',', array_fill(0, count($visibleLessonIds), '?'));
    $resourceStmt = $pdo->prepare(
        'SELECT id, lesson_id, title, resource_type, resource_url, sort_order, created_at, updated_at
         FROM lesson_resources
         WHERE lesson_id IN (' . $placeholders . ')
         ORDER BY sort_order ASC, id ASC'
    );
    $resourceStmt->execute($visibleLessonIds);
    foreach ($resourceStmt->fetchAll() as $resource) {
        $lessonId = (int) $resource['lesson_id'];
        $resourcesByLesson[$lessonId][] = [
            'id' => (int) $resource['id'],
            '_id' => (int) $resource['id'],
            'title' => $resource['title'],
            'resourceType' => $resource['resource_type'],
            'resourceUrl' => $resource['resource_url'],
            'sortOrder' => (int) $resource['sort_order'],
            'created_at' => $resource['created_at'],
            'updated_at' => $resource['updated_at']
        ];
    }
}

foreach ($modules as &$module) {
    foreach ($module['lessons'] as &$lesson) {
        $lesson['resources'] = $resourcesByLesson[(int) $lesson['id']] ?? [];
    }
    unset($lesson);
}
unset($module);

json_success([
    'courseId' => $courseId,
    'courseSlug' => $course['slug'],
    'fullAccess' => $canSeeAll,
    'modules' => $modules
], 'Course content fetched');

