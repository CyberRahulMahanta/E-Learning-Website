<?php
require_once __DIR__ . '/core/cors.php';
require_once __DIR__ . '/core/response.php';

$path = isset($_GET['path']) ? trim((string) $_GET['path'], '/') : '';

if ($path === '') {
    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $path = trim((string) preg_replace('#^/?backend/api/?#', '', $requestPath), '/');
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$routes = [
    ['methods' => ['POST'], 'pattern' => '#^auth/login$#', 'file' => __DIR__ . '/api/auth/login.php'],
    ['methods' => ['POST'], 'pattern' => '#^auth/refresh$#', 'file' => __DIR__ . '/api/auth/refresh.php'],
    ['methods' => ['POST'], 'pattern' => '#^auth/signup$#', 'file' => __DIR__ . '/api/auth/signup.php'],
    ['methods' => ['POST'], 'pattern' => '#^auth/register$#', 'file' => __DIR__ . '/api/auth/register.php'],
    ['methods' => ['GET'], 'pattern' => '#^auth/me$#', 'file' => __DIR__ . '/api/auth/me.php'],
    ['methods' => ['POST'], 'pattern' => '#^auth/logout$#', 'file' => __DIR__ . '/api/auth/logout.php'],

    ['methods' => ['GET'], 'pattern' => '#^courses$#', 'file' => __DIR__ . '/api/courses/list.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/get/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/courses/details.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/instructor/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/courses/instructor.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/content$#', 'file' => __DIR__ . '/api/learning/content.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/flow-status$#', 'file' => __DIR__ . '/api/courses/flow_status.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/(?P<id>[^/]+)/modules$#', 'file' => __DIR__ . '/api/learning/module_add.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/progress$#', 'file' => __DIR__ . '/api/progress/course.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/certificate$#', 'file' => __DIR__ . '/api/certificates/course.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/(?P<id>[^/]+)/wishlist$#', 'file' => __DIR__ . '/api/wishlist/toggle.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/reviews$#', 'file' => __DIR__ . '/api/reviews/list.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/(?P<id>[^/]+)/reviews$#', 'file' => __DIR__ . '/api/reviews/upsert.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/discussions$#', 'file' => __DIR__ . '/api/discussions/list.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/(?P<id>[^/]+)/discussions$#', 'file' => __DIR__ . '/api/discussions/create.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/quizzes$#', 'file' => __DIR__ . '/api/quizzes/list.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/(?P<id>[^/]+)/quizzes$#', 'file' => __DIR__ . '/api/quizzes/create.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/quiz-attempts$#', 'file' => __DIR__ . '/api/quizzes/instructor_attempts.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)/assignments$#', 'file' => __DIR__ . '/api/assignments/list.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/(?P<id>[^/]+)/assignments$#', 'file' => __DIR__ . '/api/assignments/create.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/add$#', 'file' => __DIR__ . '/api/courses/add.php'],
    ['methods' => ['PUT', 'POST'], 'pattern' => '#^courses/edit/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/courses/edit.php'],
    ['methods' => ['DELETE'], 'pattern' => '#^courses/delete/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/courses/delete.php'],
    ['methods' => ['POST'], 'pattern' => '#^courses/(?P<id>[^/]+)/enroll$#', 'file' => __DIR__ . '/api/courses/enroll.php'],
    ['methods' => ['GET'], 'pattern' => '#^courses/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/courses/details.php'],

    ['methods' => ['PUT', 'PATCH', 'POST'], 'pattern' => '#^modules/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/learning/module_edit.php'],
    ['methods' => ['DELETE'], 'pattern' => '#^modules/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/learning/module_delete.php'],
    ['methods' => ['POST'], 'pattern' => '#^modules/(?P<id>[^/]+)/lessons$#', 'file' => __DIR__ . '/api/learning/lesson_add.php'],
    ['methods' => ['PUT', 'PATCH', 'POST'], 'pattern' => '#^lessons/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/learning/lesson_edit.php'],
    ['methods' => ['DELETE'], 'pattern' => '#^lessons/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/learning/lesson_delete.php'],
    ['methods' => ['POST'], 'pattern' => '#^lessons/(?P<id>[^/]+)/progress$#', 'file' => __DIR__ . '/api/progress/update.php'],
    ['methods' => ['POST'], 'pattern' => '#^quizzes/(?P<id>[^/]+)/attempt$#', 'file' => __DIR__ . '/api/quizzes/attempt.php'],
    ['methods' => ['POST'], 'pattern' => '#^assignments/(?P<id>[^/]+)/submit$#', 'file' => __DIR__ . '/api/assignments/submit.php'],

    ['methods' => ['POST'], 'pattern' => '#^payments/coupons/validate$#', 'file' => __DIR__ . '/api/payments/validate_coupon.php'],
    ['methods' => ['POST'], 'pattern' => '#^payments/orders$#', 'file' => __DIR__ . '/api/payments/create_order.php'],
    ['methods' => ['POST'], 'pattern' => '#^payments/orders/(?P<id>[^/]+)/confirm$#', 'file' => __DIR__ . '/api/payments/confirm_order.php'],

    ['methods' => ['GET'], 'pattern' => '#^notifications$#', 'file' => __DIR__ . '/api/notifications/list.php'],
    ['methods' => ['GET'], 'pattern' => '#^notifications/list$#', 'file' => __DIR__ . '/api/notifications/list.php'],
    ['methods' => ['POST'], 'pattern' => '#^notifications/(?P<id>[^/]+)/read$#', 'file' => __DIR__ . '/api/notifications/read.php'],
    ['methods' => ['GET'], 'pattern' => '#^analytics/dashboard$#', 'file' => __DIR__ . '/api/analytics/dashboard.php'],

    ['methods' => ['GET'], 'pattern' => '#^users/getAllUser$#', 'file' => __DIR__ . '/api/users/getAllUser.php'],
    ['methods' => ['GET'], 'pattern' => '#^users/get/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/users/get.php'],
    ['methods' => ['PUT'], 'pattern' => '#^users/update/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/users/update.php'],
    ['methods' => ['DELETE'], 'pattern' => '#^users/delete/(?P<id>[^/]+)$#', 'file' => __DIR__ . '/api/users/delete.php'],
    ['methods' => ['GET'], 'pattern' => '#^users/wishlist$#', 'file' => __DIR__ . '/api/wishlist/list.php'],
    ['methods' => ['GET'], 'pattern' => '#^users/orders$#', 'file' => __DIR__ . '/api/users/orders.php'],
    ['methods' => ['GET'], 'pattern' => '#^users/courses$#', 'file' => __DIR__ . '/api/users/courses.php'],
    ['methods' => ['GET'], 'pattern' => '#^users/certificates$#', 'file' => __DIR__ . '/api/certificates/list.php'],
    ['methods' => ['GET', 'PUT'], 'pattern' => '#^users/profile$#', 'file' => __DIR__ . '/api/users/profile.php'],

    ['methods' => ['POST'], 'pattern' => '#^enrollments/enroll$#', 'file' => __DIR__ . '/api/enrollments/enroll.php']
];

$matchedPath = false;

foreach ($routes as $route) {
    if (!preg_match($route['pattern'], $path, $matches)) {
        continue;
    }

    $matchedPath = true;
    if (!in_array($method, $route['methods'], true)) {
        continue;
    }

    foreach ($matches as $key => $value) {
        if (!is_int($key)) {
            $_GET[$key] = $value;
            $_REQUEST[$key] = $value;
        }
    }

    require $route['file'];
    exit;
}

if ($matchedPath) {
    json_error('Method not allowed', null, 405);
}

json_error('API endpoint not found: ' . $path, null, 404);
