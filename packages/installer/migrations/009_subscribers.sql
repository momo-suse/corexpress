-- Migration 009 — Subscribers: Google OAuth, email notifications, and page component

CREATE TABLE IF NOT EXISTS `subscribers` (
    `id`                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `google_id`          VARCHAR(255)  NOT NULL,
    `name`               VARCHAR(255)  NOT NULL,
    `email`              VARCHAR(255)  NOT NULL,
    `avatar_url`         VARCHAR(2048) NULL,
    `unsubscribe_token`  VARCHAR(64)   NOT NULL,
    `subscribed`         TINYINT(1)    NOT NULL DEFAULT 1,
    `created_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_subscribers_google_id` (`google_id`),
    UNIQUE KEY `uq_subscribers_email` (`email`),
    UNIQUE KEY `uq_subscribers_unsubscribe_token` (`unsubscribe_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `comments`
    ADD COLUMN `subscriber_id` INT UNSIGNED NULL AFTER `post_id`,
    ADD CONSTRAINT `fk_comments_subscriber`
        FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers` (`id`) ON DELETE SET NULL;

ALTER TABLE `posts`
    ADD COLUMN `notified_at` TIMESTAMP NULL AFTER `status`;

-- Register subscriber as a toggleable page component
INSERT IGNORE INTO `component_definitions` (`name`, `label`, `type`, `parent_id`, `has_own_page`)
VALUES ('subscriber', 'Subscriber Section', 'component', NULL, 0);

INSERT IGNORE INTO `page_components` (`page_id`, `component_definition_id`, `is_visible`, `display_order`)
SELECT p.`id`, cd.`id`, 1, 99
FROM `pages` p, `component_definitions` cd
WHERE p.`slug` IN ('home', 'blog', 'about') AND cd.`name` = 'subscriber';

INSERT IGNORE INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`)
SELECT sc.`id`, cd.`id`, '{}'
FROM `style_collections` sc, `component_definitions` cd
WHERE cd.`name` = 'subscriber';
