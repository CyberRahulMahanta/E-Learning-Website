<?php
// CORS handling for local development and optional production origins.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowOrigin = '*';

if ($origin !== '' && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin)) {
    $allowOrigin = $origin;
}

header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override');
header('Access-Control-Max-Age: 86400');

// Dynamic API responses should never be browser-cached.
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Only include credentials header for non-wildcard origins.
if ($allowOrigin !== '*') {
    header('Access-Control-Allow-Credentials: true');
}

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}
