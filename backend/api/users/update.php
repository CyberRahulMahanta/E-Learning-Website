<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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
$existing = $stmt->fetch();
if (!$existing) {
    json_error('User not found', null, 404);
}

$data = get_input_data();
$fields = [];
$params = [];

if (isset($data['username'])) {
    $fields[] = 'username = ?';
    $params[] = sanitize($data['username']);
}

if (isset($data['phone'])) {
    $phone = sanitize($data['phone']);
    $fields[] = 'phone = ?';
    $params[] = $phone !== '' ? $phone : null;
}

if (isset($data['gender'])) {
    $gender = sanitize($data['gender']);
    if ($gender !== '' && !in_array($gender, ['Male', 'Female', 'Other'], true)) {
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
    $dupStmt->execute([$email, $id]);
    if ($dupStmt->fetch()) {
        json_error('Email already in use', null, 409);
    }
    $fields[] = 'email = ?';
    $params[] = $email;
}

if (isset($data['role'])) {
    if ($authUser['role'] !== 'admin') {
        json_error('Only admin can change roles', null, 403);
    }
    $role = sanitize($data['role']);
    $allowedRoles = ['student', 'instructor', 'admin'];
    if (!in_array($role, $allowedRoles, true)) {
        json_error('Invalid role', null, 422);
    }
    $fields[] = 'role = ?';
    $params[] = $role;
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
    json_success(['user' => normalize_user($existing)], 'No changes applied');
}

$params[] = $id;
$sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
$updateStmt = $pdo->prepare($sql);
$updateStmt->execute($params);

$refreshStmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$refreshStmt->execute([$id]);
$updated = $refreshStmt->fetch();

json_success(['user' => normalize_user($updated)], 'User updated');
