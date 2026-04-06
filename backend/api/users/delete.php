<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin']);

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    json_error('User id required', null, 422);
}

if ((int) $authUser['id'] === $id) {
    json_error('Admin cannot delete their own account', null, 422);
}

$userStmt = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
$userStmt->execute([$id]);
if (!$userStmt->fetch()) {
    json_error('User not found', null, 404);
}

$deleteStmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
$deleteStmt->execute([$id]);

json_success(['deleted' => true], 'User deleted');
