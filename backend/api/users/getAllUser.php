<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);
ensure_roles($authUser, ['admin']);

$stmt = $pdo->prepare('SELECT * FROM users ORDER BY created_at DESC');
$stmt->execute();
$rows = $stmt->fetchAll();

$users = array_map(function ($row) {
    return normalize_user($row);
}, $rows);

json_success(['users' => $users], 'Users fetched');
