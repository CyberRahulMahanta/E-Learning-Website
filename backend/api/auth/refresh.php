<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$refreshToken = get_refresh_token();
if (!$refreshToken) {
    json_error('Refresh token required', null, 422);
}

$tokens = rotate_auth_tokens($pdo, $refreshToken);
if (!$tokens) {
    json_error('Invalid or expired refresh token', null, 401);
}

json_success([
    'token' => $tokens['token'],
    'accessToken' => $tokens['accessToken'],
    'refreshToken' => $tokens['refreshToken'],
    'user' => $tokens['user']
], 'Token refreshed');

