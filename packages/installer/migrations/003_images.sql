-- ─────────────────────────────────────────────────────────────────────────────
-- Corexpress — Image Library Schema
-- Migration 003 — Image uploads storage
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `images` (
    `id`            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `post_id`       INT UNSIGNED  NULL     COMMENT 'Loose reference to the post this image was uploaded for',
    `filename`      VARCHAR(255)  NOT NULL COMMENT 'Stored filename (random hex + extension)',
    `original_name` VARCHAR(255)  NOT NULL COMMENT 'Original filename provided by the uploader',
    `mime_type`     VARCHAR(100)  NOT NULL,
    `file_size`     INT UNSIGNED  NOT NULL COMMENT 'Size in bytes',
    `created_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_images_post` (`post_id`),
    CONSTRAINT `fk_images_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
