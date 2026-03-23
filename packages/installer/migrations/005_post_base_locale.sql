ALTER TABLE `posts`
  ADD COLUMN `base_locale` VARCHAR(10) NOT NULL DEFAULT 'en'
  AFTER `slug`;
