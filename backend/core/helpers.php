<?php
// Utility helpers

if (!defined('APP_AUTH_SECRET')) {
    define('APP_AUTH_SECRET', 'change-this-secret-in-production');
}

if (!defined('AUTH_TOKEN_TTL_SECONDS')) {
    define('AUTH_TOKEN_TTL_SECONDS', 60 * 60 * 6); // 6 hours
}

if (!defined('REFRESH_TOKEN_TTL_SECONDS')) {
    define('REFRESH_TOKEN_TTL_SECONDS', 60 * 60 * 24 * 30); // 30 days
}

function get_input_data() {
    if (!empty($_POST)) {
        return $_POST;
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return $_GET;
    }

    $json = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
        return $json;
    }

    parse_str($raw, $parsed);
    if (is_array($parsed) && !empty($parsed)) {
        return $parsed;
    }

    return $_GET;
}

function get_bearer_token() {
    $authHeader = '';

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $authHeader = $value;
                    break;
                }
            }
        }
    }

    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        return $matches[1];
    }

    return null;
}

function base64url_encode($input) {
    return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
}

function base64url_decode($input) {
    $remainder = strlen($input) % 4;
    if ($remainder) {
        $input .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($input, '-_', '+/'));
}

function create_auth_token($user) {
    $issuedAt = time();
    $payload = [
        'id' => (int) $user['id'],
        '_id' => (int) $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'iat' => $issuedAt,
        'exp' => $issuedAt + AUTH_TOKEN_TTL_SECONDS
    ];

    $header = ['alg' => 'HS256', 'typ' => 'JWT'];

    $headerEncoded = base64url_encode(json_encode($header));
    $payloadEncoded = base64url_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, APP_AUTH_SECRET, true);
    $signatureEncoded = base64url_encode($signature);

    return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
}

function decode_auth_token($token) {
    if (!$token || !is_string($token)) {
        return null;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, APP_AUTH_SECRET, true));

    if (!hash_equals($expected, $signatureEncoded)) {
        // Backward compatibility: previous tokens used plain base64.
        $legacyExpected = base64_encode(hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, APP_AUTH_SECRET, true));
        if (!hash_equals($legacyExpected, $signatureEncoded)) {
            return null;
        }
    }

    $payloadRaw = base64url_decode($payloadEncoded);
    if ($payloadRaw === false || $payloadRaw === '') {
        $payloadRaw = base64_decode($payloadEncoded);
    }

    $payload = json_decode($payloadRaw, true);
    if (!is_array($payload)) {
        return null;
    }

    if (!isset($payload['exp']) || time() > (int) $payload['exp']) {
        return null;
    }

    return $payload;
}

function get_refresh_token() {
    $data = get_input_data();
    $token = $data['refreshToken'] ?? $data['refresh_token'] ?? null;
    if (is_string($token) && trim($token) !== '') {
        return trim($token);
    }
    return null;
}

function get_client_ip() {
    $candidates = [
        $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null,
        $_SERVER['HTTP_X_REAL_IP'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null
    ];
    foreach ($candidates as $value) {
        if (!$value) {
            continue;
        }
        $ip = trim(explode(',', $value)[0]);
        if ($ip !== '') {
            return $ip;
        }
    }
    return null;
}

function create_refresh_token($pdo, $userId) {
    $rawToken = base64url_encode(random_bytes(48));
    $tokenHash = hash('sha256', $rawToken);
    $expiresAt = date('Y-m-d H:i:s', time() + REFRESH_TOKEN_TTL_SECONDS);

    $stmt = $pdo->prepare(
        'INSERT INTO auth_refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        (int) $userId,
        $tokenHash,
        substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
        get_client_ip(),
        $expiresAt
    ]);

    return $rawToken;
}

function revoke_refresh_token($pdo, $rawToken) {
    if (!$rawToken) {
        return false;
    }
    $tokenHash = hash('sha256', $rawToken);
    $stmt = $pdo->prepare(
        'UPDATE auth_refresh_tokens
         SET revoked_at = NOW()
         WHERE token_hash = ? AND revoked_at IS NULL'
    );
    $stmt->execute([$tokenHash]);
    return $stmt->rowCount() > 0;
}

function revoke_user_refresh_tokens($pdo, $userId) {
    $stmt = $pdo->prepare(
        'UPDATE auth_refresh_tokens
         SET revoked_at = NOW()
         WHERE user_id = ? AND revoked_at IS NULL'
    );
    $stmt->execute([(int) $userId]);
}

