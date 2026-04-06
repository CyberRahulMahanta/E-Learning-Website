<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$data = get_input_data();
$pagination = get_pagination_params(20, 100);

$search = trim((string) ($data['search'] ?? ''));
$categoryId = to_int($data['categoryId'] ?? $data['category_id'] ?? null);
$difficulty = sanitize($data['difficulty'] ?? '');
$isFeaturedFilter = isset($data['featured']) ? to_bool($data['featured'], false) : null;
$publishedRaw = $data['published'] ?? null;
if ($publishedRaw !== null && strtolower(trim((string) $publishedRaw)) === 'all') {
    $isPublishedFilter = null;
} else {
    $isPublishedFilter = isset($data['published']) ? to_bool($data['published'], true) : true;
}
$minPrice = isset($data['minPrice']) ? (float) $data['minPrice'] : null;
$maxPrice = isset($data['maxPrice']) ? (float) $data['maxPrice'] : null;
$sortBy = sanitize($data['sortBy'] ?? 'newest');

$where = [];
$params = [];

if ($isPublishedFilter !== null) {
    $where[] = 'c.is_published = ?';
    $params[] = $isPublishedFilter ? 1 : 0;
}

if ($search !== '') {
    $where[] = '(c.name LIKE ? OR c.title LIKE ? OR c.description LIKE ?)';
    $like = '%' . $search . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}

if ($categoryId !== null && $categoryId > 0) {
    $where[] = 'c.category_id = ?';
    $params[] = $categoryId;
}

if ($difficulty !== '' && in_array($difficulty, ['beginner', 'intermediate', 'advanced'], true)) {
    $where[] = 'c.difficulty_level = ?';
    $params[] = $difficulty;
}

if ($isFeaturedFilter !== null) {
    $where[] = 'c.is_featured = ?';
    $params[] = $isFeaturedFilter ? 1 : 0;
}

if ($minPrice !== null) {
    $where[] = 'c.price >= ?';
    $params[] = $minPrice;
}

if ($maxPrice !== null) {
    $where[] = 'c.price <= ?';
    $params[] = $maxPrice;
}

$whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

$sortMap = [
    'newest' => 'c.created_at DESC',
    'oldest' => 'c.created_at ASC',
    'price_asc' => 'c.price ASC',
    'price_desc' => 'c.price DESC',
    'rating_desc' => 'avg_rating DESC',
    'popular' => 'enrollment_count DESC'
];
$orderBy = $sortMap[$sortBy] ?? $sortMap['newest'];

$countSql = 'SELECT COUNT(*) FROM courses c ' . $whereSql;
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$hasReviews = table_exists($pdo, 'course_reviews');

$reviewsJoin = $hasReviews
    ? 'LEFT JOIN (
            SELECT course_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
            FROM course_reviews
            WHERE is_published = 1
            GROUP BY course_id
        ) rv ON rv.course_id = c.id'
    : 'LEFT JOIN (SELECT NULL AS course_id, 0 AS avg_rating, 0 AS review_count) rv ON rv.course_id = c.id';

$sql = 'SELECT c.*, u.username AS instructor_username, u.email AS instructor_email,
               COALESCE(rv.avg_rating, 0) AS avg_rating,
               COALESCE(rv.review_count, 0) AS review_count,
               COALESCE(en.enrollment_count, 0) AS enrollment_count
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        ' . $reviewsJoin . '
        LEFT JOIN (
            SELECT course_id, COUNT(*) AS enrollment_count
            FROM enrollments
            GROUP BY course_id
        ) en ON en.course_id = c.id
        ' . $whereSql . '
        ORDER BY ' . $orderBy . '
        LIMIT ? OFFSET ?';

$stmt = $pdo->prepare($sql);
$executeParams = $params;
$executeParams[] = $pagination['limit'];
$executeParams[] = $pagination['offset'];
$stmt->execute($executeParams);
$rows = $stmt->fetchAll();

$courses = array_map('normalize_course', $rows);

json_success([
    'courses' => $courses,
    'pagination' => paginate_items([], $total, $pagination['page'], $pagination['limit'])['pagination']
], 'Courses fetched');
