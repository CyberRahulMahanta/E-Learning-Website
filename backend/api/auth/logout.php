<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$user = get_authenticated_user($pdo);
$refreshToken = get_refresh_token();

if ($refreshToken) {
    revoke_refresh_token($pdo, $refreshToken);
}

$logoutAll = to_bool((get_input_data()['logoutAll'] ?? null), false);
if ($logoutAll && $user) {
    revoke_user_refresh_tokens($pdo, (int) $user['id']);
}

json_success(['loggedOut' => true], 'Logged out successfully');
