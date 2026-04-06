-- E-Learning Platform MySQL Database Schema
-- Run this file in phpMyAdmin or MySQL CLI.

CREATE DATABASE IF NOT EXISTS elearning_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elearning_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'instructor', 'admin') DEFAULT 'student',
  phone VARCHAR(20),
  gender ENUM('Male','Female','Other') DEFAULT 'Male',
  bio TEXT,
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  title_highlight VARCHAR(255),
  title_suffix VARCHAR(255),
  subtitle VARCHAR(255),
  description TEXT,
  roadmap VARCHAR(500),
  youtube_url TEXT,
  tags JSON,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  original_price DECIMAL(10,2) NULL,
  batch_date VARCHAR(100) NULL,
  learn_button_text VARCHAR(255) NULL,
  base_amount DECIMAL(10,2) NULL,
  platform_fees DECIMAL(10,2) NULL,
  gst DECIMAL(10,2) NULL,
  language VARCHAR(50) NULL,
  total_content_hours VARCHAR(50) NULL,
  instructor_id INT NOT NULL,
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'active', 'completed') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (user_id, course_id)
);

-- Dynamic syllabus table. One row per syllabus item.
CREATE TABLE IF NOT EXISTS course_syllabus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  section_title VARCHAR(255) NOT NULL,
  item_text TEXT NOT NULL,
  section_order INT NOT NULL DEFAULT 0,
  item_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

INSERT INTO users (username, email, password, role, phone)
VALUES
('admin', 'admin@codehub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '1234567890'),
('instructor1', 'instructor@codehub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'instructor', '0987654321'),
('student1', 'student@codehub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', NULL)
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO categories (name)
VALUES ('Web Development'), ('Mobile App'), ('Cybersecurity'), ('Backend');

INSERT INTO courses (slug, name, title, subtitle, description, price, original_price, batch_date, learn_button_text, base_amount, platform_fees, gst, language, total_content_hours, instructor_id, image, tags)
VALUES
('web-dev-cohort', 'Web Dev Cohort', 'Web Dev Cohort', 'Live 1.0', 'Master full-stack web development with real projects.', 5999.00, 11999.00, '21st May, 25', 'Learn basic of WebDev', 3529.00, 2471.00, 1080.00, 'Hindi', '150+', 2, '/uploads/sample-web.jpg', '["HTML","CSS","JavaScript","React","Node.js"]'),
('nodejs', 'Complete Node.js Course', 'Complete Node.js Course', 'Backend Specialization', 'Build scalable backend systems with Node.js and Express.', 5999.00, 11999.00, '27th May, 25', 'Learn basic of Nodejs', 3529.00, 2471.00, 1080.00, 'Hindi', '150+', 2, '/uploads/sample-node.jpg', '["Node","Express","MongoDB"]'),
('flutter', 'Flutter App Development', 'Flutter App Development', 'Cross-Platform Development', 'Create Android and iOS apps from one codebase.', 6999.00, 15000.00, '21st May, 25', 'Learn basic of Flutter', 4117.00, 2882.00, 1260.00, 'Hindi', '120+', 2, '/uploads/sample-flutter.jpg', '["Dart","Flutter","Firebase"]')
ON DUPLICATE KEY UPDATE slug = VALUES(slug);

INSERT INTO enrollments (user_id, course_id, payment_method)
VALUES
(3, 1, 'card'),
(3, 2, 'upi')
ON DUPLICATE KEY UPDATE payment_method = VALUES(payment_method);

-- Sample syllabus for dynamic syllabus pages.
DELETE FROM course_syllabus;
INSERT INTO course_syllabus (course_id, section_title, item_text, section_order, item_order) VALUES
(1, 'Networking Fundamentals', 'Introduction to networking concepts', 1, 1),
(1, 'Networking Fundamentals', 'OSI vs TCP/IP model', 1, 2),
(1, 'Networking Fundamentals', 'Domain and DNS basics', 1, 3),
(1, 'Web Development Core', 'HTML, CSS, JavaScript fundamentals', 2, 1),
(1, 'Web Development Core', 'React and frontend architecture', 2, 2),
(1, 'Web Development Core', 'Node.js backend APIs', 2, 3),
(2, 'Node.js Basics', 'Node runtime and modules', 1, 1),
(2, 'Node.js Basics', 'Express routing and middleware', 1, 2),
(2, 'Node.js Basics', 'REST API design and validation', 1, 3),
(2, 'Data & Auth', 'MongoDB integration', 2, 1),
(2, 'Data & Auth', 'Authentication and authorization', 2, 2),
(2, 'Data & Auth', 'Error handling and logging', 2, 3),
(3, 'Flutter Foundations', 'Widgets and state management basics', 1, 1),
(3, 'Flutter Foundations', 'Layouts, theming, and navigation', 1, 2),
(3, 'Flutter Foundations', 'Forms and validation', 1, 3),
(3, 'Flutter Projects', 'Firebase integration', 2, 1),
(3, 'Flutter Projects', 'REST API integration', 2, 2),
(3, 'Flutter Projects', 'Build and deploy app', 2, 3);
