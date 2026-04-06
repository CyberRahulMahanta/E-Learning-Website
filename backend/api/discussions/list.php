<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'course_discussions')) {
    json_success(['discussions' => []], 'Discussions fetched');
}

$courseInput = sanitize($_GET['id'] ?? '');
if ($courseInput === '') {
    json_error('Course id or slug required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT id FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}
$courseId = (int) $course['id'];

$pagination = get_pagination_params(20, 100);

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM course_discussions WHERE course_id = ? AND is_deleted = 0');
$countStmt->execute([$courseId]);
$total = (int) $countStmt->fetchColumn();

$stmt = $pdo->prepare(
    'SELECT d.id, d.parent_id, d.message, d.created_at, d.updated_at, u.id AS user_id, u.username, u.role
     FROM course_discussions d
     JOIN users u ON u.id = d.user_id
     WHERE d.course_id = ? AND d.is_deleted = 0
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?'
);
$stmt->execute([$courseId, $pagination['limit'], $pagination['offset']]);
$rows = $stmt->fetchAll();

$discussions = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'parentId' => $row['parent_id'] !== null ? (int) $row['parent_id'] : null,
        'message' => $row['message'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'user' => [
            'id' => (int) $row['user_id'],
            '_id' => (int) $row['user_id'],
            'username' => $row['username'],
            'role' => $row['role']
        ]
    ];
}, $rows);

json_success([
    'courseId' => $courseId,
    'discussions' => $discussions,
    'pagination' => paginate_items([], $total, $pagination['page'], $pagination['limit'])['pagination']
], 'Discussions fetched');

