-- Migration 007 — Add sonic style collection
-- Brutalista musical: dark zinc-950 bg, fuchsia/cyan accents, sharp edges, grayscale images

INSERT INTO `style_collections` (`name`, `label`, `is_default`) VALUES ('sonic', 'Sonic', 0);

-- Capture the new id once — safer than calling LAST_INSERT_ID() on every row
SET @col_id = LAST_INSERT_ID();

INSERT INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (@col_id, 1,  '{"background":"#09090b","textColor":"#f4f4f5","layout":"sonic-hero"}'),
    (@col_id, 2,  '{"background":"#09090b","textColor":"#f4f4f5","layout":"sonic-profile"}'),
    (@col_id, 3,  '{"background":"#09090b","textColor":"#f4f4f5","layout":"sonic-post-list"}'),
    (@col_id, 4,  '{"background":"#09090b","textColor":"#f4f4f5","layout":"sonic-post-detail"}'),
    (@col_id, 5,  '{"background":"#18181b","textColor":"#f4f4f5","layout":"sonic-comment-form"}'),
    (@col_id, 6,  '{"background":"#18181b","textColor":"#f4f4f5","layout":"sonic-comment-list"}'),
    (@col_id, 7,  '{"background":"#09090b","textColor":"#a1a1aa","layout":"sonic-social-links"}'),
    (@col_id, 8,  '{"background":"#18181b","textColor":"#f4f4f5","layout":"sonic-gallery"}'),
    (@col_id, 9,  '{"background":"#18181b","textColor":"#f4f4f5","layout":"sonic-experience"}'),
    (@col_id, 10, '{"background":"#18181b","textColor":"#f4f4f5","layout":"sonic-skills"}'),
    (@col_id, 11, '{"background":"#18181b","textColor":"#f4f4f5","layout":"sonic-education"}'),
    (@col_id, 12, '{"background":"#18181b","textColor":"#f4f4f5","layout":"sonic-testimonials"}'),
    (@col_id, 13, '{"background":"#09090b","textColor":"#f4f4f5","layout":"sonic-search"}'),
    (@col_id, 14, '{"background":"#09090b","textColor":"#f4f4f5","layout":"sonic-tags"}'),
    (@col_id, 15, '{"background":"#09090b","textColor":"#f4f4f5","layout":"sonic-pdf"}');
