<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'payment_orders')) {
    json_error('Payment system unavailable. Run migrations.', null, 500);
}

$authUser = ensure_authenticated($pdo);

$data = get_input_data();
$courseInput = sanitize($data['courseId'] ?? $data['course_id'] ?? $data['courseSlug'] ?? $data['course_slug'] ?? '');
$couponCode = strtoupper(sanitize($data['couponCode'] ?? $data['coupon_code'] ?? ''));
$gateway = strtolower(sanitize($data['gateway'] ?? 'manual'));
$currency = strtoupper(sanitize($data['currency'] ?? 'INR'));
if ($currency === '') {
    $currency = 'INR';
}
$allowedGateways = ['manual', 'razorpay'];
if (!in_array($gateway, $allowedGateways, true)) {
    json_error('Unsupported payment gateway', null, 422);
}

if ($gateway === 'razorpay') {
    if (!function_exists('curl_init')) {
        json_error('cURL extension is required for Razorpay integration', null, 500);
    }
    if (RAZORPAY_KEY_ID === '' || RAZORPAY_KEY_SECRET === '') {
        json_error('Razorpay is not configured on server', null, 500);
    }
}

if ($courseInput === '') {
    json_error('Course id or slug is required', null, 422);
}

$courseStmt = $pdo->prepare('SELECT * FROM courses WHERE id = ? OR slug = ? LIMIT 1');
$courseStmt->execute([(int) $courseInput, $courseInput]);
$course = $courseStmt->fetch();
if (!$course) {
    json_error('Course not found', null, 404);
}
$courseId = (int) $course['id'];
$amount = (float) $course['price'];

$enrollmentStmt = $pdo->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1');
$enrollmentStmt->execute([(int) $authUser['id'], $courseId]);
if ($enrollmentStmt->fetchColumn()) {
    json_error('You are already enrolled in this course', null, 409);
}

$discount = 0.0;
$couponId = null;
$couponData = null;

if ($couponCode !== '') {
    if (!table_exists($pdo, 'payment_coupons')) {
        json_error('Coupon system unavailable', null, 500);
    }
    $couponStmt = $pdo->prepare(
        'SELECT *
         FROM payment_coupons
         WHERE code = ?
           AND is_active = 1
           AND (starts_at IS NULL OR starts_at <= NOW())
           AND (ends_at IS NULL OR ends_at >= NOW())
           AND (usage_limit IS NULL OR used_count < usage_limit)
         LIMIT 1'
    );
    $couponStmt->execute([$couponCode]);
    $coupon = $couponStmt->fetch();
    if (!$coupon) {
        json_error('Invalid or expired coupon', null, 404);
    }
    if ($amount < (float) $coupon['min_order_amount']) {
        json_error('Minimum order amount for this coupon is ' . (float) $coupon['min_order_amount'], null, 422);
    }

    if ($coupon['discount_type'] === 'percent') {
        $discount = ($amount * (float) $coupon['discount_value']) / 100.0;
        if ($coupon['max_discount'] !== null) {
            $discount = min($discount, (float) $coupon['max_discount']);
        }
    } else {
        $discount = (float) $coupon['discount_value'];
    }

    $discount = max(0.0, min($discount, $amount));
    $couponId = (int) $coupon['id'];
    $couponData = [
        'id' => (int) $coupon['id'],
        'code' => $coupon['code'],
        'title' => $coupon['title'],
        'discountType' => $coupon['discount_type'],
        'discountValue' => (float) $coupon['discount_value']
    ];
}

$finalAmount = max(0.0, $amount - $discount);
$orderCode = 'ORD-' . date('YmdHis') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
$baseMetadata = [
    'courseSlug' => $course['slug'],
    'client' => 'web',
    'createdVia' => 'payment_order_api',
    'initiatedAt' => date('c')
];

$orderStmt = $pdo->prepare(
    'INSERT INTO payment_orders
     (order_code, user_id, course_id, coupon_id, status, gateway, amount, discount_amount, final_amount, currency, metadata)
     VALUES (?, ?, ?, ?, "created", ?, ?, ?, ?, ?, ?)'
);
$metadata = json_encode($baseMetadata, JSON_UNESCAPED_SLASHES);
$orderStmt->execute([
    $orderCode,
    (int) $authUser['id'],
    $courseId,
    $couponId,
    $gateway !== '' ? $gateway : 'manual',
    $amount,
    $discount,
    $finalAmount,
    $currency,
    $metadata
]);

