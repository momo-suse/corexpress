-- Corexpress — Performance indexes
-- Adds the indexes that back the hottest queries so MySQL stops doing
-- full-table scans + filesort on every public request.

-- Public post list: WHERE status='published' ORDER BY created_at DESC (PostController::index)
ALTER TABLE `posts`       ADD INDEX `idx_posts_status_created` (`status`, `created_at`);

-- Comment counts filtered by status (withCount in PostController index/show)
-- (post_id alone is already indexed by InnoDB via the foreign key)
ALTER TABLE `comments`    ADD INDEX `idx_comments_post_status` (`post_id`, `status`);

-- Active subscriber lookup (Mailer::notifySubscribers, SubscriberController)
ALTER TABLE `subscribers` ADD INDEX `idx_subscribers_subscribed` (`subscribed`);
