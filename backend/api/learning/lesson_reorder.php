<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$moduleId = to_int($_GET['id'] ?? null);
if (!$moduleId || $moduleId <= 0) {
    json_error('Valid module id required', null, 422);
}

$moduleStmt = $pdo->prepare('SELECT id, course_id FROM course_modules WHERE id = ? LIMIT 1');
$moduleStmt->execute([$moduleId]);
$module = $moduleStmt->fetch();
if (!$module) {
    json_error('Module not found', null, 404);
}

ensure_course_manage_access($pdo, $authUser, (int) $module['course_id']);

$data = get_input_data();
$lessonOrders = $data['lessonOrders'] ?? $data['lesson_orders'] ?? null;
if (!is_array($lessonOrders) || empty($lessonOrders)) {
    json_error('lessonOrders array is required', null, 422);
}

$lessonIds = [];
$sortOrders = [];
foreach ($lessonOrders as $item) {
    if (!is_array($item)) {
        continue;
    }
    $lessonId = to_int($item['id'] ?? null);
    $sortOrder = to_int($item['sortOrder'] ?? $item['sort_order'] ?? null);
    if (!$lessonId || $lessonId <= 0 || !$sortOrder || $sortOrder <= 0) {
        continue;
    }
    $lessonIds[] = $lessonId;
    $sortOrders[$lessonId] = $sortOrder;
}

if (empty($lessonIds)) {
    json_error('No valid lesson orders provided', null, 422);
}

$placeholders = implode(',', array_fill(0, count($lessonIds), '?'));
$checkStmt = $pdo->prepare(
    'SELECT id
     FROM course_lessons
     WHERE module_id = ? AND id IN (' . $placeholders . ')'
);
$checkStmt->execute(array_merge([$moduleId], $lessonIds));
$existingIds = array_map(function ($row) {
    return (int) $row['id'];
}, $checkStmt->fetchAll());

if (count($existingIds) !== count($lessonIds)) {
    json_error('One or more lessons do not belong to this module', null, 422);
}

try {
    $pdo->beginTransaction();
    $updateStmt = $pdo->prepare('UPDATE course_lessons SET sort_order = ? WHERE id = ? AND module_id = ?');
    foreach ($sortOrders as $lessonId => $sortOrder) {
        $updateStmt->execute([$sortOrder, $lessonId, $moduleId]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error('Failed to reorder lessons', ['error' => $e->getMessage()], 500);
}

json_success(['updated' => true], 'Lessons reordered');
