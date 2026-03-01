-- ─────────────────────────────────────────────────────────────────────────────
-- Corexpress — Initial Database Schema
-- Run by the web installer during installation (Step 5)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `email`         VARCHAR(255)    NOT NULL,
    `password_hash` VARCHAR(255)    NOT NULL,
    `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Key-value settings store ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `settings` (
    `key`        VARCHAR(100)   NOT NULL,
    `value`      TEXT           NOT NULL,
    `created_at` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Blog posts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `posts` (
    `id`                 INT UNSIGNED                       NOT NULL AUTO_INCREMENT,
    `user_id`            INT UNSIGNED                       NOT NULL,
    `title`              VARCHAR(500)                       NOT NULL,
    `slug`               VARCHAR(500)                       NOT NULL,
    `content`            LONGTEXT                           NOT NULL,
    `excerpt`            TEXT,
    `tags`               VARCHAR(500)                       NULL     DEFAULT NULL,
    `featured_image_id`  INT UNSIGNED                       NULL     DEFAULT NULL COMMENT 'Optional thumbnail / hero image for the post',
    `map_embed_url`      VARCHAR(2048)                      NULL     DEFAULT NULL COMMENT 'Optional map embed URL (Google Maps, OpenStreetMap, etc.)',
    `status`             ENUM('draft','published')          NOT NULL DEFAULT 'draft',
    `created_at`         TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_posts_slug` (`slug`),
    CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Comments ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `comments` (
    `id`           INT UNSIGNED                          NOT NULL AUTO_INCREMENT,
    `post_id`      INT UNSIGNED                          NOT NULL,
    `author_name`  VARCHAR(255)                          NOT NULL,
    `author_email` VARCHAR(255)                          NOT NULL,
    `content`      TEXT                                  NOT NULL,
    `status`       ENUM('pending','approved','spam')     NOT NULL DEFAULT 'pending',
    `created_at`   TIMESTAMP                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
