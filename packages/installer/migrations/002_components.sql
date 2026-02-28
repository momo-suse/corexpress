-- ─────────────────────────────────────────────────────────────────────────────
-- Corexpress — Component Architecture Schema
-- Migration 002 — Component-based blog layout + style collections
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Component definitions (static registry of all known component types) ──────
CREATE TABLE IF NOT EXISTS `component_definitions` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100) NOT NULL COMMENT 'slug: hero, profile, post-list, etc.',
    `label`      VARCHAR(255) NOT NULL COMMENT 'Human-readable label for admin UI',
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_component_definitions_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Style collections (theme packs — each is a named set of component styles) ─
CREATE TABLE IF NOT EXISTS `style_collections` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100) NOT NULL COMMENT 'slug: default, minimal, dark',
    `label`      VARCHAR(255) NOT NULL COMMENT 'Human-readable label',
    `is_default` TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = fallback collection used when active collection lacks a component style',
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_style_collections_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Component styles (semantic JSON config per collection + component pair) ────
CREATE TABLE IF NOT EXISTS `component_styles` (
    `id`                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `collection_id`           INT UNSIGNED NOT NULL,
    `component_definition_id` INT UNSIGNED NOT NULL,
    `styles_config`           JSON         NOT NULL COMMENT 'e.g. {"background":"#fff","textColor":"#111","layout":"card"}',
    `created_at`              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_component_styles_pair` (`collection_id`, `component_definition_id`),
    CONSTRAINT `fk_cs_collection`  FOREIGN KEY (`collection_id`)           REFERENCES `style_collections`    (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cs_definition`  FOREIGN KEY (`component_definition_id`) REFERENCES `component_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Blog pages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pages` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug`       VARCHAR(100) NOT NULL COMMENT 'e.g. home, blog',
    `title`      VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_pages_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Page components (pivot: which components appear on which pages) ────────────
CREATE TABLE IF NOT EXISTS `page_components` (
    `id`                      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `page_id`                 INT UNSIGNED     NOT NULL,
    `component_definition_id` INT UNSIGNED     NOT NULL,
    `is_visible`              TINYINT(1)       NOT NULL DEFAULT 1,
    `display_order`           TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at`              TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`              TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_page_components_pair` (`page_id`, `component_definition_id`),
    KEY `idx_page_components_page` (`page_id`),
    CONSTRAINT `fk_pc_page`       FOREIGN KEY (`page_id`)                  REFERENCES `pages`                (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pc_definition` FOREIGN KEY (`component_definition_id`)  REFERENCES `component_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────────────────────────────────────

-- Component definitions (7 predefined types)
INSERT INTO `component_definitions` (`name`, `label`) VALUES
    ('hero',         'Hero Banner'),
    ('profile',      'Profile'),
    ('post-list',    'Post List'),
    ('post-detail',  'Post Detail'),
    ('comment-form', 'Comment Form'),
    ('comment-list', 'Comment List'),
    ('social-links', 'Social Links');

-- Style collections (3 built-in — default is the fallback)
INSERT INTO `style_collections` (`name`, `label`, `is_default`) VALUES
    ('default', 'Default', 1),
    ('minimal', 'Minimal', 0),
    ('dark',    'Dark',    0);

-- Default collection styles (covers all 7 components)
INSERT INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (1, 1, '{"background":"#f8f9fa","textColor":"#111827","layout":"full-width"}'),
    (1, 2, '{"background":"#ffffff","textColor":"#111827","layout":"centered"}'),
    (1, 3, '{"background":"#ffffff","textColor":"#111827","layout":"list"}'),
    (1, 4, '{"background":"#ffffff","textColor":"#111827","layout":"article"}'),
    (1, 5, '{"background":"#f8f9fa","textColor":"#111827","layout":"card"}'),
    (1, 6, '{"background":"#ffffff","textColor":"#111827","layout":"list"}'),
    (1, 7, '{"background":"#ffffff","textColor":"#6b7280","layout":"inline"}');

-- Minimal collection styles (all 7 components)
INSERT INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (2, 1, '{"background":"#ffffff","textColor":"#374151","layout":"minimal"}'),
    (2, 2, '{"background":"#ffffff","textColor":"#374151","layout":"minimal"}'),
    (2, 3, '{"background":"#ffffff","textColor":"#374151","layout":"minimal"}'),
    (2, 4, '{"background":"#ffffff","textColor":"#374151","layout":"minimal"}'),
    (2, 5, '{"background":"#ffffff","textColor":"#374151","layout":"minimal"}'),
    (2, 6, '{"background":"#ffffff","textColor":"#374151","layout":"minimal"}'),
    (2, 7, '{"background":"#ffffff","textColor":"#374151","layout":"minimal"}');

-- Dark collection styles (all 7 components)
INSERT INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (3, 1, '{"background":"#111827","textColor":"#f9fafb","layout":"full-width"}'),
    (3, 2, '{"background":"#1f2937","textColor":"#f9fafb","layout":"centered"}'),
    (3, 3, '{"background":"#1f2937","textColor":"#f9fafb","layout":"list"}'),
    (3, 4, '{"background":"#1f2937","textColor":"#f9fafb","layout":"article"}'),
    (3, 5, '{"background":"#111827","textColor":"#f9fafb","layout":"card"}'),
    (3, 6, '{"background":"#1f2937","textColor":"#f9fafb","layout":"list"}'),
    (3, 7, '{"background":"#1f2937","textColor":"#9ca3af","layout":"inline"}');

-- Pages (home and blog)
INSERT INTO `pages` (`slug`, `title`) VALUES
    ('home', 'Home'),
    ('blog', 'Blog');

-- Home page components (page_id=1): hero, profile, post-list visible; social-links hidden
INSERT INTO `page_components` (`page_id`, `component_definition_id`, `is_visible`, `display_order`) VALUES
    (1, 1, 1, 1),
    (1, 2, 1, 2),
    (1, 3, 1, 3),
    (1, 7, 0, 4);

-- Blog page components (page_id=2): post-list, post-detail, comment-list, comment-form visible
INSERT INTO `page_components` (`page_id`, `component_definition_id`, `is_visible`, `display_order`) VALUES
    (2, 3, 1, 1),
    (2, 4, 1, 2),
    (2, 6, 1, 3),
    (2, 5, 1, 4);

-- Active style collection setting
INSERT INTO `settings` (`key`, `value`) VALUES
    ('active_style_collection', 'default')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
