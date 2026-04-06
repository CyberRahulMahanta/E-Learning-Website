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
if (!$targetUserId || $targetUserId <= 0) {
    $targetUserId = (int) $authUser['id'];
}

$whereSql = $isAdmin && (!isset($_GET['userId']) && !isset($_GET['user_id'])) ? '' : 'WHERE o.user_id = ?';
$params = [];
if ($whereSql !== '') {
    $params[] = $targetUserId;
}

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM payment_orders o ' . $whereSql);
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$sql = 'SELECT o.*, c.slug AS course_slug, c.name AS course_name
        FROM payment_orders o
        JOIN courses c ON c.id = o.course_id
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
    return [
        'id' => (int) $row['id'],
        '_id' => (int) $row['id'],
        'orderCode' => $row['order_code'],
        'userId' => (int) $row['user_id'],
        'courseId' => (int) $row['course_id'],
        'courseSlug' => $row['course_slug'],
        'courseName' => $row['course_name'],
        'status' => $row['status'],
        'gateway' => $row['gateway'],
        'amount' => (float) $row['amount'],
        'discount' => (float) $row['discount_amount'],
        'finalAmount' => (float) $row['final_amount'],
        'currency' => $row['currency'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'paidAt' => $row['paid_at']
    ];
}, $rows);

json_success([
    'orders' => $orders,
    'pagination' => paginate_items([], $total, $pagination['page'], $pagination['limit'])['pagination']
], 'Orders fetched');

