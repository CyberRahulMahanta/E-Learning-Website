<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

if (!table_exists($pdo, 'course_wishlist')) {
    json_success(['wishlist' => []], 'Wishlist fetched');
}

$authUser = ensure_authenticated($pdo);
ensure_permission($pdo, $authUser, 'course.wishlist.manage');

$pagination = get_pagination_params(20, 100);

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM course_wishlist WHERE user_id = ?');
$countStmt->execute([(int) $authUser['id']]);
$total = (int) $countStmt->fetchColumn();

$stmt = $pdo->prepare(
    'SELECT w.id AS wishlist_id, w.created_at AS wishlisted_at,
            c.*, u.username AS instructor_username, u.email AS instructor_email
     FROM course_wishlist w
     JOIN courses c ON c.id = w.course_id
     JOIN users u ON u.id = c.instructor_id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC
     LIMIT ? OFFSET ?'
);
$stmt->execute([
    (int) $authUser['id'],
    $pagination['limit'],
    $pagination['offset']
]);
$rows = $stmt->fetchAll();

$wishlist = array_map(function ($row) {
    return [
        'id' => (int) $row['wishlist_id'],
        '_id' => (int) $row['wishlist_id'],
        'wishlistedAt' => $row['wishlisted_at'],
        'course' => normalize_course($row)
    ];
}, $rows);

json_success([
    'wishlist' => $wishlist,
    'pagination' => paginate_items([], $total, $pagination['page'], $pagination['limit'])['pagination']
], 'Wishlist fetched');