function get_valid_refresh_token_row($pdo, $rawToken) {
    if (!$rawToken) {
        return null;
    }
    $tokenHash = hash('sha256', $rawToken);
    $stmt = $pdo->prepare(
        'SELECT * FROM auth_refresh_tokens
         WHERE token_hash = ?
           AND revoked_at IS NULL
           AND expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$tokenHash]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function issue_auth_tokens($pdo, $user) {
    return [
        'token' => create_auth_token($user),
        'accessToken' => create_auth_token($user),
        'refreshToken' => create_refresh_token($pdo, (int) $user['id'])
    ];
}

function rotate_auth_tokens($pdo, $refreshToken) {
    $row = get_valid_refresh_token_row($pdo, $refreshToken);
    if (!$row) {
        return null;
    }

    $userStmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $userStmt->execute([(int) $row['user_id']]);
    $user = $userStmt->fetch();
    if (!$user) {
        return null;
    }

    revoke_refresh_token($pdo, $refreshToken);
    $tokens = issue_auth_tokens($pdo, $user);
    $tokens['user'] = normalize_user($user);
    return $tokens;
}

function get_authenticated_user($pdo) {
    $token = get_bearer_token();
    if (!$token) {
        return null;
    }

    $payload = decode_auth_token($token);
    if (!$payload || empty($payload['id'])) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $payload['id']]);
    $user = $stmt->fetch();

    return $user ?: null;
}

function ensure_authenticated($pdo) {
    $user = get_authenticated_user($pdo);
    if (!$user) {
        json_error('Unauthorized', null, 401);
    }

    return $user;
}

function ensure_roles($user, $allowedRoles) {
    if (!is_array($allowedRoles)) {
        $allowedRoles = [$allowedRoles];
    }

    if (!in_array($user['role'], $allowedRoles, true)) {
        json_error('Forbidden', null, 403);
    }
}

function default_permissions_for_role($role) {
    $role = (string) $role;

    $studentPermissions = [
        'course.view',
        'course.enroll',
        'course.wishlist.manage',
        'course.review.create',
        'progress.update',
        'discussion.create',
        'quiz.attempt',
        'assignment.submit',
        'notification.view',
        'certificate.view'
    ];

    $instructorPermissions = [
        'course.view',
        'course.manage.own',
        'course.content.manage.own',
        'course.wishlist.manage',
        'student.progress.view.own',
        'review.moderate.own',
        'analytics.view.own',
        'discussion.create',
        'quiz.manage.own',
        'assignment.manage.own',
        'notification.view',
        'certificate.view'
    ];

    if ($role === 'student') {
        return $studentPermissions;
    }
    if ($role === 'instructor') {
        return $instructorPermissions;
    }
    if ($role === 'admin') {
        return ['*'];
    }

    return [];
}

function has_default_permission($role, $permissionKey) {
    $defaults = default_permissions_for_role($role);
    if (in_array('*', $defaults, true)) {
        return true;
    }
    return in_array((string) $permissionKey, $defaults, true);
}

function has_permission($pdo, $user, $permissionKey) {
    if (!$user || empty($user['role']) || !$permissionKey) {
        return false;
    }

    $role = (string) $user['role'];
    if ($role === 'admin') {
        return true;
    }

    if (!table_exists($pdo, 'role_permissions')) {
        // Backward-compatible fallback if table is missing.
        return has_default_permission($role, $permissionKey);
    }

    $stmt = $pdo->prepare(
        'SELECT 1
         FROM role_permissions
         WHERE role = ?
           AND (permission_key = ? OR permission_key = ?)
         LIMIT 1'
    );
    $stmt->execute([$role, $permissionKey, '*']);
    if ((bool) $stmt->fetchColumn()) {
        return true;
    }

    // Backward compatibility: if role_permissions table exists but seed data is incomplete,
    // use in-code defaults to prevent core flows from breaking.
    return has_default_permission($role, $permissionKey);
}

function ensure_permission($pdo, $user, $permissionKey, $statusCode = 403) {
    if (!has_permission($pdo, $user, $permissionKey)) {
        json_error('Forbidden: missing permission ' . $permissionKey, null, $statusCode);
    }
}

function sanitize($value) {
    return htmlspecialchars(trim((string) $value), ENT_QUOTES, 'UTF-8');
}

function to_int($value) {
    if ($value === null || $value === '') {
        return null;
    }
    return (int) $value;
}

