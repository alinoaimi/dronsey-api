-- -------------------------------------------------------------
-- -------------------------------------------------------------
-- TablePlus 1.3.8
--
-- https://tableplus.com/
--
-- Database: mariadb
-- Generation Time: 2026-02-05 14:41:36.371345
-- -------------------------------------------------------------

-- Save current session settings and set optimal values for import
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;
SET NAMES utf8mb4;

CREATE TABLE `drones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status` tinytext DEFAULT NULL,
  `current_location` point DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `drones_location_history` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `drone_id` bigint(20) unsigned DEFAULT NULL,
  `create_time` bigint(20) unsigned DEFAULT NULL,
  `location` point DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `order_uuid` uuid DEFAULT NULL,
  `pickup_location` point DEFAULT NULL,
  `dropoff_location` point DEFAULT NULL,
  `pickup_address` longtext DEFAULT NULL COMMENT 'as JSON',
  `dropoff_address` longtext DEFAULT NULL COMMENT 'as JSON',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `orders_drones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `drone_id` bigint(20) unsigned DEFAULT NULL,
  `assign_time` bigint(20) unsigned DEFAULT NULL,
  `deassign_time` bigint(20) unsigned DEFAULT NULL,
  `pickup_time` bigint(20) unsigned DEFAULT NULL,
  `release_time` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('admin','user','drone') NOT NULL DEFAULT 'user',
  `create_time` bigint(20) unsigned NOT NULL,
  `update_time` bigint(20) unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `drone_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Restore original session settings
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;
SET SQL_NOTES=@OLD_SQL_NOTES;
