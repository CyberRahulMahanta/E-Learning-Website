<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$certificateCode = sanitize($_GET['code'] ?? '');
if ($certificateCode === '') {
    json_error('Certificate code required', null, 422);
}

$certificate = get_certificate_by_code($pdo, $certificateCode);
if (!$certificate) {
    json_error('Certificate not found', null, 404);
}

json_success([
    'certificate' => $certificate,
    'verified' => true
], 'Certificate verified');