function to_bool($value, $default = false) {
    if ($value === null) {
        return $default;
    }
    if (is_bool($value)) {
        return $value;
    }
    $normalized = strtolower(trim((string) $value));
    if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
        return true;
    }
    if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
        return false;
    }
    return $default;
}

function get_pagination_params($defaultLimit = 20, $maxLimit = 100) {
    $data = get_input_data();
    $page = isset($data['page']) ? max(1, (int) $data['page']) : 1;
    $limit = isset($data['limit']) ? (int) $data['limit'] : $defaultLimit;
    $limit = max(1, min($maxLimit, $limit));
    $offset = ($page - 1) * $limit;

    return [
        'page' => $page,
        'limit' => $limit,
        'offset' => $offset
    ];
}

function paginate_items($items, $total, $page, $limit) {
    return [
        'items' => $items,
        'pagination' => [
            'page' => (int) $page,
            'limit' => (int) $limit,
            'total' => (int) $total,
            'totalPages' => $limit > 0 ? (int) ceil($total / $limit) : 1
        ]
    ];
}

function normalize_user($user, $includePassword = false) {
    if (!$user) {
        return null;
    }

    $normalized = [
        'id' => (int) $user['id'],
        '_id' => (int) $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'phone' => $user['phone'] ?? null,
        'gender' => $user['gender'] ?? null,
        'bio' => $user['bio'] ?? null,
        'profile_image' => $user['profile_image'] ?? null,
        'created_at' => $user['created_at'] ?? null,
        'updated_at' => $user['updated_at'] ?? null
    ];

    if ($includePassword && isset($user['password'])) {
        $normalized['password'] = $user['password'];
    }

    return $normalized;
}

function parse_tags($tags) {
    if ($tags === null || $tags === '') {
        return [];
    }

    if (is_array($tags)) {
        return array_values(array_filter(array_map('trim', $tags), function ($tag) {
            return $tag !== '';
        }));
    }

    $decoded = json_decode($tags, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return array_values(array_filter(array_map('trim', $decoded), function ($tag) {
            return $tag !== '';
        }));
    }

    $split = explode(',', (string) $tags);
    return array_values(array_filter(array_map('trim', $split), function ($tag) {
        return $tag !== '';
    }));
}

function normalize_course($course) {
    if (!$course) {
        return null;
    }

    $tags = parse_tags($course['tags'] ?? []);

    $normalized = [
        'id' => (int) $course['id'],
        '_id' => (int) $course['id'],
        'slug' => $course['slug'],
        'name' => $course['name'],
        'title' => $course['title'] ?? null,
        'titleHighlight' => $course['title_highlight'] ?? null,
        'titleSuffix' => $course['title_suffix'] ?? null,
        'subtitle' => $course['subtitle'] ?? null,
        'description' => $course['description'] ?? null,
        'roadmap' => $course['roadmap'] ?? null,
        'youtubeUrl' => $course['youtube_url'] ?? null,
        'price' => isset($course['price']) ? (float) $course['price'] : 0,
        'originalPrice' => isset($course['original_price']) ? (float) $course['original_price'] : null,
        'batchDate' => $course['batch_date'] ?? null,
        'learnButtonText' => $course['learn_button_text'] ?? null,
        'baseAmount' => isset($course['base_amount']) ? (float) $course['base_amount'] : null,
        'platformFees' => isset($course['platform_fees']) ? (float) $course['platform_fees'] : null,
        'gst' => isset($course['gst']) ? (float) $course['gst'] : null,
        'language' => $course['language'] ?? null,
        'totalContentHours' => $course['total_content_hours'] ?? null,
        'isPublished' => isset($course['is_published']) ? (bool) $course['is_published'] : true,
        'isFeatured' => isset($course['is_featured']) ? (bool) $course['is_featured'] : false,
        'difficultyLevel' => $course['difficulty_level'] ?? 'beginner',
        'categoryId' => isset($course['category_id']) ? to_int($course['category_id']) : null,
        'introVideoUrl' => $course['intro_video_url'] ?? null,
        'image' => $course['image'] ?? null,
        'tags' => $tags,
        'created_at' => $course['created_at'] ?? null,
        'updated_at' => $course['updated_at'] ?? null
    ];

    if (isset($course['instructor_id'])) {
        $normalized['instructorId'] = (int) $course['instructor_id'];
    }

    if (isset($course['enrollment_count'])) {
        $normalized['enrollment_count'] = (int) $course['enrollment_count'];
    }

    if (isset($course['avg_rating'])) {
        $normalized['avgRating'] = (float) $course['avg_rating'];
    }

    if (isset($course['review_count'])) {
        $normalized['reviewCount'] = (int) $course['review_count'];
    }

    if (isset($course['instructor_username']) || isset($course['instructor_email'])) {
        $normalized['instructor'] = [
            '_id' => isset($course['instructor_id']) ? (int) $course['instructor_id'] : null,
            'id' => isset($course['instructor_id']) ? (int) $course['instructor_id'] : null,
            'username' => $course['instructor_username'] ?? null,
            'email' => $course['instructor_email'] ?? null
        ];
    }

    return $normalized;
}

