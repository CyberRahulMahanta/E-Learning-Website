<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'], true)) {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'user_notifications')) {
    json_error('Notifications feature unavailable', null, 500);
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'notification.view');

$notificationId = to_int($_GET['id'] ?? null);
if (!$notificationId || $notificationId <= 0) {
    json_error('Valid notification id required', null, 422);
}

$stmt = $pdo->prepare('SELECT * FROM user_notifications WHERE id = ? LIMIT 1');
$stmt->execute([$notificationId]);
$notification = $stmt->fetch();
if (!$notification) {
    json_error('Notification not found', null, 404);
}

if ((string) $authUser['role'] !== 'admin' && (int) $notification['user_id'] !== (int) $authUser['id']) {
    json_error('Forbidden', null, 403);
}

$updateStmt = $pdo->prepare('UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE id = ?');
$updateStmt->execute([$notificationId]);

json_success([
    'id' => $notificationId,
    'read' => true
], 'Notification marked as read');

