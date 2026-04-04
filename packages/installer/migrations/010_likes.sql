-- Corexpress — Post Likes
ALTER TABLE `posts` ADD COLUMN `likes_count` INT UNSIGNED NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `post_likes` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `post_id`    INT UNSIGNED NOT NULL,
    `ip_hash`    CHAR(64)     NOT NULL COMMENT 'SHA-256(ip + session_key) — no raw IPs stored',
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_post_like` (`post_id`, `ip_hash`),
    INDEX `idx_post_likes_post` (`post_id`),
    CONSTRAINT `fk_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