function table_exists($pdo, $tableName, $forceRefresh = false) {
    static $cache = [];
    if (!$forceRefresh && array_key_exists($tableName, $cache)) {
        return $cache[$tableName];
    }

    try {
        if (!preg_match('/^[A-Za-z0-9_]+$/', $tableName)) {
            $cache[$tableName] = false;
            return false;
        }
        $stmt = $pdo->query("SHOW TABLES LIKE '" . $tableName . "'");
        $exists = (bool) $stmt->fetchColumn();
        $cache[$tableName] = $exists;
        return $exists;
    } catch (Throwable $e) {
        $cache[$tableName] = false;
        return false;
    }
}

function normalize_certificate($certificate, $user = null, $course = null) {
    if (!$certificate) {
        return null;
    }

    $metadata = null;
    if (!empty($certificate['metadata'])) {
        $decoded = json_decode((string) $certificate['metadata'], true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $metadata = $decoded;
        }
    }

    return [
        'id' => (int) $certificate['id'],
        '_id' => (int) $certificate['id'],
        'certificateCode' => $certificate['certificate_code'],
        'issueDate' => $certificate['issue_date'],
        'userId' => (int) $certificate['user_id'],
        'courseId' => (int) $certificate['course_id'],
        'metadata' => $metadata,
        'created_at' => $certificate['created_at'] ?? null,
        'user' => $user ? normalize_user($user) : null,
        'course' => $course ? normalize_course($course) : null
    ];
}

function get_user_course_certificate($pdo, $userId, $courseId) {
    if (!$userId || !$courseId || !table_exists($pdo, 'certificates')) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT id, user_id, course_id, certificate_code, issue_date, metadata, created_at
         FROM certificates
         WHERE user_id = ? AND course_id = ?
         LIMIT 1'
    );
    $stmt->execute([(int) $userId, (int) $courseId]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    return normalize_certificate($row);
}

function generate_certificate_code($userId, $courseId) {
    $datePart = date('Ymd');
    $randomPart = strtoupper(bin2hex(random_bytes(3)));
    return 'CERT-' . $datePart . '-' . (int) $courseId . '-' . (int) $userId . '-' . $randomPart;
}

function issue_course_certificate($pdo, $userId, $courseId, $metadata = null) {
    if (!$userId || !$courseId || !table_exists($pdo, 'certificates')) {
        return null;
    }

    $existing = get_user_course_certificate($pdo, (int) $userId, (int) $courseId);
    if ($existing) {
        return $existing;
    }

    $metadataJson = null;
    if (is_array($metadata)) {
        $metadataJson = json_encode($metadata);
    } elseif (is_string($metadata) && $metadata !== '') {
        $metadataJson = $metadata;
    }

    $insertStmt = $pdo->prepare(
        'INSERT INTO certificates (user_id, course_id, certificate_code, issue_date, metadata)
         VALUES (?, ?, ?, NOW(), ?)'
    );

    try {
        $insertStmt->execute([
            (int) $userId,
            (int) $courseId,
            generate_certificate_code((int) $userId, (int) $courseId),
            $metadataJson
        ]);
    } catch (Throwable $e) {
        // Unique-key race or duplicate issue can happen under concurrent completion updates.
        // We intentionally ignore and fetch the stored certificate below.
    }

    return get_user_course_certificate($pdo, (int) $userId, (int) $courseId);
}

