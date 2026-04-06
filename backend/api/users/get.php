<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
$id = (int) ($_GET['id'] ?? 0);

if ($id <= 0) {
    json_error('User id required', null, 422);
}

if ($authUser['role'] !== 'admin' && (int) $authUser['id'] !== $id) {
    json_error('Forbidden', null, 403);
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$user = $stmt->fetch();

if (!$user) {
    json_error('User not found', null, 404);
}

json_success(['user' => normalize_user($user)], 'User fetched');
