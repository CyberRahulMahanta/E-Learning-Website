# PHP Backend Setup (XAMPP)

## 1) Requirements
- Apache + PHP 8+
- MySQL/MariaDB (XAMPP)

## 2) Database Setup
1. Open `http://localhost/phpmyadmin`
2. Create database `elearning_db` (if needed)
3. Import [`backend/database.sql`](./database.sql)
4. Apply advanced dynamic migration:

```bash
C:\xampp\mysql\bin\mysql.exe -u root --database=elearning_db --execute="source C:/xampp/htdocs/Online-Learning-Platform/backend/migrations/advanced_dynamic_upgrade.sql"
```

This migration adds dynamic advanced entities:
- RBAC permissions (`role_permissions`)
- Refresh-session tokens (`auth_refresh_tokens`)
- Course modules/lessons/resources
- Lesson and course progress tracking
- Wishlist and reviews
- Orders, coupons, and redemptions
- Notifications and discussions
- Quizzes, assignments, and certificates

## 3) API Base URL
- `http://localhost/Online-Learning-Platform/backend/api`
- Example: `GET http://localhost/Online-Learning-Platform/backend/api/courses`

## 4) Frontend Connection
Vite dev now uses proxy by default (`/api`) to avoid CORS issues.

Optional production env:

```env
VITE_API_URL=http://localhost/Online-Learning-Platform/backend/api
```

## 5) Auth Notes
- Login endpoint: `POST /auth/login`
- Response includes `token` + `refreshToken`
- Refresh endpoint: `POST /auth/refresh`
- Logout revokes refresh token: `POST /auth/logout`
- Protected routes require: `Authorization: Bearer <token>`

## 6) Default Demo Accounts
- Admin: `admin@codehub.com` / `password`
- Instructor: `instructor@codehub.com` / `password`
- Student: `student@codehub.com` / `password`

## 7) Route Reference
See [`backend/API_MAP.md`](./API_MAP.md) for all endpoints.