function get_course_syllabus($pdo, $courseId) {
    if (!$courseId || !table_exists($pdo, 'course_syllabus')) {
        return [];
    }

    $stmt = $pdo->prepare(
        'SELECT section_title, item_text, section_order, item_order
         FROM course_syllabus
         WHERE course_id = ?
         ORDER BY section_order ASC, item_order ASC'
    );
    $stmt->execute([(int) $courseId]);
    $rows = $stmt->fetchAll();

    if (empty($rows)) {
        return [];
    }

    $sections = [];
    foreach ($rows as $row) {
        $sectionKey = (string) $row['section_order'] . '::' . $row['section_title'];
        if (!isset($sections[$sectionKey])) {
            $sections[$sectionKey] = [
                'title' => $row['section_title'],
                'items' => []
            ];
        }
        if (!empty($row['item_text'])) {
            $sections[$sectionKey]['items'][] = $row['item_text'];
        }
    }

    return array_values($sections);
}

function get_course_modules($pdo, $courseId, $onlyPublished = true) {
    if (!$courseId || !table_exists($pdo, 'course_modules')) {
        return [];
    }

    $sql = 'SELECT * FROM course_modules WHERE course_id = ?';
    if ($onlyPublished) {
        $sql .= ' AND is_published = 1';
    }
    $sql .= ' ORDER BY sort_order ASC, id ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([(int) $courseId]);
    $modules = $stmt->fetchAll();
    if (!$modules) {
        return [];
    }

    $moduleIds = array_map(function ($module) {
        return (int) $module['id'];
    }, $modules);

    $lessons = [];
    if (table_exists($pdo, 'course_lessons') && !empty($moduleIds)) {
        $placeholders = implode(',', array_fill(0, count($moduleIds), '?'));
        $lessonSql = 'SELECT * FROM course_lessons WHERE module_id IN (' . $placeholders . ')';
        if ($onlyPublished) {
            $lessonSql .= ' AND is_published = 1';
        }
        $lessonSql .= ' ORDER BY sort_order ASC, id ASC';
        $lessonStmt = $pdo->prepare($lessonSql);
        $lessonStmt->execute($moduleIds);
        $lessonRows = $lessonStmt->fetchAll();
        foreach ($lessonRows as $lesson) {
            $lessons[(int) $lesson['module_id']][] = [
                'id' => (int) $lesson['id'],
                '_id' => (int) $lesson['id'],
                'title' => $lesson['title'],
                'lessonType' => $lesson['lesson_type'],
                'content' => $lesson['content'],
                'videoUrl' => $lesson['video_url'],
                'durationMinutes' => isset($lesson['duration_minutes']) ? (int) $lesson['duration_minutes'] : null,
                'isPreview' => (bool) $lesson['is_preview'],
                'isPublished' => (bool) $lesson['is_published'],
                'sortOrder' => (int) $lesson['sort_order'],
                'created_at' => $lesson['created_at'],
                'updated_at' => $lesson['updated_at']
            ];
        }
    }

    return array_map(function ($module) use ($lessons) {
        $moduleId = (int) $module['id'];
        return [
            'id' => $moduleId,
            '_id' => $moduleId,
            'title' => $module['title'],
            'description' => $module['description'],
            'sortOrder' => (int) $module['sort_order'],
            'isPublished' => (bool) $module['is_published'],
            'lessons' => $lessons[$moduleId] ?? [],
            'created_at' => $module['created_at'],
            'updated_at' => $module['updated_at']
        ];
    }, $modules);
}

function get_course_owner_id($pdo, $courseId) {
    $stmt = $pdo->prepare('SELECT instructor_id FROM courses WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $courseId]);
    $ownerId = $stmt->fetchColumn();
    return $ownerId !== false ? (int) $ownerId : null;
}

function ensure_course_manage_access($pdo, $user, $courseId) {
    if (!$user) {
        json_error('Unauthorized', null, 401);
    }

    if ((string) $user['role'] === 'admin') {
        return;
    }

    if (!has_permission($pdo, $user, 'course.manage.own') && !has_permission($pdo, $user, 'course.content.manage.own')) {
        json_error('Forbidden', null, 403);
    }

    $ownerId = get_course_owner_id($pdo, $courseId);
    if (!$ownerId) {
        json_error('Course not found', null, 404);
    }

    if ((int) $ownerId !== (int) $user['id']) {
        json_error('Forbidden: not your course', null, 403);
    }
}

function attach_course_syllabus($pdo, $course) {
    if (!$course || empty($course['id'])) {
        return $course;
    }

    $course['syllabus'] = get_course_syllabus($pdo, (int) $course['id']);
    $course['modules'] = get_course_modules($pdo, (int) $course['id']);
    return $course;
}

