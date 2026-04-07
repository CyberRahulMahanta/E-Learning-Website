USE elearning_db;

-- Advanced metadata for dynamic filtering and publishing
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty_level ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id INT NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS intro_video_url TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (is_published);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses (is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses (difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses (category_id);

-- Dynamic role-permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  role ENUM('student', 'instructor', 'admin') NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role, permission_key)
);

-- Refresh token store for secure session rotation
CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  KEY idx_refresh_expires (expires_at),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course content architecture
CREATE TABLE IF NOT EXISTS course_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_module_order (course_id, sort_order),
  KEY idx_module_course (course_id),
  CONSTRAINT fk_module_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  lesson_type ENUM('video','article','quiz','assignment','live') NOT NULL DEFAULT 'video',
  content LONGTEXT NULL,
  video_url TEXT NULL,
  duration_minutes INT NULL,
  is_preview TINYINT(1) NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lesson_order (module_id, sort_order),
  KEY idx_lesson_module (module_id),
  KEY idx_lesson_type (lesson_type),
  CONSTRAINT fk_lesson_module FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  resource_type ENUM('pdf','link','code','image','zip','other') NOT NULL DEFAULT 'link',
  resource_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_resource_lesson (lesson_id),
  CONSTRAINT fk_resource_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
);

