ALTER TABLE `posts`
  MODIFY COLUMN `status` ENUM('draft','published','hidden') NOT NULL DEFAULT 'draft';

-- ── Zen style collection ───────────────────────────────────────────────────
-- INSERT IGNORE + lookup-by-name so re-running on an already-seeded DB is a no-op
-- (LAST_INSERT_ID() would be stale on re-run when the IGNORE skips the insert).
INSERT IGNORE INTO `style_collections` (`name`, `label`, `is_default`) VALUES ('zen', 'Zen', 0);

SET @col_id = (SELECT `id` FROM `style_collections` WHERE `name` = 'zen');

INSERT IGNORE INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (@col_id, 1,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-hero"}'),
    (@col_id, 2,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-profile"}'),
    (@col_id, 3,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-post-list"}'),
    (@col_id, 4,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-post-detail"}'),
    (@col_id, 5,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-comment-form"}'),
    (@col_id, 6,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-comment-list"}'),
    (@col_id, 7,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-social-links"}'),
    (@col_id, 8,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-search"}'),
    (@col_id, 9,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-tag-cloud"}'),
    (@col_id, 10, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (@col_id, 11, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (@col_id, 12, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (@col_id, 13, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (@col_id, 14, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (@col_id, 15, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}');
