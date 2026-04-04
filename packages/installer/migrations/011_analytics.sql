-- Corexpress — Page View Analytics
CREATE TABLE IF NOT EXISTS `page_views` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `page_slug`  VARCHAR(255) NOT NULL COMMENT 'Post slug, or __home__, __about__',
    `ip_hash`    CHAR(64)     NOT NULL COMMENT 'SHA-256(ip + session_key) — no raw IPs stored',
    `date_key`   DATE         NOT NULL COMMENT 'DATE(viewed_at) — enables per-day dedup at DB level',
    `viewed_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_page_view` (`ip_hash`, `page_slug`, `date_key`),
    INDEX `idx_page_views_date` (`viewed_at`),
    INDEX `idx_page_views_slug_date` (`page_slug`, `date_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
