<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$user = ensure_authenticated($pdo);

$permissions = [];
if (table_exists($pdo, 'role_permissions')) {
    $stmt = $pdo->prepare('SELECT permission_key FROM role_permissions WHERE role = ? ORDER BY permission_key ASC');
    $stmt->execute([(string) $user['role']]);
    $permissions = array_map(function ($row) {
        return $row['permission_key'];
    }, $stmt->fetchAll());
}

json_success([
    'user' => normalize_user($user),
    'permissions' => $permissions
], 'Authenticated user');