$orderId = (int) $pdo->lastInsertId();
$gatewayOrderId = null;
$razorpayPayload = null;

if ($gateway === 'razorpay') {
    if ($finalAmount <= 0) {
        json_error('Final amount must be greater than 0 for Razorpay', null, 422);
    }

    $amountPaise = (int) round($finalAmount * 100);
    $receipt = substr($orderCode, 0, 40);

    $requestPayload = [
        'amount' => $amountPaise,
        'currency' => $currency,
        'receipt' => $receipt,
        'notes' => [
            'local_order_id' => (string) $orderId,
            'local_order_code' => $orderCode,
            'course_id' => (string) $courseId,
            'user_id' => (string) ((int) $authUser['id'])
        ]
    ];

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_USERPWD => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($requestPayload),
        CURLOPT_TIMEOUT => 30
    ]);

    $responseRaw = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($responseRaw === false || $curlError !== '') {
        $errorMetadata = $baseMetadata;
        $errorMetadata['gatewayError'] = [
            'message' => 'Failed to connect Razorpay',
            'details' => $curlError
        ];

        $metaStmt = $pdo->prepare('UPDATE payment_orders SET metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $metaStmt->execute([json_encode($errorMetadata, JSON_UNESCAPED_SLASHES), $orderId]);
        json_error('Unable to create Razorpay order', null, 502);
    }

    $responseData = json_decode($responseRaw, true);
    if ($httpCode >= 400 || !is_array($responseData) || empty($responseData['id'])) {
        $gatewayErrorMessage = is_array($responseData) && isset($responseData['error']['description'])
            ? (string) $responseData['error']['description']
            : 'Razorpay order creation failed';

        $errorMetadata = $baseMetadata;
        $errorMetadata['gatewayError'] = [
            'message' => $gatewayErrorMessage,
            'httpCode' => $httpCode,
            'response' => $responseData
        ];

        $metaStmt = $pdo->prepare('UPDATE payment_orders SET metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $metaStmt->execute([json_encode($errorMetadata, JSON_UNESCAPED_SLASHES), $orderId]);
        json_error($gatewayErrorMessage, null, 502);
    }

    $gatewayOrderId = (string) $responseData['id'];
    $razorpayPayload = [
        'keyId' => RAZORPAY_KEY_ID,
        'orderId' => $gatewayOrderId,
        'amountPaise' => $amountPaise,
        'currency' => $currency,
        'name' => RAZORPAY_CHECKOUT_NAME,
        'description' => RAZORPAY_CHECKOUT_DESCRIPTION,
        'prefill' => [
            'name' => (string) ($authUser['username'] ?? ''),
            'email' => (string) ($authUser['email'] ?? ''),
            'contact' => (string) ($authUser['phone'] ?? '')
        ]
    ];

    $gatewayMetadata = $baseMetadata;
    $gatewayMetadata['razorpay'] = [
        'request' => $requestPayload,
        'response' => [
            'id' => $responseData['id'],
            'entity' => $responseData['entity'] ?? null,
            'amount' => $responseData['amount'] ?? null,
            'currency' => $responseData['currency'] ?? null,
            'status' => $responseData['status'] ?? null,
            'receipt' => $responseData['receipt'] ?? null
        ]
    ];

    $gatewayUpdateStmt = $pdo->prepare(
        'UPDATE payment_orders
         SET gateway_order_id = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?'
    );
    $gatewayUpdateStmt->execute([
        $gatewayOrderId,
        json_encode($gatewayMetadata, JSON_UNESCAPED_SLASHES),
        $orderId
    ]);
}

json_success([
    'order' => [
        'id' => $orderId,
        '_id' => $orderId,
        'orderCode' => $orderCode,
        'courseId' => $courseId,
        'amount' => round($amount, 2),
        'discount' => round($discount, 2),
        'finalAmount' => round($finalAmount, 2),
        'currency' => $currency,
        'status' => 'created',
        'gateway' => $gateway !== '' ? $gateway : 'manual',
        'gatewayOrderId' => $gatewayOrderId
    ],
    'coupon' => $couponData,
    'razorpay' => $razorpayPayload
], 'Order created', 201);
