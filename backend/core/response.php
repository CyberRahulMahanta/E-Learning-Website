<?php
// Common JSON response helpers.

if (!function_exists('is_assoc_array')) {
    function is_assoc_array($arr) {
        if (!is_array($arr)) {
            return false;
        }

        if ($arr === []) {
            return false;
        }

        return array_keys($arr) !== range(0, count($arr) - 1);
    }
}

function json_success($data = null, $message = 'Success', $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    if (function_exists('header_remove')) {
        @header_remove('ETag');
        @header_remove('Last-Modified');
    }

    $response = [
        'success' => true,
        'message' => $message
    ];

    if (is_array($data)) {
        if (is_assoc_array($data)) {
            $response = array_merge($response, $data);
        } else {
            $response['data'] = $data;
        }
    } elseif ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error($message, $error = null, $code = 400, $extra = []) {
    http_response_code($code);
    header('Content-Type: application/json');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    if (function_exists('header_remove')) {
        @header_remove('ETag');
        @header_remove('Last-Modified');
    }

    $response = [
        'success' => false,
        'message' => $message
    ];

    if ($error !== null) {
        $response['error'] = $error;
    }

    if (is_array($extra) && is_assoc_array($extra)) {
        $response = array_merge($response, $extra);
    }

    echo json_encode($response, JSON_UNESCAPED_SLASHES);
    exit;
}
?>

