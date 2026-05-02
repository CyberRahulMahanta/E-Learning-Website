<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'payment_orders')) {
    json_success(['orders' => []], 'Orders fetched');
}

$authUser = ensure_authenticated($pdo);
$pagination = get_pagination_params(20, 100);

$isAdmin = (string) $authUser['role'] === 'admin';
$targetUserId = $isAdmin ? to_int($_GET['userId'] ?? $_GET['user_id'] ?? null) : (int) $authUser['id'];

$whereClauses = [];
$params = [];

if (!$isAdmin) {
    $whereClauses[] = 'o.user_id = ?';
    $params[] = (int) $authUser['id'];
} elseif ($targetUserId && $targetUserId > 0) {
    $whereClauses[] = 'o.user_id = ?';
    $params[] = $targetUserId;
}

$status = strtolower(sanitize($_GET['status'] ?? ''));
$allowedStatuses = ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'];
if ($status !== '') {
    if (!in_array($status, $allowedStatuses, true)) {
        json_error('Invalid order status filter', null, 422);
    }
    $whereClauses[] = 'o.status = ?';
    $params[] = $status;
}

$gateway = strtolower(sanitize($_GET['gateway'] ?? ''));
if ($gateway !== '') {
    $whereClauses[] = 'LOWER(o.gateway) = ?';
    $params[] = $gateway;
}

$search = trim((string) ($_GET['search'] ?? ''));
if ($search !== '') {
    $whereClauses[] = '(o.order_code LIKE ? OR c.name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
    $searchLike = '%' . $search . '%';
    $params[] = $searchLike;
    $params[] = $searchLike;
    $params[] = $searchLike;
    $params[] = $searchLike;
}

$whereSql = '';
if (!empty($whereClauses)) {
    $whereSql = 'WHERE ' . implode(' AND ', $whereClauses);
}

$countSql = 'SELECT COUNT(*)
             FROM payment_orders o
             JOIN courses c ON c.id = o.course_id
             JOIN users u ON u.id = o.user_id
             ' . $whereSql;
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$sql = 'SELECT o.*, c.slug AS course_slug, c.name AS course_name,
               u.username AS user_name, u.email AS user_email, u.role AS user_role
        FROM payment_orders o
        JOIN courses c ON c.id = o.course_id
        JOIN users u ON u.id = o.user_id
        ' . $whereSql . '
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?';
$stmt = $pdo->prepare($sql);
$queryParams = $params;
$queryParams[] = $pagination['limit'];
$queryParams[] = $pagination['offset'];
$stmt->execute($queryParams);
$rows = $stmt->fetchAll();

$orders = array_map(function ($row) {
    $metadata = null;
    if (!empty($row['metadata'])) {
        $decoded = json_decode((string) $row['metadata'], true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $metadata = $decoded;
        }
    }

    return [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'orderCode' => $row['order_code'],
        'userId' => (int) $row['user_id'],
        'user' => [
            'id' => (int) $row['user_id'],
            '_id' => (int) $row['user_id'],
            'username' => $row['user_name'],
            'email' => $row['user_email'],
            'role' => $row['user_role']
        ],
        'courseId' => (int) $row['course_id'],
        'courseSlug' => $row['course_slug'],
        'courseName' => $row['course_name'],
        'couponId' => $row['coupon_id'] !== null ? (int) $row['coupon_id'] : null,
        'status' => $row['status'],
        'gateway' => $row['gateway'],
        'gatewayOrderId' => $row['gateway_order_id'],
        'gatewayPaymentId' => $row['gateway_payment_id'],
        'amount' => (float) $row['amount'],
        'discount' => (float) $row['discount_amount'],
        'finalAmount' => (float) $row['final_amount'],
        'currency' => $row['currency'],
        'metadata' => $metadata,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'paidAt' => $row['paid_at']
    ];
}, $rows);

json_success([
    'orders' => $orders,
    'pagination' => paginate_items([], $total, $pagination['page'], $pagination['limit'])['pagination']
], 'Orders fetched');
