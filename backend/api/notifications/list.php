<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'user_notifications')) {
    json_success(['notifications' => []], 'Notifications fetched');
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'notification.view');

$pagination = get_pagination_params(20, 100);
$onlyUnread = isset($_GET['unread']) ? to_bool($_GET['unread'], false) : false;

$countSql = 'SELECT COUNT(*) FROM user_notifications WHERE user_id = ?';
$countParams = [(int) $authUser['id']];
if ($onlyUnread) {
    $countSql .= ' AND is_read = 0';
}
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($countParams);
$total = (int) $countStmt->fetchColumn();

$sql = 'SELECT * FROM user_notifications WHERE user_id = ?';
$params = [(int) $authUser['id']];
if ($onlyUnread) {
    $sql .= ' AND is_read = 0';
}
$sql .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
$params[] = $pagination['limit'];
$params[] = $pagination['offset'];

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$notifications = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'type' => $row['type'],
        'title' => $row['title'],
        'message' => $row['message'],
        'data' => $row['data'] ? json_decode($row['data'], true) : null,
        'isRead' => (bool) $row['is_read'],
        'readAt' => $row['read_at'],
        'created_at' => $row['created_at']
    ];
}, $stmt->fetchAll());

json_success([
    'notifications' => $notifications,
    'pagination' => paginate_items([], $total, $pagination['page'], $pagination['limit'])['pagination']
], 'Notifications fetched');

