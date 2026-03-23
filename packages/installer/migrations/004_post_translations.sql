-- ─────────────────────────────────────────────────────────────────────────────
-- Corexpress — Post Translations Schema
-- Migration 004 — Post translations (multilingual content per post)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE `post_translations` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `post_id`    INT UNSIGNED    NOT NULL,
  `locale`     VARCHAR(10)     NOT NULL,
  `title`      VARCHAR(500)    NOT NULL,
  `content`    LONGTEXT        NOT NULL,
  `excerpt`    TEXT            NULL,
  `created_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_translation` (`post_id`, `locale`),
  CONSTRAINT `fk_pt_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
