<?php
require_once __DIR__ . '/../../core/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed', null, 405);
}

$instructorId = (int) ($_GET['id'] ?? $_GET['instructorId'] ?? 0);
if ($instructorId <= 0) {
    json_error('Instructor id required', null, 422);
}

$stmt = $pdo->prepare(
    'SELECT c.*, u.username AS instructor_username, u.email AS instructor_email,
            COUNT(e.id) AS enrollment_count
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE c.instructor_id = ?
     GROUP BY c.id
     ORDER BY c.created_at DESC'
);
$stmt->execute([$instructorId]);
$rows = $stmt->fetchAll();

$courses = array_map('normalize_course', $rows);

json_success(['courses' => $courses], 'Instructor courses fetched');
