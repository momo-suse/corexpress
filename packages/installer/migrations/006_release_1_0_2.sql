ALTER TABLE `posts`
  MODIFY COLUMN `status` ENUM('draft','published','hidden') NOT NULL DEFAULT 'draft';

-- ── Zen style collection ───────────────────────────────────────────────────
INSERT INTO `style_collections` (`name`, `label`, `is_default`) VALUES ('zen', 'Zen', 0);

INSERT INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (LAST_INSERT_ID(), 1,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-hero"}'),
    (LAST_INSERT_ID(), 2,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-profile"}'),
    (LAST_INSERT_ID(), 3,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-post-list"}'),
    (LAST_INSERT_ID(), 4,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-post-detail"}'),
    (LAST_INSERT_ID(), 5,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-comment-form"}'),
    (LAST_INSERT_ID(), 6,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-comment-list"}'),
    (LAST_INSERT_ID(), 7,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-social-links"}'),
    (LAST_INSERT_ID(), 8,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-search"}'),
    (LAST_INSERT_ID(), 9,  '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen-tag-cloud"}'),
    (LAST_INSERT_ID(), 10, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (LAST_INSERT_ID(), 11, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (LAST_INSERT_ID(), 12, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (LAST_INSERT_ID(), 13, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (LAST_INSERT_ID(), 14, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}'),
    (LAST_INSERT_ID(), 15, '{"background":"#F7F5F0","textColor":"#2D2B2A","layout":"zen"}');
