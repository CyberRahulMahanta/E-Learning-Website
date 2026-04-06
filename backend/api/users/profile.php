<?php
require_once __DIR__ . '/../../core/bootstrap.php';

$authUser = ensure_authenticated($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_success(['user' => normalize_user($authUser)], 'Profile fetched');
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_error('Method not allowed', null, 405);
}

$data = get_input_data();
$fields = [];
$params = [];

if (isset($data['username'])) {
    $username = sanitize($data['username']);
    $fields[] = 'username = ?';
    $params[] = $username !== '' ? $username : $authUser['username'];
}

if (isset($data['phone'])) {
    $phone = sanitize($data['phone']);
    $fields[] = 'phone = ?';
    $params[] = $phone !== '' ? $phone : null;
}

if (isset($data['gender'])) {
    $gender = sanitize($data['gender']);
    $allowedGenders = ['Male', 'Female', 'Other'];
    if ($gender !== '' && !in_array($gender, $allowedGenders, true)) {
        json_error('Invalid gender value', null, 422);
    }
    $fields[] = 'gender = ?';
    $params[] = $gender !== '' ? $gender : null;
}

if (isset($data['bio'])) {
    $bio = trim((string) $data['bio']);
    $fields[] = 'bio = ?';
    $params[] = $bio !== '' ? $bio : null;
}

if (isset($data['email'])) {
    $email = sanitize($data['email']);
    if ($email === '') {
        json_error('Email cannot be empty', null, 422);
    }
    $dupStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1');
    $dupStmt->execute([$email, (int) $authUser['id']]);
    if ($dupStmt->fetch()) {
        json_error('Email already in use', null, 409);
    }
    $fields[] = 'email = ?';
    $params[] = $email;
}

if (isset($data['password']) && trim((string) $data['password']) !== '') {
    $password = (string) $data['password'];
    if (strlen($password) < 6) {
        json_error('Password must be at least 6 characters', null, 422);
    }
    $fields[] = 'password = ?';
    $params[] = password_hash($password, PASSWORD_DEFAULT);
}

if (empty($fields)) {
    json_success(['user' => normalize_user($authUser)], 'No changes applied');
}

$params[] = (int) $authUser['id'];
$sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$refreshStmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$refreshStmt->execute([(int) $authUser['id']]);
$updated = $refreshStmt->fetch();

json_success(['user' => normalize_user($updated)], 'Profile updated');
