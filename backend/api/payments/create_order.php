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
$gateway = sanitize($data['gateway'] ?? 'manual');
$currency = strtoupper(sanitize($data['currency'] ?? 'INR'));
if ($currency === '') {
    $currency = 'INR';
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

$orderStmt = $pdo->prepare(
    'INSERT INTO payment_orders
     (order_code, user_id, course_id, coupon_id, status, gateway, amount, discount_amount, final_amount, currency, metadata)
     VALUES (?, ?, ?, ?, "created", ?, ?, ?, ?, ?, ?)'
);
$metadata = json_encode([
    'courseSlug' => $course['slug'],
    'client' => 'web'
], JSON_UNESCAPED_SLASHES);
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
        'gateway' => $gateway !== '' ? $gateway : 'manual'
    ],
    'coupon' => $couponData
], 'Order created', 201);

