<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'payment_orders')) {
    json_error('Payment system unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);
$orderId = to_int($_GET['id'] ?? null);
if (!$orderId || $orderId <= 0) {
    json_error('Valid order id required', null, 422);
}

$orderStmt = $pdo->prepare('SELECT * FROM payment_orders WHERE id = ? LIMIT 1');
$orderStmt->execute([$orderId]);
$order = $orderStmt->fetch();
if (!$order) {
    json_error('Order not found', null, 404);
}

if ((string) $authUser['role'] !== 'admin' && (int) $order['user_id'] !== (int) $authUser['id']) {
    json_error('Forbidden', null, 403);
}

$data = get_input_data();
$status = strtolower(sanitize($data['status'] ?? 'paid'));
$gatewayOrderId = sanitize($data['gatewayOrderId'] ?? $data['gateway_order_id'] ?? '');
$gatewayPaymentId = sanitize($data['gatewayPaymentId'] ?? $data['gateway_payment_id'] ?? '');
$gatewaySignature = sanitize($data['gatewaySignature'] ?? $data['gateway_signature'] ?? '');

$allowedStatuses = ['paid', 'failed', 'cancelled', 'pending', 'refunded'];
if (!in_array($status, $allowedStatuses, true)) {
    json_error('Invalid status', null, 422);
}

$existingMetadata = [];
if (!empty($order['metadata'])) {
    $decodedMetadata = json_decode((string) $order['metadata'], true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedMetadata)) {
        $existingMetadata = $decodedMetadata;
    }
}

$effectiveGatewayOrderId = $gatewayOrderId !== '' ? $gatewayOrderId : (string) ($order['gateway_order_id'] ?? '');
$effectiveGatewayPaymentId = $gatewayPaymentId !== '' ? $gatewayPaymentId : (string) ($order['gateway_payment_id'] ?? '');
$wasAlreadyPaid = (string) ($order['status'] ?? '') === 'paid';

if ((string) ($order['gateway'] ?? '') === 'razorpay' && $status === 'paid') {
    if (RAZORPAY_KEY_SECRET === '') {
        json_error('Razorpay signature verification is not configured', null, 500);
    }

    if ($effectiveGatewayOrderId === '' || $effectiveGatewayPaymentId === '' || $gatewaySignature === '') {
        json_error('Missing Razorpay verification fields', null, 422);
    }

    if (!empty($order['gateway_order_id']) && (string) $order['gateway_order_id'] !== $effectiveGatewayOrderId) {
        json_error('Gateway order mismatch', null, 409);
    }

    $expectedSignature = hash_hmac('sha256', $effectiveGatewayOrderId . '|' . $effectiveGatewayPaymentId, RAZORPAY_KEY_SECRET);
    if (!hash_equals($expectedSignature, $gatewaySignature)) {
        $existingMetadata['verification'] = [
            'gateway' => 'razorpay',
            'verified' => false,
            'verifiedAt' => date('c'),
            'reason' => 'signature_mismatch'
        ];

        $failedMetaStmt = $pdo->prepare(
            'UPDATE payment_orders
             SET metadata = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?'
        );
        $failedMetaStmt->execute([json_encode($existingMetadata, JSON_UNESCAPED_SLASHES), $orderId]);
        json_error('Invalid Razorpay signature', null, 400);
    }

    $existingMetadata['verification'] = [
        'gateway' => 'razorpay',
        'verified' => true,
        'verifiedAt' => date('c'),
        'signature' => $gatewaySignature
    ];
}

$existingMetadata['confirmPayload'] = [
    'status' => $status,
    'gatewayOrderId' => $effectiveGatewayOrderId !== '' ? $effectiveGatewayOrderId : null,
    'gatewayPaymentId' => $effectiveGatewayPaymentId !== '' ? $effectiveGatewayPaymentId : null,
    'receivedAt' => date('c')
];

$updateStmt = $pdo->prepare(
    'UPDATE payment_orders
     SET status = ?, gateway_order_id = ?, gateway_payment_id = ?, metadata = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?'
);
$paidAt = $status === 'paid' ? ($order['paid_at'] ?: date('Y-m-d H:i:s')) : null;
$updateStmt->execute([
    $status,
    $effectiveGatewayOrderId !== '' ? $effectiveGatewayOrderId : null,
    $effectiveGatewayPaymentId !== '' ? $effectiveGatewayPaymentId : null,
    json_encode($existingMetadata, JSON_UNESCAPED_SLASHES),
    $paidAt,
    $orderId
]);

$enrollmentCreated = false;
if ($status === 'paid' && !$wasAlreadyPaid) {
    $existsStmt = $pdo->prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
    $existsStmt->execute([(int) $order['user_id'], (int) $order['course_id']]);
    $enrollment = $existsStmt->fetch();
    if (!$enrollment) {
        $enrollStmt = $pdo->prepare(
            'INSERT INTO enrollments (user_id, course_id, payment_method, transaction_id, status)
             VALUES (?, ?, ?, ?, "active")'
        );
        $enrollStmt->execute([
            (int) $order['user_id'],
            (int) $order['course_id'],
            $order['gateway'] ?: 'manual',
            $effectiveGatewayPaymentId !== '' ? $effectiveGatewayPaymentId : ($order['order_code'] ?? null)
        ]);
        $enrollmentCreated = true;
    }

    if ($order['coupon_id'] !== null && table_exists($pdo, 'payment_coupons')) {
        $couponId = (int) $order['coupon_id'];
        $couponIncStmt = $pdo->prepare('UPDATE payment_coupons SET used_count = used_count + 1 WHERE id = ?');
        $couponIncStmt->execute([$couponId]);

        if (table_exists($pdo, 'coupon_redemptions')) {
            $redemptionStmt = $pdo->prepare(
                'INSERT IGNORE INTO coupon_redemptions (coupon_id, user_id, order_id, discount_amount)
                 VALUES (?, ?, ?, ?)'
            );
            $redemptionStmt->execute([
                $couponId,
                (int) $order['user_id'],
                $orderId,
                (float) $order['discount_amount']
            ]);
        }
    }

    if (table_exists($pdo, 'user_notifications')) {
        $notificationStmt = $pdo->prepare(
            'INSERT INTO user_notifications (user_id, type, title, message, data, is_read)
             VALUES (?, ?, ?, ?, ?, 0)'
        );
        $notificationStmt->execute([
            (int) $order['user_id'],
            'payment_success',
            'Payment Successful',
            'Your payment is confirmed and enrollment is active.',
            json_encode([
                'orderId' => $orderId,
                'courseId' => (int) $order['course_id']
            ], JSON_UNESCAPED_SLASHES)
        ]);
    }
}

$orderStmt->execute([$orderId]);
$updatedOrder = $orderStmt->fetch();

json_success([
    'order' => [
        'id' => (int) $updatedOrder['id'],
        '_id' => (int) $updatedOrder['id'],
        'orderCode' => $updatedOrder['order_code'],
        'status' => $updatedOrder['status'],
        'courseId' => (int) $updatedOrder['course_id'],
        'amount' => (float) $updatedOrder['amount'],
        'discount' => (float) $updatedOrder['discount_amount'],
        'finalAmount' => (float) $updatedOrder['final_amount'],
        'currency' => $updatedOrder['currency'],
        'gateway' => $updatedOrder['gateway'],
        'gatewayOrderId' => $updatedOrder['gateway_order_id'],
        'gatewayPaymentId' => $updatedOrder['gateway_payment_id'],
        'paidAt' => $updatedOrder['paid_at'],
        'metadata' => !empty($updatedOrder['metadata']) ? json_decode($updatedOrder['metadata'], true) : null
    ],
    'enrollmentCreated' => $enrollmentCreated
], 'Order updated');
