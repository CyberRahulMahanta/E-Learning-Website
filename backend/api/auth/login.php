<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$data = get_input_data();
$email = sanitize($data['email'] ?? '');
$password = (string) ($data['password'] ?? '');
$role = strtolower(sanitize($data['role'] ?? ''));

if ($email === '' || $password === '' || $role === '') {
    json_error('Email, password and role are required', null, 422);
}

if (!in_array($role, ['student', 'instructor', 'admin'], true)) {
    json_error('Invalid role selected', null, 422);
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    json_error('Invalid credentials', null, 401);
}

if (strtolower((string) $user['role']) !== $role) {
    json_error('Selected role does not match this account', null, 403);
}

$tokens = issue_auth_tokens($pdo, $user);

json_success([
    'token' => $tokens['token'],
    'accessToken' => $tokens['accessToken'],
    'refreshToken' => $tokens['refreshToken'],
    'user' => normalize_user($user)
], 'Login successful');
