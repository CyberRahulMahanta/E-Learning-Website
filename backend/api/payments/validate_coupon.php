<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'payment_coupons')) {
    json_error('Coupon system unavailable. Run migrations.', null, 500);
}

$data = get_input_data();
$code = strtoupper(sanitize($data['code'] ?? ''));
$amount = isset($data['amount']) ? (float) $data['amount'] : 0.0;

if ($code === '') {
    json_error('Coupon code required', null, 422);
}
if ($amount <= 0) {
    json_error('Amount must be greater than zero', null, 422);
}

$stmt = $pdo->prepare(
    'SELECT *
     FROM payment_coupons
     WHERE code = ?
       AND is_active = 1
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
       AND (usage_limit IS NULL OR used_count < usage_limit)
     LIMIT 1'
);
$stmt->execute([$code]);
$coupon = $stmt->fetch();
if (!$coupon) {
    json_error('Invalid or expired coupon', null, 404);
}

if ($amount < (float) $coupon['min_order_amount']) {
    json_error('Minimum order amount is ' . (float) $coupon['min_order_amount'], null, 422);
}

$discount = 0.0;
if ($coupon['discount_type'] === 'percent') {
    $discount = ($amount * (float) $coupon['discount_value']) / 100.0;
    if ($coupon['max_discount'] !== null) {
        $discount = min($discount, (float) $coupon['max_discount']);
    }
} else {
    $discount = (float) $coupon['discount_value'];
}
$discount = max(0.0, min($discount, $amount));
$finalAmount = max(0.0, $amount - $discount);

json_success([
    'coupon' => [
        'id' => (int) $coupon['id'],
        'code' => $coupon['code'],
        'title' => $coupon['title'],
        'discountType' => $coupon['discount_type'],
        'discountValue' => (float) $coupon['discount_value'],
        'maxDiscount' => $coupon['max_discount'] !== null ? (float) $coupon['max_discount'] : null
    ],
    'amount' => round($amount, 2),
    'discount' => round($discount, 2),
    'finalAmount' => round($finalAmount, 2)
], 'Coupon validated');

