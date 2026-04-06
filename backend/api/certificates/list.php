<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$authUser = ensure_authenticated($pdo);

if (!table_exists($pdo, 'certificates')) {
    json_success(['certificates' => []], 'Certificates fetched');
}

$targetUserId = to_int($_GET['userId'] ?? $_GET['user_id'] ?? null);
if (!$targetUserId || $targetUserId <= 0) {
    $targetUserId = (int) $authUser['id'];
}

if ($targetUserId !== (int) $authUser['id'] && (string) $authUser['role'] !== 'admin') {
    json_error('Forbidden', null, 403);
}

$stmt = $pdo->prepare(
    'SELECT cert.id, cert.user_id, cert.course_id, cert.certificate_code, cert.issue_date, cert.metadata, cert.created_at,
            c.slug AS course_slug, c.name AS course_name, c.title AS course_title, c.image AS course_image
     FROM certificates cert
     JOIN courses c ON c.id = cert.course_id
     WHERE cert.user_id = ?
     ORDER BY cert.issue_date DESC, cert.id DESC'
);
$stmt->execute([$targetUserId]);
$rows = $stmt->fetchAll();

$certificates = array_map(function ($row) {
    $normalized = normalize_certificate($row);
    $normalized['course'] = [
        'id' => (int) $row['course_id'],
        '_id' => (int) $row['course_id'],
        'slug' => $row['course_slug'],
        'name' => $row['course_name'],
        'title' => $row['course_title'],
        'image' => $row['course_image']
    ];
    return $normalized;
}, $rows);

json_success([
    'userId' => $targetUserId,
    'certificates' => $certificates
], 'Certificates fetched');
