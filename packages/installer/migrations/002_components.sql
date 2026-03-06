-- ─────────────────────────────────────────────────────────────────────────────
-- Corexpress — Component Architecture Schema
-- Migration 002 — Component-based blog layout + style collections
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Component definitions (static registry of all known component types) ──────
-- type: 'component' = top-level section | 'sub-component' = child of a parent component
-- parent_id: NULL for top-level; references the parent component row id for sub-components
-- has_own_page: 1 = has a dedicated public route (e.g. /post/{slug})
CREATE TABLE IF NOT EXISTS `component_definitions` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`         VARCHAR(100) NOT NULL COMMENT 'slug: hero, profile, post-list, etc.',
    `label`        VARCHAR(255) NOT NULL COMMENT 'Human-readable label for admin UI',
    `type`         ENUM('component','sub-component') NOT NULL DEFAULT 'component',
    `parent_id`    INT UNSIGNED NULL,
    `has_own_page` TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_component_definitions_name` (`name`),
    CONSTRAINT `fk_cd_parent` FOREIGN KEY (`parent_id`)
        REFERENCES `component_definitions` (`id`) ON DELETE CASCADE
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
-- type: 'component' = top-level | 'sub-component' = child of parent_id
-- parent_id references the parent component row; NULL for top-level
-- has_own_page: 1 = has a dedicated public route
INSERT INTO `component_definitions` (`name`, `label`, `type`, `parent_id`, `has_own_page`) VALUES
    ('hero',               'Hero Banner',  'component',     NULL, 0),
    ('profile',            'Profile',      'component',     NULL, 1),
    ('post-list',          'Post List',    'component',     NULL, 0),
    ('post-detail',        'Post Detail',  'component',     NULL, 1),
    ('comment-form',       'Comment Form', 'sub-component', 4,    0),
    ('comment-list',       'Comment List', 'sub-component', 4,    0),
    ('social-links',       'Social Links', 'component',     NULL, 0),
    ('about-gallery',      'Gallery',      'sub-component', 2,    0),
    ('about-experience',   'Experience',   'sub-component', 2,    0),
    ('about-skills',       'Skills',       'sub-component', 2,    0),
    ('about-education',    'Education',    'sub-component', 2,    0),
    ('about-testimonials', 'Testimonials', 'sub-component', 2,    0);

-- Style collections (2 built-in — default is the fallback)
INSERT INTO `style_collections` (`name`, `label`, `is_default`) VALUES
    ('default', 'Default', 1),
    ('classic', 'Classic', 0);

-- Default collection styles (covers all 12 components)
INSERT INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (1, 1,  '{"background":"#f8f9fa","textColor":"#111827","layout":"full-width"}'),
    (1, 2,  '{"background":"#ffffff","textColor":"#111827","layout":"centered"}'),
    (1, 3,  '{"background":"#ffffff","textColor":"#111827","layout":"list"}'),
    (1, 4,  '{"background":"#ffffff","textColor":"#111827","layout":"article"}'),
    (1, 5,  '{"background":"#f8f9fa","textColor":"#111827","layout":"card"}'),
    (1, 6,  '{"background":"#ffffff","textColor":"#111827","layout":"list"}'),
    (1, 7,  '{"background":"#ffffff","textColor":"#6b7280","layout":"inline"}'),
    (1, 8,  '{"background":"#ffffff","textColor":"#111827","layout":"carousel"}'),
    (1, 9,  '{"background":"#ffffff","textColor":"#111827","layout":"card"}'),
    (1, 10, '{"background":"#f8f9fa","textColor":"#111827","layout":"grid"}'),
    (1, 11, '{"background":"#ffffff","textColor":"#111827","layout":"two-col"}'),
    (1, 12, '{"background":"#ffffff","textColor":"#111827","layout":"carousel"}');

-- Classic collection styles (all 12 components — editorial layout)
INSERT INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (2, 1,  '{"background":"#fafafa","textColor":"#111827","layout":"editorial"}'),
    (2, 2,  '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}'),
    (2, 3,  '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}'),
    (2, 4,  '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}'),
    (2, 5,  '{"background":"#fafafa","textColor":"#111827","layout":"editorial"}'),
    (2, 6,  '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}'),
    (2, 7,  '{"background":"#ffffff","textColor":"#6b7280","layout":"editorial"}'),
    (2, 8,  '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}'),
    (2, 9,  '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}'),
    (2, 10, '{"background":"#f8f9fa","textColor":"#111827","layout":"editorial"}'),
    (2, 11, '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}'),
    (2, 12, '{"background":"#ffffff","textColor":"#111827","layout":"editorial"}');

-- Pages (home, blog, about)
INSERT INTO `pages` (`slug`, `title`) VALUES
    ('home',  'Home'),
    ('blog',  'Blog'),
    ('about', 'About');

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

-- About page components (page_id=3): sub-components visible by default; social-links visible
INSERT INTO `page_components` (`page_id`, `component_definition_id`, `is_visible`, `display_order`) VALUES
    (3, 8,  1, 1),
    (3, 9,  1, 2),
    (3, 10, 1, 3),
    (3, 11, 1, 4),
    (3, 12, 1, 5),
    (3, 7,  1, 6);

-- Active style collection setting
INSERT INTO `settings` (`key`, `value`) VALUES
    ('active_style_collection', 'default')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
