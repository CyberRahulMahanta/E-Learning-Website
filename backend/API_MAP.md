# Frontend <-> Backend API Map

Base URL:

`http://localhost/Online-Learning-Platform/backend/api`

## Auth
- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

## Courses
- `GET /courses` (filters: `search`, `categoryId`, `difficulty`, `featured`, `published`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit`)
- `GET /courses/:idOrSlug`
- `GET /courses/get/:idOrSlug`
- `GET /courses/instructor/:instructorId`
- `POST /courses/add` (multipart/form-data)
- `PUT|POST /courses/edit/:courseId`
- `DELETE /courses/delete/:courseId`
- `POST /courses/:idOrSlug/enroll`
- `GET /courses/:idOrSlug/content`
- `GET /courses/:idOrSlug/progress`
- `POST /courses/:idOrSlug/wishlist`
- `GET /courses/:idOrSlug/reviews`
- `POST /courses/:idOrSlug/reviews`
- `GET /courses/:idOrSlug/discussions`
- `POST /courses/:idOrSlug/discussions`

## Learning Content Management
- `POST /courses/:courseId/modules`
- `PUT|PATCH|POST /modules/:moduleId`
- `DELETE /modules/:moduleId`
- `POST /modules/:moduleId/lessons`
- `PUT|PATCH|POST /lessons/:lessonId`
- `DELETE /lessons/:lessonId`
- `POST /lessons/:lessonId/progress`

## Payments and Coupons
- `POST /payments/coupons/validate`
- `POST /payments/orders`
- `POST /payments/orders/:orderId/confirm`

## Users
- `GET /users/getAllUser` (admin)
- `GET /users/get/:id` (admin/self)
- `PUT /users/update/:id` (admin/self with role restrictions)
- `DELETE /users/delete/:id` (admin)
- `GET /users/courses` (authenticated user enrollments)
- `GET /users/wishlist`
- `GET /users/orders`
- `GET /users/profile`
- `PUT /users/profile`

## Notifications and Analytics
- `GET /notifications`
- `GET /notifications/list`
- `POST /notifications/:id/read`
- `GET /analytics/dashboard`

## Enrollments
- `POST /enrollments/enroll`

## Auth Header
All protected routes use:

`Authorization: Bearer <token>`

## Refresh Token Flow
- Login/Signup/Register responses include `refreshToken`.
- Use `POST /auth/refresh` with `{ "refreshToken": "..." }` to rotate access + refresh tokens.
- Use `POST /auth/logout` with `{ "refreshToken": "..." }` to revoke current session token.
