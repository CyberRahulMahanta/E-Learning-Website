<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.content.manage.own');

$courseId = to_int($_GET['id'] ?? null);
if (!$courseId || $courseId <= 0) {
    json_error('Valid course id required', null, 422);
}

ensure_course_manage_access($pdo, $authUser, $courseId);

$data = get_input_data();
$moduleOrders = $data['moduleOrders'] ?? $data['module_orders'] ?? null;
if (!is_array($moduleOrders) || empty($moduleOrders)) {
    json_error('moduleOrders array is required', null, 422);
}

$moduleIds = [];
$sortOrders = [];
foreach ($moduleOrders as $item) {
    if (!is_array($item)) {
        continue;
    }
    $moduleId = to_int($item['id'] ?? null);
    $sortOrder = to_int($item['sortOrder'] ?? $item['sort_order'] ?? null);
    if (!$moduleId || $moduleId <= 0 || !$sortOrder || $sortOrder <= 0) {
        continue;
    }
    $moduleIds[] = $moduleId;
    $sortOrders[$moduleId] = $sortOrder;
}

if (empty($moduleIds)) {
    json_error('No valid module orders provided', null, 422);
}

$placeholders = implode(',', array_fill(0, count($moduleIds), '?'));
$checkStmt = $pdo->prepare(
    'SELECT id
     FROM course_modules
     WHERE course_id = ? AND id IN (' . $placeholders . ')'
);
$checkStmt->execute(array_merge([$courseId], $moduleIds));
$existingIds = array_map(function ($row) {
    return (int) $row['id'];
}, $checkStmt->fetchAll());

if (count($existingIds) !== count($moduleIds)) {
    json_error('One or more modules do not belong to this course', null, 422);
}

try {
    $pdo->beginTransaction();
    $updateStmt = $pdo->prepare('UPDATE course_modules SET sort_order = ? WHERE id = ? AND course_id = ?');
    foreach ($sortOrders as $moduleId => $sortOrder) {
        $updateStmt->execute([$sortOrder, $moduleId, $courseId]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_error('Failed to reorder modules', ['error' => $e->getMessage()], 500);
}

json_success(['updated' => true], 'Modules reordered');
