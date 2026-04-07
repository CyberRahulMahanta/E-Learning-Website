-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 07, 2026 at 06:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elearning_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` bigint(20) NOT NULL,
  `course_id` int(11) NOT NULL,
  `module_id` int(11) DEFAULT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `max_marks` decimal(8,2) NOT NULL DEFAULT 100.00,
  `due_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`id`, `course_id`, `module_id`, `lesson_id`, `title`, `description`, `max_marks`, `due_at`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, NULL, NULL, 'Web Dev. Cohort - Starter Assignment', 'Auto-generated starter assignment. Submit your implementation link and explanation.', 100.00, '2026-04-20 23:50:23', 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(2, 5, NULL, NULL, 'Online Flutter App Development Course - Starter Assignment', 'Auto-generated starter assignment. Submit your implementation link and explanation.', 100.00, '2026-04-20 23:50:23', 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(3, 6, NULL, NULL, 'Online Ethical Hacking Courses - Starter Assignment', 'Auto-generated starter assignment. Submit your implementation link and explanation.', 100.00, '2026-04-20 23:50:23', 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(4, 7, NULL, NULL, 'Complete Node.js + Express.js + MongoDB - Starter Assignment', 'Auto-generated starter assignment. Submit your implementation link and explanation.', 100.00, '2026-04-20 23:50:23', 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(5, 8, NULL, NULL, 'Job Ready AI Powered Cohort: Complete Web Development + DSA + Aptitude - Starter Assignment', 'Auto-generated starter assignment. Submit your implementation link and explanation.', 100.00, '2026-04-20 23:50:23', 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(6, 9, NULL, NULL, 'Web Development Master Course @dot 1.0 Batch - Starter Assignment', 'Auto-generated starter assignment. Submit your implementation link and explanation.', 100.00, '2026-04-20 23:50:23', 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23');

-- --------------------------------------------------------

--
-- Table structure for table `assignment_submissions`
--

CREATE TABLE `assignment_submissions` (
  `id` bigint(20) NOT NULL,
  `assignment_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `submission_text` longtext DEFAULT NULL,
  `submission_url` text DEFAULT NULL,
  `status` enum('submitted','reviewed','accepted','rejected') NOT NULL DEFAULT 'submitted',
  `marks` decimal(8,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `submitted_at` datetime NOT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assignment_submissions`
--

INSERT INTO `assignment_submissions` (`id`, `assignment_id`, `user_id`, `submission_text`, `submission_url`, `status`, `marks`, `feedback`, `submitted_at`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 2, 4, 'This is my Solution..!', 'https://github.com/CyberRahulMahanta/E-Learning-Website.git', 'submitted', NULL, NULL, '2026-04-07 09:46:43', NULL, '2026-04-07 04:16:43', '2026-04-07 04:16:43'),
(2, 4, 4, 'This is a demo test..!', 'https://github.com/CyberRahulMahanta/E-Learning-Website.git', 'submitted', NULL, NULL, '2026-04-07 11:45:41', NULL, '2026-04-07 06:15:41', '2026-04-07 06:15:41');

-- --------------------------------------------------------

--
-- Table structure for table `auth_refresh_tokens`
--

CREATE TABLE `auth_refresh_tokens` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_refresh_tokens`
--

INSERT INTO `auth_refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `expires_at`, `revoked_at`, `created_at`) VALUES
(1, 3, '272673e23176fdfd0cdb5d13ee4bd70691a92cf3b2b87122c3f9e554cdfe9bf5', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:17:45', '2026-04-06 22:47:45', '2026-04-06 17:17:45'),
(2, 3, 'ea7cc0157220eda1d6a5474acd5f750a4b6734a99ff997f724e014bfe9ca6dd5', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:17:45', NULL, '2026-04-06 17:17:45'),
(3, 3, '88e067164eccebbff060a78f3669c523b4dd1bbc80189f4df702678ae7dfe95c', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:18:16', NULL, '2026-04-06 17:18:16'),
(4, 3, '7b52f37055e8f35ee35202d8d17609e3eaa2f1889a269694f6368b6adf3c25e0', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:18:30', NULL, '2026-04-06 17:18:30'),
(5, 3, '0c4b21f2bf6788d1cd67245bb096c3323045de2e15027f381ae9cc55dd8b086e', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:19:00', NULL, '2026-04-06 17:19:00'),
(6, 3, 'c95be44a62638b58c336a696183f44ddd1214fcaf3b856887d0b781f739679fc', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:19:47', NULL, '2026-04-06 17:19:47'),
(7, 3, 'eae1df4f575c917060ec42b942e20ff9ca2d6fbf8c036e9a77b5b62b536fa022', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:20:30', NULL, '2026-04-06 17:20:30'),
(8, 3, '97093173c386bae65b5c89c8fc635fab8c2958bb1356d27e0dfc521e17256872', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:23:11', NULL, '2026-04-06 17:23:11'),
(9, 3, '3de0633ae1f59a745c66a549aff0814d60bdb249bd47721c59013beddd016986', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:23:34', NULL, '2026-04-06 17:23:34'),
(10, 2, '307ed2615eaa82cb9a9937a4c3d842294f046f70e3dd3a4e05cb98b2adea9174', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.7920', '::1', '2026-05-06 19:27:46', NULL, '2026-04-06 17:27:46'),
(11, 4, '6ee2cd33e43077bb2865044c16f52a5e7dc7eb4108717d28a04ff0b9055fb776', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 19:31:51', '2026-04-06 23:03:29', '2026-04-06 17:31:51'),
(12, 1, '4167a37948f7236eb7e7bbba6bd5e876d02b0f9cb643e64504145c198f206488', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 19:33:53', '2026-04-06 23:04:03', '2026-04-06 17:33:53'),
(13, 4, 'c51a99a3294d336ac19df906502760c9b3bbb8a91301d52e3987d659459f9ae1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 19:50:10', '2026-04-06 23:21:10', '2026-04-06 17:50:10'),
(14, 2, '2e1afd3c5385b429154a89488a1d65146c6643ad5a976856937b4dd7ee74b44d', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 19:51:31', '2026-04-06 23:35:08', '2026-04-06 17:51:31'),
(15, 2, 'd90ab95724be439b38906103aba6154a93a91a2b7236485d5855f12bec5d010b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 20:05:45', '2026-04-06 23:36:15', '2026-04-06 18:05:45'),
(16, 2, '1b5e185daa9c169f61932ecc7128d74b0c8e3b179d6315a14494579ec3312206', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 20:09:14', '2026-04-06 23:39:26', '2026-04-06 18:09:14'),
(17, 4, 'aa1706cf6621b34dd22d470764f6af2c6f38445935265aeccc089420652eb819', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 20:10:09', '2026-04-06 23:40:19', '2026-04-06 18:10:09'),
(18, 4, '7af005b4afcb5cb6212098ee5338b3e3b2a0b8d6ebfb637ec6e6b9474bef0160', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 20:10:36', '2026-04-07 00:20:44', '2026-04-06 18:10:36'),
(19, 4, '368b8f289332f75f7f228e48f2c392842d02dc9aebcfaa215811d145f70bb725', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 20:59:33', NULL, '2026-04-06 18:59:33'),
(20, 1, 'a4635cc67d13d5381db7a42722e76f9d9c049294298e87f3d6fa0183180d9286', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:00:14', NULL, '2026-04-06 19:00:14'),
(21, 1, '855634756263d6492ff6bfe25098c1708b83a24adba2ff984e77b45c635523d3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:04:48', '2026-04-07 00:34:57', '2026-04-06 19:04:48'),
(22, 4, 'caae504e9d7523c01dd322a2f1efd987e5dbb2f986218156158c28c017e6fbe9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:05:13', '2026-04-07 00:35:33', '2026-04-06 19:05:13'),
(23, 2, 'c7eb95a3dbe1962249d56058bc0a65531fd361a706b2a57a6f3a1568e7d8690e', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:05:45', '2026-04-07 00:35:58', '2026-04-06 19:05:45'),
(24, 4, '1c136dcb5e9dcaadbf6f12582bb95ff8ad609114f4352fbd572d058f5ec2d92f', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:06:25', '2026-04-07 00:37:30', '2026-04-06 19:06:25'),
(25, 2, '810543005cd569f68f2cf64eafbb7ae2ccf130fe32cd601398561f084ada2970', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:07:44', '2026-04-07 00:38:08', '2026-04-06 19:07:44'),
(26, 1, '76db14fb624de8d076da0bf4dc8fe478ffcb4f3934191ac05b58d38f7b0bef41', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:08:22', '2026-04-07 00:40:54', '2026-04-06 19:08:22'),
(27, 1, 'bbbb79957af21b3ae60745067a6384d7c27fd0412ce53ad7c69f0f8cea3a1057', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:11:05', '2026-04-07 00:41:37', '2026-04-06 19:11:05'),
(28, 4, '239374fb0840bc1fd6e7b5db5897570e0454e07e68175f1430eb592be0fbb9eb', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:12:04', '2026-04-07 00:43:26', '2026-04-06 19:12:04'),
(29, 1, '4214aa871a137d0b750558cc7cf61fecd11a00d017ede051857da108b0d444b5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:13:36', '2026-04-07 00:43:45', '2026-04-06 19:13:36'),
(30, 2, 'd94a3486f18453632dfa8eeacf826c8dbda51171e733783eafa5467fe6e79cae', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:14:04', '2026-04-07 00:45:20', '2026-04-06 19:14:04'),
(31, 1, '5d77f5364b1e0c715f3e1ea1502adfd7339d2c7ca18eaa9177a3cd52801879c3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:15:36', NULL, '2026-04-06 19:15:36'),
(32, 4, 'bbabfd11ad7d972ab07bc0f363c39b1057ad857cb56ab357a8e893b193186dad', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:19:34', '2026-04-07 00:50:26', '2026-04-06 19:19:34'),
(33, 1, '36a77b6ef9a17eee145ddc17c77cc060ccc0f20f19d59e3b948c7d6543b26b9e', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '127.0.0.1', '2026-05-06 21:20:49', '2026-04-07 00:56:41', '2026-04-06 19:20:49'),
(34, 4, 'd2bfc8fe8d3d9d321b0ad1c9d1542683be7a1c5f7b1bff2daccdfe58acd6380e', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 21:27:06', '2026-04-07 00:57:59', '2026-04-06 19:27:06'),
(35, 2, '81abea650e4f2962d254eb412882c8bdb5baa2b538a5f2d01fe680c0c720b744', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 21:28:26', '2026-04-07 00:59:14', '2026-04-06 19:28:26'),
(36, 4, '724c53d3b8828d78f001f82c0df0e05e806eee488eab8f376d15bb89d8e648d0', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 21:34:53', '2026-04-07 01:05:48', '2026-04-06 19:34:53'),
(37, 2, '4facf86d57d75028bcbef801df9ba194fc772e899c2405c06b1cb5cdf3ee092a', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 21:36:07', '2026-04-07 01:10:45', '2026-04-06 19:36:07'),
(38, 4, '5faf57c863d7309451a5ded60132fa033bd56d34a42861c324b559a8bf5780d7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 21:41:04', '2026-04-07 01:20:06', '2026-04-06 19:41:04'),
(39, 4, 'd52380f5e82b90b05feb0cddeeb0a6a5728b4188a8030483a3627463fc0ed717', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 21:50:51', '2026-04-07 01:49:39', '2026-04-06 19:50:51'),
(40, 2, '3d12e99a3a1858039211b039812b1003e2d4478b242c2b49eb854729cef68ee0', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-06 22:19:57', '2026-04-07 09:44:42', '2026-04-06 20:19:57'),
(41, 2, 'f00ad03b8cb56235ef1d4c5fc1fcc1d9cf4acfdb6404ccb6699812f9a2163ae8', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 06:14:42', '2026-04-07 09:44:46', '2026-04-07 04:14:42'),
(42, 2, '9b78f60abf80d81e6071739816fbb84668a05510795f60129154b440ea72ce7f', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 06:14:42', NULL, '2026-04-07 04:14:42'),
(43, 4, '790ab6bb61bf1d525ecfac953c39de37ad91a09f678daecc1fde3099d16244a8', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 06:15:09', '2026-04-07 11:46:58', '2026-04-07 04:15:09'),
(44, 2, '3d4d2b09956944904a4c5a960f7f68c2d1821808d74bdd00dce4812c3712f65e', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 08:19:46', '2026-04-07 11:52:39', '2026-04-07 06:19:46'),
(45, 4, '415c89c47dbeeaedab70a62d3e46daa9418494246586021c3c5be4f8491e2a4d', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 08:22:58', '2026-04-07 12:09:05', '2026-04-07 06:22:58'),
(46, 2, '1ffa13b7e658609fdb5beebb5d3c4160bda5525fa8362d3f4367e7aef76b838f', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 08:39:32', '2026-04-07 12:10:40', '2026-04-07 06:39:32'),
(47, 4, '0bf00146e7f30b02117bcd6f4db3b1c15c59e7b77070d66b5b7447c985670150', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 08:41:13', '2026-04-07 12:11:45', '2026-04-07 06:41:13'),
(48, 2, '8480d031bd20eefbe7fcfb9e74e3c78a38c657114e781798029dca9853b64161', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 08:42:00', '2026-04-07 12:14:50', '2026-04-07 06:42:00'),
(49, 4, '6028acce262a4d9e5e3f79e0e11c65534e00b60022afbeebdce1ecd56d1642af', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 08:45:09', '2026-04-07 21:30:03', '2026-04-07 06:45:09'),
(50, 4, '485bd24b5a889d0047317e0cf711a2f03f803a77facac39d56a61f5325187f09', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:00:03', NULL, '2026-04-07 16:00:03'),
(51, 4, 'e1f79900df58fda72380aa506e737ff2f4fab6696caaea93baa1d9d137ae12ef', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:00:03', '2026-04-07 21:32:23', '2026-04-07 16:00:03'),
(52, 2, 'b9ea905be20d516036298eef36b87a226097d369fa2974e59726e48275c47397', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:02:40', '2026-04-07 21:36:06', '2026-04-07 16:02:40'),
(53, 4, '77a80839f32ed42c49b9c22ed76428080e98ad28e390dddaa72bb00ed98e5c68', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:06:23', '2026-04-07 21:36:54', '2026-04-07 16:06:23'),
(54, 1, '4b3bf1dd50d6ffd793b653f1f1e68d49e392bdf72f49aca915a192e7513f6793', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:07:10', '2026-04-07 21:37:42', '2026-04-07 16:07:10'),
(55, 2, '6eb03bf45ea6e2297e360a2f8b813d96e632806bb53ad3c3b71247a0729de741', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:07:54', '2026-04-07 21:41:09', '2026-04-07 16:07:54'),
(56, 4, '30de4a5ed0d7c525059ce5d3fd116789a8152022020569e5e9acde42c19455c1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:11:27', '2026-04-07 21:42:35', '2026-04-07 16:11:27'),
(57, 2, '4a832e46f29cf1c6a14eabb531e39ccda485decc364ab836871d418f012e8774', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '::1', '2026-05-07 18:12:44', NULL, '2026-04-07 16:12:44');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
(1, 'Web Development', '2026-04-06 15:46:26'),
(2, 'Mobile App', '2026-04-06 15:46:26'),
(3, 'Cybersecurity', '2026-04-06 15:46:26'),
(4, 'Backend', '2026-04-06 15:46:26');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `certificate_code` varchar(64) NOT NULL,
  `issue_date` datetime NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `certificates`
--

INSERT INTO `certificates` (`id`, `user_id`, `course_id`, `certificate_code`, `issue_date`, `metadata`, `created_at`) VALUES
(1, 4, 7, 'CERT-20260406-7-4-074DBA', '2026-04-07 01:46:29', '{\"issuedFrom\":\"progress.update\",\"completedLessons\":4,\"totalLessons\":4}', '2026-04-06 20:16:29');

-- --------------------------------------------------------

--
-- Table structure for table `coupon_redemptions`
--

CREATE TABLE `coupon_redemptions` (
  `id` bigint(20) NOT NULL,
  `coupon_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coupon_redemptions`
--

INSERT INTO `coupon_redemptions` (`id`, `coupon_id`, `user_id`, `order_id`, `discount_amount`, `created_at`) VALUES
(1, 1, 3, 1, 599.90, '2026-04-06 17:17:45'),
(2, 1, 3, 2, 599.90, '2026-04-06 17:23:11');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `title_highlight` varchar(255) DEFAULT NULL,
  `title_suffix` varchar(255) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `roadmap` varchar(500) DEFAULT NULL,
  `youtube_url` text DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `original_price` decimal(10,2) DEFAULT NULL,
  `batch_date` varchar(100) DEFAULT NULL,
  `learn_button_text` varchar(255) DEFAULT NULL,
  `base_amount` decimal(10,2) DEFAULT NULL,
  `platform_fees` decimal(10,2) DEFAULT NULL,
  `gst` decimal(10,2) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `total_content_hours` varchar(50) DEFAULT NULL,
  `instructor_id` int(11) NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `difficulty_level` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `category_id` int(11) DEFAULT NULL,
  `intro_video_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `slug`, `name`, `title`, `title_highlight`, `title_suffix`, `subtitle`, `description`, `roadmap`, `youtube_url`, `tags`, `price`, `original_price`, `batch_date`, `learn_button_text`, `base_amount`, `platform_fees`, `gst`, `language`, `total_content_hours`, `instructor_id`, `image`, `created_at`, `updated_at`, `is_published`, `is_featured`, `difficulty_level`, `category_id`, `intro_video_url`) VALUES
(4, 'web-dev-cohort', 'Web Dev. Cohort', 'WEB DEV', 'COHORT', NULL, NULL, NULL, '/images/Group67.png', 'https://www.youtube.com/watch?v=yG8JMlldoCE', '[\"HTML\", \"CSS\", \"JAVASCRIPT\", \"NEXT.JS\", \"NODE\", \"DATABASE\"]', 5999.00, 6000.00, '21st May, 25', 'Learn basic of WebDev', 3529.00, 2471.00, 1080.00, 'Hindi', NULL, 2, '/images/Group7.png', '2026-04-06 16:32:38', '2026-04-06 16:48:23', 1, 0, 'beginner', 1, NULL),
(5, 'flutter', 'Online Flutter App Development Course', 'Online Flutter', 'App', NULL, 'Development Course', NULL, '/images/Group109.png', 'https://www.youtube.com/watch?v=jqxz7QvdWk8&list=PLjVLYmrlmjGfGLShoW0vVX_tcyT8u1Y3E', '[\"Basics of Dart\", \"Flutter\", \"Firebase Components\"]', 6999.00, 15000.00, '21st May, 25', 'Learn basic of Flutter', 3529.00, 2471.00, 1080.00, 'Hindi', NULL, 2, '/images/Group35.png', '2026-04-06 16:32:38', '2026-04-06 16:48:23', 1, 0, 'beginner', 2, NULL),
(6, 'hacking', 'Online Ethical Hacking Courses', 'Online Ethical', 'Hacking', 'Courses', NULL, 'Learn the basics of ethical hacking and cyber security with the best online ethical hacker course in India. This training program is designed for beginners and covers core concepts, hacking methodologies, tools, techniques, and more.', '/images/Group107.png', 'https://www.youtube.com/watch?v=vK4Mno4QYqk', '[\"Networking\", \"Linux\", \"Network Scanning\"]', 3000.00, 6000.00, '21st May, 25', 'Learn basic of Hacking', 1764.00, 1236.00, 540.00, 'Hindi', NULL, 2, '/images/Group34.png', '2026-04-06 16:32:38', '2026-04-06 16:48:23', 1, 0, 'beginner', 3, NULL),
(7, 'nodejs', 'Complete Node.js + Express.js + MongoDB', 'Complete', 'Node.js', NULL, NULL, NULL, '/images/Group67.png', 'https://www.youtube.com/watch?v=ohIAiuHMKMI', '[\"React.js\", \"Node.js\", \"Express.js\", \"MongoDB\", \"Project-focused\"]', 5999.00, 11999.00, '27st May, 25', 'Learn basic of Nodejs', 3529.00, 2471.00, 1080.00, 'Hindi', NULL, 2, '/images/Group32.png', '2026-04-06 16:32:38', '2026-04-06 16:48:23', 1, 0, 'beginner', 1, NULL),
(8, 'web-development', 'Job Ready AI Powered Cohort: Complete Web Development + DSA + Aptitude', 'Job Ready', 'AI', 'Powered Cohort:', 'Complete Web Development + DSA + Aptitude', NULL, '/images/Group67.png', 'https://www.youtube.com/watch?v=l1EssrLxt7E', '[\"MERN STACK\", \"DSA With JS\", \"AI Powered\", \"Placement Focus\", \"Aptitude\"]', 5999.00, 11999.00, '27st May, 25', 'Learn basic of Web Development', 3529.00, 2471.00, 1080.00, 'Hindi', NULL, 2, '/images/Group30.png', '2026-04-06 16:32:38', '2026-04-06 16:48:23', 1, 0, 'beginner', 1, NULL),
(9, 'web-development-master', 'Web Development Master Course @dot 1.0 Batch', 'Web Development', 'Master', NULL, 'Course @dot 1.0 Batch', NULL, '/images/Group67.png', 'https://www.youtube.com/watch?v=tVzUXW6siu0&list=PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w', '[\"React.js\", \"Node.js\", \"Express.js\", \"MongoDB\", \"Project-focused\"]', 5999.00, 11999.00, '27st May, 25', 'Learn basic of Web Development Master', 3529.00, 2471.00, 1080.00, 'Hindi', NULL, 2, '/images/Group31.png', '2026-04-06 16:32:38', '2026-04-06 16:48:23', 1, 0, 'beginner', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `course_discussions`
--

CREATE TABLE `course_discussions` (
  `id` bigint(20) NOT NULL,
  `course_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `message` text NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_lessons`
--

CREATE TABLE `course_lessons` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `lesson_type` enum('video','article','quiz','assignment','live') NOT NULL DEFAULT 'video',
  `content` longtext DEFAULT NULL,
  `video_url` text DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `is_preview` tinyint(1) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_lessons`
--

INSERT INTO `course_lessons` (`id`, `module_id`, `title`, `lesson_type`, `content`, `video_url`, `duration_minutes`, `is_preview`, `is_published`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(2, 8, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(3, 2, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(4, 9, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(5, 3, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(6, 10, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(7, 4, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(8, 11, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(9, 5, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(10, 12, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(11, 6, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(12, 13, 'Welcome & Course Roadmap', 'video', 'Introduction to the course structure and outcomes', NULL, 20, 1, 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(16, 1, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(17, 8, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(18, 2, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(19, 9, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(20, 3, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(21, 10, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(22, 4, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(23, 11, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(24, 5, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(25, 12, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(26, 6, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(27, 13, 'Hands-on Practical Session', 'video', 'Core practical implementation and walkthrough', NULL, 45, 0, 1, 2, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(28, 4, 'introduction to Node.js + Express.js + MongoDB', 'video', NULL, 'https://youtu.be/T55Kb8rrH1g?si=ig63EHNhL3bS6W-T', 43, 1, 1, 3, '2026-04-07 06:44:36', '2026-04-07 06:44:36'),
(29, 14, 'Get the job opportunity', 'video', 'Plaese attend full vedio', 'https://youtu.be/-4e3ewcTupM?si=aACXDmgEQRw6y2TA', 17, 1, 1, 1, '2026-04-07 16:06:01', '2026-04-07 16:06:01');

-- --------------------------------------------------------

--
-- Table structure for table `course_modules`
--

CREATE TABLE `course_modules` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_modules`
--

INSERT INTO `course_modules` (`id`, `course_id`, `title`, `description`, `sort_order`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 4, 'Getting Started', 'Introduction and orientation', 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(2, 5, 'Getting Started', 'Introduction and orientation', 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(3, 6, 'Getting Started', 'Introduction and orientation', 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(4, 7, 'Getting Started', 'Introduction and orientation', 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(5, 8, 'Getting Started', 'Introduction and orientation', 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(6, 9, 'Getting Started', 'Introduction and orientation', 1, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(8, 4, 'Core Learning', 'Main concepts and practicals', 2, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(9, 5, 'Core Learning', 'Main concepts and practicals', 2, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(10, 6, 'Core Learning', 'Main concepts and practicals', 2, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(11, 7, 'Core Learning', 'Main concepts and practicals', 2, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(12, 8, 'Core Learning', 'Main concepts and practicals', 2, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(13, 9, 'Core Learning', 'Main concepts and practicals', 2, 1, '2026-04-06 16:48:23', '2026-04-06 16:48:23'),
(14, 4, 'Final Assinment', 'This is the final assignment complete and claim the the reward', 3, 1, '2026-04-07 06:21:59', '2026-04-07 06:21:59');

-- --------------------------------------------------------

--
-- Table structure for table `course_reviews`
--

CREATE TABLE `course_reviews` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `review_text` text DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `course_reviews`
--

INSERT INTO `course_reviews` (`id`, `user_id`, `course_id`, `rating`, `review_text`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 3, 8, 5, 'Great dynamic course', 1, '2026-04-06 17:20:30', '2026-04-06 17:20:30');

-- --------------------------------------------------------

--
-- Table structure for table `course_syllabus`
--

CREATE TABLE `course_syllabus` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `section_title` varchar(255) NOT NULL,
  `item_text` text NOT NULL,
  `section_order` int(11) NOT NULL DEFAULT 0,
  `item_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_wishlist`
--

CREATE TABLE `course_wishlist` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_wishlist`
--

INSERT INTO `course_wishlist` (`id`, `user_id`, `course_id`, `created_at`) VALUES
(1, 3, 4, '2026-04-06 17:17:45'),
(2, 3, 7, '2026-04-06 17:23:12'),
(3, 2, 4, '2026-04-06 17:27:46'),
(4, 2, 5, '2026-04-06 17:29:53'),
(8, 4, 5, '2026-04-06 18:11:03'),
(9, 1, 5, '2026-04-06 19:25:33');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','active','completed') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `user_id`, `course_id`, `payment_method`, `transaction_id`, `enrolled_at`, `status`) VALUES
(3, 3, 8, 'manual', 'TXN-TEST-123', '2026-04-06 17:17:45', 'active'),
(4, 3, 7, 'manual', 'TXN-VERIFY-456', '2026-04-06 17:23:11', 'active'),
(5, 2, 5, 'manual', 'TXN-1775496674379', '2026-04-06 17:31:14', 'active'),
(6, 4, 5, 'manual', 'TXN-1775499052484', '2026-04-06 18:10:52', 'active'),
(7, 1, 5, 'manual', 'TXN-1775503525461', '2026-04-06 19:25:25', 'active'),
(8, 4, 4, 'manual', 'TXN-1775504116071', '2026-04-06 19:35:16', 'active'),
(9, 4, 7, 'manual', 'TXN-1775504483807', '2026-04-06 19:41:23', 'active'),
(10, 4, 6, 'manual', 'TXN-1775578302093', '2026-04-07 16:11:42', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `lesson_resources`
--

CREATE TABLE `lesson_resources` (
  `id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `resource_type` enum('pdf','link','code','image','zip','other') NOT NULL DEFAULT 'link',
  `resource_url` text NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_coupons`
--

CREATE TABLE `payment_coupons` (
  `id` bigint(20) NOT NULL,
  `code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `discount_type` enum('percent','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `min_order_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_coupons`
--

INSERT INTO `payment_coupons` (`id`, `code`, `title`, `discount_type`, `discount_value`, `max_discount`, `min_order_amount`, `usage_limit`, `used_count`, `starts_at`, `ends_at`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'WELCOME10', 'Welcome Discount 10%', 'percent', 10.00, 1000.00, 999.00, 10000, 2, '2026-04-06 22:18:23', '2027-04-06 22:18:23', 1, '2026-04-06 16:48:23', '2026-04-06 17:23:11');

-- --------------------------------------------------------

--
-- Table structure for table `payment_orders`
--

CREATE TABLE `payment_orders` (
  `id` bigint(20) NOT NULL,
  `order_code` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `coupon_id` bigint(20) DEFAULT NULL,
  `status` enum('created','pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'created',
  `gateway` varchar(50) NOT NULL DEFAULT 'manual',
  `gateway_order_id` varchar(255) DEFAULT NULL,
  `gateway_payment_id` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `final_amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'INR',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_orders`
--

INSERT INTO `payment_orders` (`id`, `order_code`, `user_id`, `course_id`, `coupon_id`, `status`, `gateway`, `gateway_order_id`, `gateway_payment_id`, `amount`, `discount_amount`, `final_amount`, `currency`, `metadata`, `paid_at`, `created_at`, `updated_at`) VALUES
(1, 'ORD-20260406191745-901554A1', 3, 8, 1, 'paid', 'manual', NULL, 'TXN-TEST-123', 5999.00, 599.90, 5399.10, 'INR', '{\"courseSlug\":\"web-development\",\"client\":\"web\"}', '2026-04-06 19:17:45', '2026-04-06 17:17:45', '2026-04-06 17:17:45'),
(2, 'ORD-20260406192311-97F05028', 3, 7, 1, 'paid', 'manual', NULL, 'TXN-VERIFY-456', 5999.00, 599.90, 5399.10, 'INR', '{\"courseSlug\":\"nodejs\",\"client\":\"web\"}', '2026-04-06 19:23:11', '2026-04-06 17:23:11', '2026-04-06 17:23:11'),
(3, 'ORD-20260406193111-451C49F2', 2, 5, NULL, 'paid', 'manual', NULL, 'TXN-1775496674379', 6999.00, 0.00, 6999.00, 'INR', '{\"courseSlug\":\"flutter\",\"client\":\"web\"}', '2026-04-06 19:31:14', '2026-04-06 17:31:11', '2026-04-06 17:31:14'),
(4, 'ORD-20260406201047-83926702', 4, 5, NULL, 'paid', 'manual', NULL, 'TXN-1775499052484', 6999.00, 0.00, 6999.00, 'INR', '{\"courseSlug\":\"flutter\",\"client\":\"web\"}', '2026-04-06 20:10:52', '2026-04-06 18:10:47', '2026-04-06 18:10:52'),
(5, 'ORD-20260406212522-EC68B183', 1, 5, NULL, 'paid', 'manual', NULL, 'TXN-1775503525461', 6999.00, 0.00, 6999.00, 'INR', '{\"courseSlug\":\"flutter\",\"client\":\"web\"}', '2026-04-06 21:25:25', '2026-04-06 19:25:22', '2026-04-06 19:25:25'),
(6, 'ORD-20260406213512-74A68F6E', 4, 4, NULL, 'paid', 'manual', NULL, 'TXN-1775504116071', 5999.00, 0.00, 5999.00, 'INR', '{\"courseSlug\":\"web-dev-cohort\",\"client\":\"web\"}', '2026-04-06 21:35:16', '2026-04-06 19:35:12', '2026-04-06 19:35:16'),
(7, 'ORD-20260406214121-E5AD7A1F', 4, 7, NULL, 'paid', 'manual', NULL, 'TXN-1775504483807', 5999.00, 0.00, 5999.00, 'INR', '{\"courseSlug\":\"nodejs\",\"client\":\"web\"}', '2026-04-06 21:41:23', '2026-04-06 19:41:21', '2026-04-06 19:41:23'),
(8, 'ORD-20260407181140-5B844799', 4, 6, NULL, 'paid', 'manual', NULL, 'TXN-1775578302093', 3000.00, 0.00, 3000.00, 'INR', '{\"courseSlug\":\"hacking\",\"client\":\"web\"}', '2026-04-07 18:11:42', '2026-04-07 16:11:40', '2026-04-07 16:11:42');

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` bigint(20) NOT NULL,
  `course_id` int(11) NOT NULL,
  `module_id` int(11) DEFAULT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `pass_percentage` decimal(5,2) NOT NULL DEFAULT 60.00,
  `time_limit_minutes` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`id`, `course_id`, `module_id`, `lesson_id`, `title`, `description`, `pass_percentage`, `time_limit_minutes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, NULL, NULL, 'Web Dev. Cohort - Starter Quiz', 'Auto-generated starter quiz for this course.', 60.00, 20, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(2, 5, NULL, NULL, 'Online Flutter App Development Course - Starter Quiz', 'Auto-generated starter quiz for this course.', 60.00, 20, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(3, 6, NULL, NULL, 'Online Ethical Hacking Courses - Starter Quiz', 'Auto-generated starter quiz for this course.', 60.00, 20, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(4, 7, NULL, NULL, 'Complete Node.js + Express.js + MongoDB - Starter Quiz', 'Auto-generated starter quiz for this course.', 60.00, 20, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(5, 8, NULL, NULL, 'Job Ready AI Powered Cohort: Complete Web Development + DSA + Aptitude - Starter Quiz', 'Auto-generated starter quiz for this course.', 60.00, 20, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(6, 9, NULL, NULL, 'Web Development Master Course @dot 1.0 Batch - Starter Quiz', 'Auto-generated starter quiz for this course.', 60.00, 20, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(8, 4, NULL, NULL, 'Complete Node.js + Express.js + MongoDB - Starter Quiz', 'A GET request is used when the client wants to retrieve data from the server (like fetching a webpage, user data, or products).', 60.00, 2, 1, '2026-04-06 19:40:30', '2026-04-06 19:40:30'),
(9, 6, NULL, NULL, 'introduction to NMAP', 'It helps users discover devices connected to a network and identify open ports, running services, and possible vulnerabilities.', 60.00, 1, 1, '2026-04-07 16:11:05', '2026-04-07 16:11:05');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` bigint(20) NOT NULL,
  `quiz_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` decimal(8,2) NOT NULL DEFAULT 0.00,
  `total_marks` decimal(8,2) NOT NULL DEFAULT 0.00,
  `status` enum('started','submitted','evaluated') NOT NULL DEFAULT 'started',
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answers`)),
  `started_at` datetime NOT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_attempts`
--

INSERT INTO `quiz_attempts` (`id`, `quiz_id`, `user_id`, `score`, `total_marks`, `status`, `answers`, `started_at`, `submitted_at`, `created_at`, `updated_at`) VALUES
(1, 2, 4, 0.00, 1.00, 'evaluated', '{\"2\":\"B\"}', '2026-04-07 00:57:25', '2026-04-07 00:57:25', '2026-04-06 19:27:25', '2026-04-06 19:27:25'),
(2, 2, 4, 0.00, 1.00, 'evaluated', '{\"2\":\"D\"}', '2026-04-07 00:57:31', '2026-04-07 00:57:31', '2026-04-06 19:27:31', '2026-04-06 19:27:31'),
(3, 1, 4, 1.00, 1.00, 'evaluated', '{\"1\":\"A\"}', '2026-04-07 01:05:28', '2026-04-07 01:05:28', '2026-04-06 19:35:28', '2026-04-06 19:35:28'),
(4, 4, 4, 1.00, 1.00, 'evaluated', '{\"4\":\"A\"}', '2026-04-07 01:11:37', '2026-04-07 01:11:37', '2026-04-06 19:41:37', '2026-04-06 19:41:37'),
(5, 8, 4, 1.00, 1.00, 'evaluated', '{\"8\":\"B\"}', '2026-04-07 01:12:44', '2026-04-07 01:12:44', '2026-04-06 19:42:44', '2026-04-06 19:42:44'),
(6, 8, 4, 0.00, 1.00, 'evaluated', '{\"8\":\"A\"}', '2026-04-07 01:13:52', '2026-04-07 01:13:52', '2026-04-06 19:43:52', '2026-04-06 19:43:52'),
(7, 8, 4, 1.00, 1.00, 'evaluated', '{\"8\":\"B\"}', '2026-04-07 01:13:55', '2026-04-07 01:13:55', '2026-04-06 19:43:55', '2026-04-06 19:43:55'),
(8, 9, 4, 1.00, 1.00, 'evaluated', '{\"9\":\"A\"}', '2026-04-07 21:42:22', '2026-04-07 21:42:22', '2026-04-07 16:12:22', '2026-04-07 16:12:22'),
(9, 9, 4, 0.00, 1.00, 'evaluated', '{\"9\":\"B\"}', '2026-04-07 21:42:27', '2026-04-07 21:42:27', '2026-04-07 16:12:27', '2026-04-07 16:12:27'),
(10, 9, 4, 1.00, 1.00, 'evaluated', '{\"9\":\"A\"}', '2026-04-07 21:42:30', '2026-04-07 21:42:30', '2026-04-07 16:12:30', '2026-04-07 16:12:30');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` bigint(20) NOT NULL,
  `quiz_id` bigint(20) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('single','multiple','text') NOT NULL DEFAULT 'single',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `correct_answer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`correct_answer`)),
  `marks` decimal(6,2) NOT NULL DEFAULT 1.00,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `quiz_id`, `question_text`, `question_type`, `options`, `correct_answer`, `marks`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'This is your starter quiz question. Choose option A to pass.', 'single', '[\"A\", \"B\", \"C\", \"D\"]', '\"A\"', 1.00, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(2, 2, 'This is your starter quiz question. Choose option A to pass.', 'single', '[\"A\", \"B\", \"C\", \"D\"]', '\"A\"', 1.00, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(3, 3, 'This is your starter quiz question. Choose option A to pass.', 'single', '[\"A\", \"B\", \"C\", \"D\"]', '\"A\"', 1.00, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(4, 4, 'This is your starter quiz question. Choose option A to pass.', 'single', '[\"A\", \"B\", \"C\", \"D\"]', '\"A\"', 1.00, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(5, 5, 'This is your starter quiz question. Choose option A to pass.', 'single', '[\"A\", \"B\", \"C\", \"D\"]', '\"A\"', 1.00, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(6, 6, 'This is your starter quiz question. Choose option A to pass.', 'single', '[\"A\", \"B\", \"C\", \"D\"]', '\"A\"', 1.00, 1, '2026-04-06 18:20:23', '2026-04-06 18:20:23'),
(8, 8, 'Which method is used to create a GET route in Express? A. app.fetch() B. app.get() C. app.read() D. app.routeget()', 'single', '[\"A\",\"B\",\"C\",\"D\"]', '\"B\"', 1.00, 1, '2026-04-06 19:40:30', '2026-04-06 19:43:30'),
(9, 9, 'What does “Nmap” stand for?  A. Network Mapper B. Node Mapper C. Network Manager D. Node Manager', 'single', '[\"A\",\"B\",\"C\",\"D\"]', '\"A\"', 1.00, 1, '2026-04-07 16:11:05', '2026-04-07 16:11:05');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role` enum('student','instructor','admin') NOT NULL,
  `permission_key` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role`, `permission_key`, `created_at`) VALUES
('student', 'assignment.submit', '2026-04-06 16:48:23'),
('student', 'course.enroll', '2026-04-06 16:48:23'),
('student', 'course.review.create', '2026-04-06 16:48:23'),
('student', 'course.view', '2026-04-06 16:48:23'),
('student', 'course.wishlist.manage', '2026-04-06 16:48:23'),
('student', 'discussion.create', '2026-04-06 16:48:23'),
('student', 'notification.view', '2026-04-06 16:48:23'),
('student', 'progress.update', '2026-04-06 16:48:23'),
('student', 'quiz.attempt', '2026-04-06 16:48:23'),
('instructor', 'analytics.view.own', '2026-04-06 16:48:23'),
('instructor', 'assignment.manage.own', '2026-04-06 16:48:23'),
('instructor', 'course.content.manage.own', '2026-04-06 16:48:23'),
('instructor', 'course.manage.own', '2026-04-06 16:48:23'),
('instructor', 'course.view', '2026-04-06 16:48:23'),
('instructor', 'course.wishlist.manage', '2026-04-06 17:27:21'),
('instructor', 'discussion.create', '2026-04-06 16:48:23'),
('instructor', 'notification.view', '2026-04-06 16:48:23'),
('instructor', 'quiz.manage.own', '2026-04-06 16:48:23'),
('instructor', 'review.moderate.own', '2026-04-06 16:48:23'),
('instructor', 'student.progress.view.own', '2026-04-06 16:48:23'),
('admin', '*', '2026-04-06 16:48:23');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','instructor','admin') DEFAULT 'student',
  `phone` varchar(20) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT 'Male',
  `bio` text DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `phone`, `gender`, `bio`, `profile_image`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@codehub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '1234567890', 'Male', NULL, NULL, '2026-04-06 15:46:26', '2026-04-06 15:46:26'),
(2, 'instructor1', 'instructor@codehub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'instructor', '0987654321', 'Male', NULL, NULL, '2026-04-06 15:46:26', '2026-04-06 15:46:26'),
(3, 'student1', 'student@codehub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', NULL, 'Male', NULL, NULL, '2026-04-06 15:46:26', '2026-04-06 15:46:26'),
(4, 'Rahul Kumar', 'rmahanta175@rku.ac.in', '$2y$10$MxZusqMHOazkx2yVLv4NH.Ri9MoTToYhMqPfdWK.bLgI2mZkDBPGy', 'student', '9804066937', 'Male', NULL, NULL, '2026-04-06 15:48:05', '2026-04-06 15:48:05');

-- --------------------------------------------------------

--
-- Table structure for table `user_course_progress`
--

CREATE TABLE `user_course_progress` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `progress_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `completed_lessons` int(11) NOT NULL DEFAULT 0,
  `total_lessons` int(11) NOT NULL DEFAULT 0,
  `status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  `last_activity_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_course_progress`
--

INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `progress_percent`, `completed_lessons`, `total_lessons`, `status`, `last_activity_at`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 4, 7, 100.00, 5, 5, 'completed', '2026-04-07 21:31:26', '2026-04-07 18:01:26', '2026-04-06 20:15:59', '2026-04-07 16:01:26'),
(25, 4, 4, 100.00, 4, 4, 'completed', '2026-04-07 21:31:02', '2026-04-07 18:01:02', '2026-04-07 05:06:45', '2026-04-07 16:01:02'),
(29, 4, 5, 0.00, 0, 4, 'not_started', '2026-04-07 10:37:00', NULL, '2026-04-07 05:07:00', '2026-04-07 05:07:00');

-- --------------------------------------------------------

--
-- Table structure for table `user_lesson_progress`
--

CREATE TABLE `user_lesson_progress` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `progress_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  `last_watched_second` int(11) NOT NULL DEFAULT 0,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_lesson_progress`
--

INSERT INTO `user_lesson_progress` (`id`, `user_id`, `lesson_id`, `progress_percent`, `status`, `last_watched_second`, `completed_at`, `created_at`, `updated_at`) VALUES
(10, 4, 7, 100.00, 'completed', 0, '2026-04-07 18:01:24', '2026-04-06 20:18:08', '2026-04-07 16:01:24'),
(11, 4, 22, 100.00, 'completed', 0, '2026-04-07 18:01:26', '2026-04-06 20:18:09', '2026-04-07 16:01:26'),
(13, 4, 8, 100.00, 'completed', 0, '2026-04-07 08:45:51', '2026-04-06 20:18:13', '2026-04-07 06:45:51'),
(17, 4, 23, 100.00, 'completed', 0, '2026-04-07 08:41:27', '2026-04-06 20:18:15', '2026-04-07 06:41:27'),
(25, 4, 1, 100.00, 'completed', 0, '2026-04-07 18:01:02', '2026-04-07 05:06:45', '2026-04-07 16:01:02'),
(26, 4, 16, 100.00, 'completed', 0, '2026-04-07 18:00:46', '2026-04-07 05:06:46', '2026-04-07 16:00:46'),
(29, 4, 3, 0.00, 'not_started', 0, NULL, '2026-04-07 05:07:00', '2026-04-07 05:07:00'),
(35, 4, 2, 100.00, 'completed', 0, '2026-04-07 18:01:02', '2026-04-07 06:23:23', '2026-04-07 16:01:02'),
(36, 4, 17, 100.00, 'completed', 0, '2026-04-07 18:01:00', '2026-04-07 06:23:23', '2026-04-07 16:01:00'),
(53, 4, 28, 100.00, 'completed', 0, '2026-04-07 08:46:18', '2026-04-07 06:45:16', '2026-04-07 06:46:18');

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_notifications`
--

INSERT INTO `user_notifications` (`id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `read_at`, `created_at`) VALUES
(1, 3, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":1,\"courseId\":8}', 0, NULL, '2026-04-06 17:17:45'),
(2, 3, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":2,\"courseId\":7}', 0, NULL, '2026-04-06 17:23:11'),
(3, 2, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":3,\"courseId\":5}', 0, NULL, '2026-04-06 17:31:14'),
(4, 4, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":4,\"courseId\":5}', 0, NULL, '2026-04-06 18:10:52'),
(5, 1, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":5,\"courseId\":5}', 0, NULL, '2026-04-06 19:25:25'),
(6, 4, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":6,\"courseId\":4}', 0, NULL, '2026-04-06 19:35:16'),
(7, 4, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":7,\"courseId\":7}', 0, NULL, '2026-04-06 19:41:23'),
(8, 4, 'payment_success', 'Payment Successful', 'Your payment is confirmed and enrollment is active.', '{\"orderId\":8,\"courseId\":6}', 0, NULL, '2026-04-07 16:11:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assignment_course` (`course_id`),
  ADD KEY `fk_assignment_module` (`module_id`),
  ADD KEY `fk_assignment_lesson` (`lesson_id`);

--
-- Indexes for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_assignment_submission` (`assignment_id`,`user_id`),
  ADD KEY `idx_assignment_submission_user` (`user_id`);

--
-- Indexes for table `auth_refresh_tokens`
--
ALTER TABLE `auth_refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_refresh_token_hash` (`token_hash`),
  ADD KEY `idx_refresh_user` (`user_id`),
  ADD KEY `idx_refresh_expires` (`expires_at`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_certificate_code` (`certificate_code`),
  ADD UNIQUE KEY `uq_user_course_certificate` (`user_id`,`course_id`),
  ADD KEY `fk_certificate_course` (`course_id`);

--
-- Indexes for table `coupon_redemptions`
--
ALTER TABLE `coupon_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_coupon_order` (`coupon_id`,`order_id`),
  ADD KEY `idx_coupon_redeem_user` (`user_id`),
  ADD KEY `fk_redemption_order` (`order_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `instructor_id` (`instructor_id`),
  ADD KEY `idx_courses_published` (`is_published`),
  ADD KEY `idx_courses_featured` (`is_featured`),
  ADD KEY `idx_courses_difficulty` (`difficulty_level`),
  ADD KEY `idx_courses_category` (`category_id`);

--
-- Indexes for table `course_discussions`
--
ALTER TABLE `course_discussions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_discussion_course` (`course_id`),
  ADD KEY `idx_discussion_parent` (`parent_id`),
  ADD KEY `fk_discussion_user` (`user_id`);

--
-- Indexes for table `course_lessons`
--
ALTER TABLE `course_lessons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_lesson_order` (`module_id`,`sort_order`),
  ADD KEY `idx_lesson_module` (`module_id`),
  ADD KEY `idx_lesson_type` (`lesson_type`);

--
-- Indexes for table `course_modules`
--
ALTER TABLE `course_modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_module_order` (`course_id`,`sort_order`),
  ADD KEY `idx_module_course` (`course_id`);

--
-- Indexes for table `course_reviews`
--
ALTER TABLE `course_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_review_user_course` (`user_id`,`course_id`),
  ADD KEY `idx_review_course` (`course_id`);

--
-- Indexes for table `course_syllabus`
--
ALTER TABLE `course_syllabus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `course_wishlist`
--
ALTER TABLE `course_wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wishlist` (`user_id`,`course_id`),
  ADD KEY `idx_wishlist_course` (`course_id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment` (`user_id`,`course_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `lesson_resources`
--
ALTER TABLE `lesson_resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_resource_lesson` (`lesson_id`);

--
-- Indexes for table `payment_coupons`
--
ALTER TABLE `payment_coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_coupon_code` (`code`),
  ADD KEY `idx_coupon_active` (`is_active`);

--
-- Indexes for table `payment_orders`
--
ALTER TABLE `payment_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_code` (`order_code`),
  ADD KEY `idx_payment_user` (`user_id`),
  ADD KEY `idx_payment_course` (`course_id`),
  ADD KEY `idx_payment_status` (`status`),
  ADD KEY `fk_payment_coupon` (`coupon_id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quiz_course` (`course_id`),
  ADD KEY `fk_quiz_module` (`module_id`),
  ADD KEY `fk_quiz_lesson` (`lesson_id`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attempt_quiz` (`quiz_id`),
  ADD KEY `idx_attempt_user` (`user_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_question_quiz` (`quiz_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role`,`permission_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_course_progress`
--
ALTER TABLE `user_course_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_course_progress` (`user_id`,`course_id`),
  ADD KEY `idx_course_progress_course` (`course_id`);

--
-- Indexes for table `user_lesson_progress`
--
ALTER TABLE `user_lesson_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_lesson_progress` (`user_id`,`lesson_id`),
  ADD KEY `idx_progress_user` (`user_id`),
  ADD KEY `idx_progress_lesson` (`lesson_id`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_user` (`user_id`),
  ADD KEY `idx_notification_read` (`is_read`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `auth_refresh_tokens`
--
ALTER TABLE `auth_refresh_tokens`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `coupon_redemptions`
--
ALTER TABLE `coupon_redemptions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `course_discussions`
--
ALTER TABLE `course_discussions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_lessons`
--
ALTER TABLE `course_lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `course_modules`
--
ALTER TABLE `course_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `course_reviews`
--
ALTER TABLE `course_reviews`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_syllabus`
--
ALTER TABLE `course_syllabus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `course_wishlist`
--
ALTER TABLE `course_wishlist`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `lesson_resources`
--
ALTER TABLE `lesson_resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_coupons`
--
ALTER TABLE `payment_coupons`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_orders`
--
ALTER TABLE `payment_orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_course_progress`
--
ALTER TABLE `user_course_progress`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `user_lesson_progress`
--
ALTER TABLE `user_lesson_progress`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `fk_assignment_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_assignment_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_assignment_module` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD CONSTRAINT `fk_submission_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_submission_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `auth_refresh_tokens`
--
ALTER TABLE `auth_refresh_tokens`
  ADD CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `fk_certificate_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_certificate_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `coupon_redemptions`
--
ALTER TABLE `coupon_redemptions`
  ADD CONSTRAINT `fk_redemption_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `payment_coupons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_redemption_order` FOREIGN KEY (`order_id`) REFERENCES `payment_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_redemption_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_discussions`
--
ALTER TABLE `course_discussions`
  ADD CONSTRAINT `fk_discussion_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_discussion_parent` FOREIGN KEY (`parent_id`) REFERENCES `course_discussions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_discussion_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_lessons`
--
ALTER TABLE `course_lessons`
  ADD CONSTRAINT `fk_lesson_module` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_modules`
--
ALTER TABLE `course_modules`
  ADD CONSTRAINT `fk_module_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_reviews`
--
ALTER TABLE `course_reviews`
  ADD CONSTRAINT `fk_review_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_syllabus`
--
ALTER TABLE `course_syllabus`
  ADD CONSTRAINT `course_syllabus_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_wishlist`
--
ALTER TABLE `course_wishlist`
  ADD CONSTRAINT `fk_wishlist_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_resources`
--
ALTER TABLE `lesson_resources`
  ADD CONSTRAINT `fk_resource_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_orders`
--
ALTER TABLE `payment_orders`
  ADD CONSTRAINT `fk_payment_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `payment_coupons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payment_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `fk_quiz_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_quiz_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_quiz_module` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `fk_attempt_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_attempt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `fk_question_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_course_progress`
--
ALTER TABLE `user_course_progress`
  ADD CONSTRAINT `fk_course_progress_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_course_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_lesson_progress`
--
ALTER TABLE `user_lesson_progress`
  ADD CONSTRAINT `fk_progress_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
