-- Migration 008 — Add Atlas style collection
-- Travel/explorer journal: stone-50 bg, amber-700 accent, emerald-950 secondary, serif/mono, 0px radius.

INSERT IGNORE INTO `style_collections` (`name`, `label`, `is_default`) VALUES ('atlas', 'Atlas', 0);

-- Look up the id by name so re-running on an already-seeded DB is a no-op
-- (LAST_INSERT_ID() would be stale when the IGNORE above skips the insert).
SET @col_id = (SELECT `id` FROM `style_collections` WHERE `name` = 'atlas');

INSERT IGNORE INTO `component_styles` (`collection_id`, `component_definition_id`, `styles_config`) VALUES
    (@col_id, 1,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-hero"}'),
    (@col_id, 2,  '{"background":"#022c22","textColor":"#fafaf9","layout":"atlas-profile"}'),
    (@col_id, 3,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-post-list"}'),
    (@col_id, 4,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-post-detail"}'),
    (@col_id, 5,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-comment-form"}'),
    (@col_id, 6,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-comment-list"}'),
    (@col_id, 7,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-social-links"}'),
    (@col_id, 8,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-gallery"}'),
    (@col_id, 9,  '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-experience"}'),
    (@col_id, 10, '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-skills"}'),
    (@col_id, 11, '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-education"}'),
    (@col_id, 12, '{"background":"#022c22","textColor":"#fafaf9","layout":"atlas-testimonials"}'),
    (@col_id, 13, '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-search"}'),
    (@col_id, 14, '{"background":"#fafaf9","textColor":"#1c1917","layout":"atlas-tags"}'),
    (@col_id, 15, '{"background":"#022c22","textColor":"#fafaf9","layout":"atlas-pdf"}');
