<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

$data = get_input_data();

$username = sanitize($data['username'] ?? $data['email'] ?? '');
$email = sanitize($data['email'] ?? '');
$password = (string) ($data['password'] ?? '');
$phone = sanitize($data['phone'] ?? '');
$gender = sanitize($data['gender'] ?? 'Male');

if ($email === '' || $password === '') {
    json_error('Email and password required', null, 422);
}

if (strlen($password) < 6) {
    json_error('Password too short (minimum 6 characters)', null, 422);
}

$existsStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$existsStmt->execute([$email]);
if ($existsStmt->fetch()) {
    json_error('Email already registered', null, 409);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$insertStmt = $pdo->prepare('INSERT INTO users (username, email, password, phone, gender, role) VALUES (?, ?, ?, ?, ?, ?)');
$insertStmt->execute([
    $username !== '' ? $username : $email,
    $email,
    $passwordHash,
    $phone !== '' ? $phone : null,
    $gender !== '' ? $gender : 'Male',
    'student'
]);

$id = (int) $pdo->lastInsertId();
$userStmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$userStmt->execute([$id]);
$user = $userStmt->fetch();

$tokens = issue_auth_tokens($pdo, $user);

json_success([
    'token' => $tokens['token'],
    'accessToken' => $tokens['accessToken'],
    'refreshToken' => $tokens['refreshToken'],
    'user' => normalize_user($user)
], 'Signup successful', 201);