-- Learning progress
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  last_watched_second INT NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_lesson_progress (user_id, lesson_id),
  KEY idx_progress_user (user_id),
  KEY idx_progress_lesson (lesson_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_course_progress (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  completed_lessons INT NOT NULL DEFAULT 0,
  total_lessons INT NOT NULL DEFAULT 0,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  last_activity_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_course_progress (user_id, course_id),
  KEY idx_course_progress_course (course_id),
  CONSTRAINT fk_course_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_progress_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Wishlist and reviews
CREATE TABLE IF NOT EXISTS course_wishlist (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, course_id),
  KEY idx_wishlist_course (course_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  rating TINYINT NOT NULL,
  review_text TEXT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_user_course (user_id, course_id),
  KEY idx_review_course (course_id),
  CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Payments and coupons
CREATE TABLE IF NOT EXISTS payment_coupons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  discount_type ENUM('percent','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2) NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupon_code (code),
  KEY idx_coupon_active (is_active)
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  coupon_id BIGINT NULL,
  status ENUM('created','pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'created',
  gateway VARCHAR(50) NOT NULL DEFAULT 'manual',
  gateway_order_id VARCHAR(255) NULL,
  gateway_payment_id VARCHAR(255) NULL,
  amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  final_amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  metadata JSON NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_code (order_code),
  KEY idx_payment_user (user_id),
  KEY idx_payment_course (course_id),
  KEY idx_payment_status (status),
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_coupon FOREIGN KEY (coupon_id) REFERENCES payment_coupons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  coupon_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  order_id BIGINT NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupon_order (coupon_id, order_id),
  KEY idx_coupon_redeem_user (user_id),
  CONSTRAINT fk_redemption_coupon FOREIGN KEY (coupon_id) REFERENCES payment_coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_redemption_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_redemption_order FOREIGN KEY (order_id) REFERENCES payment_orders(id) ON DELETE CASCADE
);

-- Notifications and discussion
CREATE TABLE IF NOT EXISTS user_notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notification_user (user_id),
  KEY idx_notification_read (is_read),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_discussions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id BIGINT NULL,
  message TEXT NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_discussion_course (course_id),
  KEY idx_discussion_parent (parent_id),
  CONSTRAINT fk_discussion_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_discussion_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_discussion_parent FOREIGN KEY (parent_id) REFERENCES course_discussions(id) ON DELETE CASCADE
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  module_id INT NULL,
  lesson_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  pass_percentage DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  time_limit_minutes INT NULL,
  is_final_assessment TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_quiz_course (course_id),
  CONSTRAINT fk_quiz_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_module FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE SET NULL,
  CONSTRAINT fk_quiz_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL
);

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_final_assessment TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS quiz_questions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('single','multiple','text') NOT NULL DEFAULT 'single',
  options JSON NULL,
  correct_answer JSON NOT NULL,
  marks DECIMAL(6,2) NOT NULL DEFAULT 1.00,
  sort_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_question_quiz (quiz_id),
  CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  score DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  total_marks DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  status ENUM('started','submitted','evaluated') NOT NULL DEFAULT 'started',
  answers JSON NULL,
  started_at DATETIME NOT NULL,
  submitted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_attempt_quiz (quiz_id),
  KEY idx_attempt_user (user_id),
  CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  module_id INT NULL,
  lesson_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  max_marks DECIMAL(8,2) NOT NULL DEFAULT 100.00,
  due_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_assignment_course (course_id),
  CONSTRAINT fk_assignment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_module FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE SET NULL,
  CONSTRAINT fk_assignment_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  assignment_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  submission_text LONGTEXT NULL,
  submission_url TEXT NULL,
  status ENUM('submitted','reviewed','accepted','rejected') NOT NULL DEFAULT 'submitted',
  marks DECIMAL(8,2) NULL,
  feedback TEXT NULL,
  submitted_at DATETIME NOT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assignment_submission (assignment_id, user_id),
  KEY idx_assignment_submission_user (user_id),
  CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  certificate_code VARCHAR(64) NOT NULL,
  issue_date DATETIME NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_certificate_code (certificate_code),
  UNIQUE KEY uq_user_course_certificate (user_id, course_id),
  CONSTRAINT fk_certificate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificate_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Seed dynamic permissions
INSERT INTO role_permissions (role, permission_key) VALUES
('student', 'course.view'),
('student', 'course.enroll'),
('student', 'course.wishlist.manage'),
('student', 'course.review.create'),
('student', 'progress.update'),
('student', 'discussion.create'),
('student', 'quiz.attempt'),
('student', 'assignment.submit'),
('student', 'notification.view'),
('student', 'certificate.view'),
('instructor', 'course.view'),
('instructor', 'course.manage.own'),
('instructor', 'course.content.manage.own'),
('instructor', 'course.wishlist.manage'),
('instructor', 'student.progress.view.own'),
('instructor', 'review.moderate.own'),
('instructor', 'analytics.view.own'),
('instructor', 'discussion.create'),
('instructor', 'quiz.manage.own'),
('instructor', 'assignment.manage.own'),
('instructor', 'notification.view'),
('instructor', 'certificate.view'),
('admin', '*')
ON DUPLICATE KEY UPDATE permission_key = VALUES(permission_key);

-- Seed one sample coupon
INSERT INTO payment_coupons (code, title, discount_type, discount_value, max_discount, min_order_amount, usage_limit, starts_at, ends_at, is_active)
VALUES ('WELCOME10', 'Welcome Discount 10%', 'percent', 10.00, 1000.00, 999.00, 10000, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  discount_type = VALUES(discount_type),
  discount_value = VALUES(discount_value),
  max_discount = VALUES(max_discount),
  min_order_amount = VALUES(min_order_amount),
  usage_limit = VALUES(usage_limit),
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  is_active = VALUES(is_active);

-- Seed categories/course mapping for existing data
UPDATE courses SET category_id = 1 WHERE slug IN ('web-dev-cohort', 'web-development', 'web-development-master', 'nodejs') AND category_id IS NULL;
UPDATE courses SET category_id = 2 WHERE slug = 'flutter' AND category_id IS NULL;
UPDATE courses SET category_id = 3 WHERE slug = 'hacking' AND category_id IS NULL;

-- Seed basic module/lesson content if absent
INSERT INTO course_modules (course_id, title, description, sort_order, is_published)
SELECT c.id, 'Getting Started', 'Introduction and orientation', 1, 1
FROM courses c
LEFT JOIN course_modules m ON m.course_id = c.id AND m.sort_order = 1
WHERE m.id IS NULL;

INSERT INTO course_modules (course_id, title, description, sort_order, is_published)
SELECT c.id, 'Core Learning', 'Main concepts and practicals', 2, 1
FROM courses c
LEFT JOIN course_modules m ON m.course_id = c.id AND m.sort_order = 2
WHERE m.id IS NULL;

INSERT INTO course_lessons (module_id, title, lesson_type, content, video_url, duration_minutes, is_preview, is_published, sort_order)
SELECT m.id, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1
FROM course_modules m
LEFT JOIN course_lessons l ON l.module_id = m.id AND l.sort_order = 1
WHERE l.id IS NULL;

INSERT INTO course_lessons (module_id, title, lesson_type, content, video_url, duration_minutes, is_preview, is_published, sort_order)
SELECT m.id, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2
FROM course_modules m
LEFT JOIN course_lessons l ON l.module_id = m.id AND l.sort_order = 2
WHERE l.id IS NULL;

INSERT INTO user_course_progress (user_id, course_id, progress_percent, completed_lessons, total_lessons, status, last_activity_at)
SELECT e.user_id, e.course_id, 0.00, 0,
       COALESCE((SELECT COUNT(cl.id)
                 FROM course_modules cm
                 JOIN course_lessons cl ON cl.module_id = cm.id
                 WHERE cm.course_id = e.course_id AND cl.is_published = 1), 0) AS total_lessons,
       'not_started', e.enrolled_at
FROM enrollments e
LEFT JOIN user_course_progress ucp ON ucp.user_id = e.user_id AND ucp.course_id = e.course_id
WHERE ucp.id IS NULL;

-- Seed sample quizzes (if missing)
INSERT INTO quizzes (course_id, title, description, pass_percentage, time_limit_minutes, is_active)
SELECT c.id, 'Web Development Basics Quiz', 'Covers HTML, CSS, JS and MERN basics', 60, 20, 1
FROM courses c
WHERE c.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.course_id = c.id AND q.title = 'Web Development Basics Quiz'
  );

INSERT INTO quizzes (course_id, title, description, pass_percentage, time_limit_minutes, is_active)
SELECT c.id, 'Node.js Core Quiz', 'Checks backend and API fundamentals', 65, 15, 1
FROM courses c
WHERE c.slug = 'nodejs'
  AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.course_id = c.id AND q.title = 'Node.js Core Quiz'
  );

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
SELECT q.id,
       'Which HTML tag is used for the largest heading?',
       'single',
       JSON_ARRAY('h1', 'h6', 'header', 'head'),
       JSON_QUOTE('h1'),
       1,
       1
FROM quizzes q
WHERE q.title = 'Web Development Basics Quiz'
  AND NOT EXISTS (
    SELECT 1 FROM quiz_questions qq
    WHERE qq.quiz_id = q.id AND qq.question_text = 'Which HTML tag is used for the largest heading?'
  );

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
SELECT q.id,
       'Which of the following are JavaScript frameworks/libraries?',
       'multiple',
       JSON_ARRAY('React', 'Vue', 'Express', 'MongoDB'),
       JSON_ARRAY('React', 'Vue', 'Express'),
       2,
       2
FROM quizzes q
WHERE q.title = 'Web Development Basics Quiz'
  AND NOT EXISTS (
    SELECT 1 FROM quiz_questions qq
    WHERE qq.quiz_id = q.id AND qq.question_text = 'Which of the following are JavaScript frameworks/libraries?'
  );

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
SELECT q.id,
       'Which module is commonly used to build HTTP APIs in Node.js projects?',
       'single',
       JSON_ARRAY('express', 'numpy', 'django', 'flutter'),
       JSON_QUOTE('express'),
       2,
       1
FROM quizzes q
WHERE q.title = 'Node.js Core Quiz'
  AND NOT EXISTS (
    SELECT 1 FROM quiz_questions qq
    WHERE qq.quiz_id = q.id AND qq.question_text = 'Which module is commonly used to build HTTP APIs in Node.js projects?'
  );

-- Seed sample assignments (if missing)
INSERT INTO assignments (course_id, title, description, max_marks, due_at, is_active)
SELECT c.id,
       'Build a Responsive Landing Page',
       'Create a responsive landing page using HTML, CSS, and JavaScript. Host it and submit the URL.',
       100,
       DATE_ADD(NOW(), INTERVAL 14 DAY),
       1
FROM courses c
WHERE c.slug = 'web-development'
  AND NOT EXISTS (
    SELECT 1 FROM assignments a WHERE a.course_id = c.id AND a.title = 'Build a Responsive Landing Page'
  );

INSERT INTO assignments (course_id, title, description, max_marks, due_at, is_active)
SELECT c.id,
       'Create a Node.js REST API',
       'Build CRUD APIs with validation and authentication. Submit GitHub repo + API docs URL.',
       100,
       DATE_ADD(NOW(), INTERVAL 10 DAY),
       1
FROM courses c
WHERE c.slug = 'nodejs'
  AND NOT EXISTS (
    SELECT 1 FROM assignments a WHERE a.course_id = c.id AND a.title = 'Create a Node.js REST API'
  );

-- Ensure every course has at least one quiz + one assignment
INSERT INTO quizzes (course_id, title, description, pass_percentage, time_limit_minutes, is_active)
SELECT c.id,
       CONCAT(c.name, ' - Starter Quiz'),
       'Auto-generated starter quiz for this course.',
       60,
       20,
       1
FROM courses c
WHERE NOT EXISTS (
  SELECT 1 FROM quizzes q WHERE q.course_id = c.id
);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
SELECT q.id,
       'This is your starter quiz question. Choose option A to pass.',
       'single',
       JSON_ARRAY('A', 'B', 'C', 'D'),
       JSON_QUOTE('A'),
       1,
       1
FROM quizzes q
JOIN courses c ON c.id = q.course_id
WHERE q.title = CONCAT(c.name, ' - Starter Quiz')
  AND NOT EXISTS (
    SELECT 1 FROM quiz_questions qq WHERE qq.quiz_id = q.id
  );

-- Ensure each module has at least one module quiz (for step-wise learning flow)
INSERT INTO quizzes (course_id, module_id, title, description, pass_percentage, time_limit_minutes, is_active, is_final_assessment)
SELECT cm.course_id,
       cm.id,
       CONCAT(cm.title, ' - Module Quiz'),
       'Auto-generated module-level quiz.',
       60,
       15,
       1,
       0
FROM course_modules cm
WHERE NOT EXISTS (
  SELECT 1
  FROM quizzes q
  WHERE q.module_id = cm.id
    AND q.is_active = 1
    AND q.is_final_assessment = 0
);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
SELECT q.id,
       'Module checkpoint question: choose option A.',
       'single',
       JSON_ARRAY('A', 'B', 'C', 'D'),
       JSON_QUOTE('A'),
       1,
       1
FROM quizzes q
WHERE q.title LIKE '% - Module Quiz'
  AND NOT EXISTS (
    SELECT 1 FROM quiz_questions qq WHERE qq.quiz_id = q.id
  );

-- Ensure each course has one final assessment
INSERT INTO quizzes (course_id, title, description, pass_percentage, time_limit_minutes, is_active, is_final_assessment)
SELECT c.id,
       CONCAT(c.name, ' - Final Assessment'),
       'Course completion final assessment.',
       70,
       30,
       1,
       1
FROM courses c
WHERE NOT EXISTS (
  SELECT 1 FROM quizzes q WHERE q.course_id = c.id AND q.is_final_assessment = 1
);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, sort_order)
SELECT q.id,
       'Final assessment question: choose option A.',
       'single',
       JSON_ARRAY('A', 'B', 'C', 'D'),
       JSON_QUOTE('A'),
       2,
       1
FROM quizzes q
WHERE q.is_final_assessment = 1
  AND NOT EXISTS (
    SELECT 1 FROM quiz_questions qq WHERE qq.quiz_id = q.id
  );

INSERT INTO assignments (course_id, title, description, max_marks, due_at, is_active)
SELECT c.id,
       CONCAT(c.name, ' - Starter Assignment'),
       'Auto-generated starter assignment. Submit your implementation link and explanation.',
       100,
       DATE_ADD(NOW(), INTERVAL 14 DAY),
       1
FROM courses c
WHERE NOT EXISTS (
  SELECT 1 FROM assignments a WHERE a.course_id = c.id
);
