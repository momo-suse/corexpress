<?php

declare(strict_types=1);

namespace Corexpress\Services;

use Corexpress\Models\Setting;
use Corexpress\Models\StyleCollection;
use Illuminate\Database\Capsule\Manager as DB;

final class BackupService
{
    private const FORMAT = 'corexpress-backup-v1';
    private const BLOCKS = ['appearance', 'content', 'subscribers', 'activity', 'media'];
    private const SETTINGS_ALLOWLIST = [
        'blog_name',
        'blog_description',
        'blog_theme',
        'active_style_collection',
        'app_locale',
        'blog_logo_id',
        'hero_text',
        'hero_image_id',
        'profile_name',
        'profile_summary',
        'profile_description',
        'profile_image_id',
        'profile_cover_id',
        'profile_title',
        'profile_experience',
        'profile_skills',
        'profile_gallery',
        'profile_education',
        'profile_certifications',
        'profile_testimonials',
        'social_linkedin',
        'social_instagram',
        'social_youtube',
        'social_facebook',
        'comments_enabled',
        'tags_max_count',
        'likes_enabled',
    ];
    private const IMAGE_SETTING_KEYS = [
        'blog_logo_id',
        'hero_image_id',
        'profile_image_id',
        'profile_cover_id',
    ];

    private string $appRoot;
    private string $imgDir;

    public function __construct()
    {
        $this->appRoot = dirname(__DIR__, 2);
        $this->imgDir = $this->appRoot . '/public/img';
    }

    /**
     * @param array<int, mixed> $requestedBlocks
     * @return array{path: string, filename: string, manifest: array<string, mixed>}
     */
    public function exportArchive(array $requestedBlocks, bool $includeMediaFiles): array
    {
        $bundle = $this->buildBundle($requestedBlocks, $includeMediaFiles);
        $path = $this->tempZipPath('corexpress-backup-');

        $this->writeBundleToZip($bundle, $path);

        return [
            'path' => $path,
            'filename' => 'corexpress-backup-' . date('Ymd-His') . '.zip',
            'manifest' => $bundle['manifest'],
        ];
    }

    public function inspectArchive(string $zipPath): array
    {
        $bundle = $this->readBundleFromZip($zipPath);
        $manifest = $bundle['manifest'];

        return [
            'format' => $manifest['format'],
            'exported_at' => $manifest['exported_at'],
            'app_version' => $manifest['app_version'],
            'available_blocks' => $manifest['blocks'],
            'block_counts' => $manifest['block_counts'],
            'record_counts' => $manifest['record_counts'],
            'has_media_files' => $manifest['has_media_files'],
            'warnings' => $manifest['warnings'],
        ];
    }

    /**
     * @param array<int, mixed> $requestedBlocks
     * @return array<string, mixed>
     */
    public function restoreArchive(string $zipPath, array $requestedBlocks, int $currentUserId): array
    {
        if ($currentUserId <= 0) {
            throw new \InvalidArgumentException('Only an authenticated admin can restore a backup.');
        }

        $bundle = $this->readBundleFromZip($zipPath);
        $availableBlocks = $this->normalizeBlocks($bundle['manifest']['blocks']);
        $selectedBlocks = array_values(array_intersect($this->normalizeBlocks($requestedBlocks), $availableBlocks));

        if ($selectedBlocks === []) {
            throw new \InvalidArgumentException('Choose at least one valid block to restore.');
        }

        if (in_array('activity', $selectedBlocks, true) && !in_array('content', $selectedBlocks, true)) {
            throw new \InvalidArgumentException('The activity block can only be restored together with content.');
        }

        $rollbackArchive = $this->exportArchive(
            $selectedBlocks,
            in_array('media', $selectedBlocks, true) && (bool) $bundle['manifest']['has_media_files']
        )['path'];

        $mediaSnapshotDir = null;
        $mediaStageDir = null;

        try {
            if (in_array('media', $selectedBlocks, true) && (bool) $bundle['manifest']['has_media_files']) {
                $mediaSnapshotDir = $this->snapshotImageDirectory();
                $mediaStageDir = $this->extractMediaFiles($zipPath);
            }

            DB::beginTransaction();
            $warnings = $this->applyBundle($bundle, $selectedBlocks, $currentUserId);

            if ($mediaStageDir !== null) {
                $this->replaceImageDirectory($mediaStageDir);
            }

            DB::commit();

            @unlink($rollbackArchive);
            if ($mediaSnapshotDir !== null) {
                $this->deleteDirectory($mediaSnapshotDir);
            }
            if ($mediaStageDir !== null) {
                $this->deleteDirectory($mediaStageDir);
            }

            return [
                'success' => true,
                'restored_blocks' => $selectedBlocks,
                'warnings' => $warnings,
            ];
        } catch (\Throwable $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            if ($mediaSnapshotDir !== null) {
                $this->restoreImageDirectory($mediaSnapshotDir);
            }

            if ($mediaStageDir !== null) {
                $this->deleteDirectory($mediaStageDir);
            }

            if ($mediaSnapshotDir !== null) {
                $this->deleteDirectory($mediaSnapshotDir);
            }

            @unlink($rollbackArchive);

            throw new \RuntimeException('Restore failed. Existing data was preserved. ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * @param array<int, mixed> $requestedBlocks
     * @return array{manifest: array<string, mixed>, data: array<string, array<int, array<string, mixed>>>, media_files: array<int, array{path: string, zip_path: string}>}
     */
    private function buildBundle(array $requestedBlocks, bool $includeMediaFiles): array
    {
        $blocks = $this->normalizeBlocks($requestedBlocks);
        if ($blocks === []) {
            throw new \InvalidArgumentException('Choose at least one block to export.');
        }

        $data = [];
        $recordCounts = [];
        $blockCounts = [];
        $warnings = [];
        $mediaFiles = [];

        if (in_array('appearance', $blocks, true)) {
            $data['settings'] = $this->exportSettings();
            $data['page_components'] = $this->exportPageComponents();
            $recordCounts['settings'] = count($data['settings']);
            $recordCounts['page_components'] = count($data['page_components']);
            $blockCounts['appearance'] = $recordCounts['settings'] + $recordCounts['page_components'];
        }

        if (in_array('content', $blocks, true)) {
            $data['posts'] = $this->rows('SELECT * FROM `posts` ORDER BY `id`');
            $data['post_translations'] = $this->rows('SELECT * FROM `post_translations` ORDER BY `id`');
            $data['comments'] = $this->rows('SELECT * FROM `comments` ORDER BY `id`');
            $recordCounts['posts'] = count($data['posts']);
            $recordCounts['post_translations'] = count($data['post_translations']);
            $recordCounts['comments'] = count($data['comments']);
            $blockCounts['content'] = $recordCounts['posts'] + $recordCounts['post_translations'] + $recordCounts['comments'];
        }

        if (in_array('subscribers', $blocks, true)) {
            $data['subscribers'] = $this->rows('SELECT * FROM `subscribers` ORDER BY `id`');
            $recordCounts['subscribers'] = count($data['subscribers']);
            $blockCounts['subscribers'] = $recordCounts['subscribers'];
        }

        if (in_array('activity', $blocks, true)) {
            $data['post_likes'] = $this->rows('SELECT * FROM `post_likes` ORDER BY `id`');
            $data['page_views'] = $this->rows('SELECT * FROM `page_views` ORDER BY `id`');
            $recordCounts['post_likes'] = count($data['post_likes']);
            $recordCounts['page_views'] = count($data['page_views']);
            $blockCounts['activity'] = $recordCounts['post_likes'] + $recordCounts['page_views'];
        }

        if (in_array('media', $blocks, true)) {
            $data['images'] = $this->rows('SELECT * FROM `images` ORDER BY `id`');
            $recordCounts['images'] = count($data['images']);
            $blockCounts['media'] = $recordCounts['images'];

            if ($includeMediaFiles) {
                foreach ($data['images'] as $image) {
                    $filename = (string) ($image['filename'] ?? '');
                    if ($filename === '') {
                        continue;
                    }

                    $path = $this->imgDir . '/' . $filename;
                    if (!is_file($path)) {
                        $warnings[] = sprintf('The media file "%s" was referenced but not found on disk.', $filename);
                        continue;
                    }

                    $mediaFiles[] = [
                        'path' => $path,
                        'zip_path' => 'files/img/' . $filename,
                    ];
                }
            }
        }

        return [
            'manifest' => [
                'format' => self::FORMAT,
                'exported_at' => gmdate('c'),
                'app_version' => Setting::query()->where('key', 'app_version')->value('value'),
                'blocks' => $blocks,
                'block_counts' => $blockCounts,
                'record_counts' => $recordCounts,
                'has_media_files' => $includeMediaFiles && $mediaFiles !== [],
                'warnings' => array_values(array_unique($warnings)),
            ],
            'data' => $data,
            'media_files' => $mediaFiles,
        ];
    }

    /**
     * @param array{manifest: array<string, mixed>, data: array<string, array<int, array<string, mixed>>>, media_files: array<int, array{path: string, zip_path: string}>} $bundle
     */
    private function writeBundleToZip(array $bundle, string $path): void
    {
        $this->assertZipSupport();

        $zip = new \ZipArchive();
        if ($zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Could not create the backup archive.');
        }

        $zip->addFromString(
            'manifest.json',
            json_encode($bundle['manifest'], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        foreach ($bundle['data'] as $name => $rows) {
            $zip->addFromString(
                'data/' . $name . '.json',
                json_encode($rows, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            );
        }

        foreach ($bundle['media_files'] as $mediaFile) {
            $zip->addFile($mediaFile['path'], $mediaFile['zip_path']);
        }

        $zip->close();
    }

    /**
     * @return array{manifest: array<string, mixed>, data: array<string, array<int, array<string, mixed>>>}
     */
    private function readBundleFromZip(string $zipPath): array
    {
        $this->assertZipSupport();

        $zip = new \ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new \InvalidArgumentException('The uploaded file is not a valid ZIP archive.');
        }

        $manifestJson = $zip->getFromName('manifest.json');
        if (!is_string($manifestJson) || $manifestJson === '') {
            $zip->close();
            throw new \InvalidArgumentException('The backup archive is missing manifest.json.');
        }

        $manifest = json_decode($manifestJson, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($manifest) || ($manifest['format'] ?? '') !== self::FORMAT) {
            $zip->close();
            throw new \InvalidArgumentException('The backup archive format is not supported.');
        }

        $data = [];
        foreach (($manifest['record_counts'] ?? []) as $name => $_count) {
            if (!is_string($name) || $name === '') {
                continue;
            }

            $json = $zip->getFromName('data/' . $name . '.json');
            if ($json === false) {
                $zip->close();
                throw new \InvalidArgumentException('The backup archive is missing data/' . $name . '.json.');
            }

            $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
            $data[$name] = is_array($decoded) ? $decoded : [];
        }

        $zip->close();

        return [
            'manifest' => $manifest,
            'data' => $data,
        ];
    }

    /**
     * @param array{manifest: array<string, mixed>, data: array<string, array<int, array<string, mixed>>>} $bundle
     * @param array<int, string> $selectedBlocks
     * @return array<int, string>
     */
    private function applyBundle(array $bundle, array $selectedBlocks, int $currentUserId): array
    {
        $warnings = [];
        $hasMedia = in_array('media', $selectedBlocks, true);
        $hasSubscribers = in_array('subscribers', $selectedBlocks, true);

        if ($hasMedia && !($bundle['manifest']['has_media_files'] ?? false)) {
            $warnings[] = 'Media records were restored without image files.';
        }

        if ($hasMedia && !in_array('content', $selectedBlocks, true) && !in_array('appearance', $selectedBlocks, true)) {
            $warnings[] = 'Media was restored without content or appearance. Review image assignments after the restore.';
        }

        if (!$hasMedia && in_array('media', $bundle['manifest']['blocks'] ?? [], true)) {
            $warnings[] = 'Media was not restored. Some images may need to be re-uploaded manually.';
        }

        if (in_array('activity', $selectedBlocks, true)) {
            DB::table('page_views')->delete();
            DB::table('post_likes')->delete();
        }

        if (in_array('content', $selectedBlocks, true)) {
            DB::table('comments')->delete();
            DB::table('post_translations')->delete();
            DB::table('posts')->delete();
        }

        if (in_array('subscribers', $selectedBlocks, true)) {
            DB::table('subscribers')->delete();
        }

        if (in_array('media', $selectedBlocks, true)) {
            DB::table('images')->delete();
        }

        if (in_array('subscribers', $selectedBlocks, true)) {
            foreach ($bundle['data']['subscribers'] ?? [] as $row) {
                DB::table('subscribers')->insert([
                    'id' => (int) $row['id'],
                    'google_id' => (string) $row['google_id'],
                    'name' => (string) $row['name'],
                    'email' => (string) $row['email'],
                    'avatar_url' => $row['avatar_url'] !== null ? (string) $row['avatar_url'] : null,
                    'unsubscribe_token' => (string) $row['unsubscribe_token'],
                    'subscribed' => (int) $row['subscribed'],
                    'created_at' => (string) $row['created_at'],
                    'updated_at' => (string) $row['updated_at'],
                ]);
            }
        }

        if (in_array('content', $selectedBlocks, true)) {
            foreach ($bundle['data']['posts'] ?? [] as $row) {
                $featuredImageId = $hasMedia && isset($row['featured_image_id']) && $row['featured_image_id'] !== null
                    ? (int) $row['featured_image_id']
                    : null;

                if (!$hasMedia && !empty($row['featured_image_id'])) {
                    $warnings[] = 'Post featured images were skipped because media was not restored.';
                }

                DB::table('posts')->insert([
                    'id' => (int) $row['id'],
                    'user_id' => $currentUserId,
                    'title' => (string) $row['title'],
                    'slug' => (string) $row['slug'],
                    'base_locale' => (string) ($row['base_locale'] ?? 'en'),
                    'content' => (string) $row['content'],
                    'excerpt' => $row['excerpt'] !== null ? (string) $row['excerpt'] : null,
                    'tags' => $row['tags'] !== null ? (string) $row['tags'] : null,
                    'featured_image_id' => $featuredImageId,
                    'map_embed_url' => $row['map_embed_url'] !== null ? (string) $row['map_embed_url'] : null,
                    'reading_time' => $row['reading_time'] !== null ? (string) $row['reading_time'] : null,
                    'status' => (string) $row['status'],
                    'notified_at' => $row['notified_at'] !== null ? (string) $row['notified_at'] : null,
                    'likes_count' => isset($row['likes_count']) ? (int) $row['likes_count'] : 0,
                    'created_at' => (string) $row['created_at'],
                    'updated_at' => (string) $row['updated_at'],
                ]);
            }

            foreach ($bundle['data']['post_translations'] ?? [] as $row) {
                DB::table('post_translations')->insert([
                    'id' => (int) $row['id'],
                    'post_id' => (int) $row['post_id'],
                    'locale' => (string) $row['locale'],
                    'title' => (string) $row['title'],
                    'content' => (string) $row['content'],
                    'excerpt' => $row['excerpt'] !== null ? (string) $row['excerpt'] : null,
                    'created_at' => (string) $row['created_at'],
                    'updated_at' => (string) $row['updated_at'],
                ]);
            }

            foreach ($bundle['data']['comments'] ?? [] as $row) {
                $subscriberId = $hasSubscribers && isset($row['subscriber_id']) && $row['subscriber_id'] !== null
                    ? (int) $row['subscriber_id']
                    : null;

                if (!$hasSubscribers && !empty($row['subscriber_id'])) {
                    $warnings[] = 'Comment subscriber links were cleared because subscribers were not restored.';
                }

                DB::table('comments')->insert([
                    'id' => (int) $row['id'],
                    'post_id' => (int) $row['post_id'],
                    'subscriber_id' => $subscriberId,
                    'author_name' => (string) $row['author_name'],
                    'author_email' => (string) $row['author_email'],
                    'content' => (string) $row['content'],
                    'status' => (string) $row['status'],
                    'created_at' => (string) $row['created_at'],
                ]);
            }
        }

        if (in_array('media', $selectedBlocks, true)) {
            $keepPostLink = in_array('content', $selectedBlocks, true);

            foreach ($bundle['data']['images'] ?? [] as $row) {
                DB::table('images')->insert([
                    'id' => (int) $row['id'],
                    'post_id' => $keepPostLink && $row['post_id'] !== null ? (int) $row['post_id'] : null,
                    'filename' => (string) $row['filename'],
                    'original_name' => (string) $row['original_name'],
                    'mime_type' => (string) $row['mime_type'],
                    'file_size' => (int) $row['file_size'],
                    'created_at' => (string) $row['created_at'],
                ]);
            }
        }

        if (in_array('activity', $selectedBlocks, true)) {
            foreach ($bundle['data']['post_likes'] ?? [] as $row) {
                DB::table('post_likes')->insert([
                    'id' => (int) $row['id'],
                    'post_id' => (int) $row['post_id'],
                    'ip_hash' => (string) $row['ip_hash'],
                    'created_at' => (string) $row['created_at'],
                ]);
            }

            foreach ($bundle['data']['page_views'] ?? [] as $row) {
                DB::table('page_views')->insert([
                    'id' => (int) $row['id'],
                    'page_slug' => (string) $row['page_slug'],
                    'ip_hash' => (string) $row['ip_hash'],
                    'date_key' => (string) $row['date_key'],
                    'viewed_at' => (string) $row['viewed_at'],
                ]);
            }
        }

        if (in_array('appearance', $selectedBlocks, true)) {
            $warnings = array_merge($warnings, $this->restoreSettings($bundle['data']['settings'] ?? [], $hasMedia));
            $warnings = array_merge($warnings, $this->restorePageComponents($bundle['data']['page_components'] ?? []));
        }

        return array_values(array_unique($warnings));
    }

    /**
     * @param array<int, array<string, mixed>> $settingsRows
     * @return array<int, string>
     */
    private function restoreSettings(array $settingsRows, bool $hasMedia): array
    {
        $warnings = [];

        foreach ($settingsRows as $row) {
            $key = (string) ($row['key'] ?? '');
            $value = (string) ($row['value'] ?? '');

            if (!in_array($key, self::SETTINGS_ALLOWLIST, true)) {
                continue;
            }

            if (!$hasMedia && in_array($key, self::IMAGE_SETTING_KEYS, true) && $value !== '') {
                $warnings[] = 'Appearance image settings were skipped because media was not restored.';
                continue;
            }

            if ($key === 'active_style_collection' && !StyleCollection::query()->where('name', $value)->exists()) {
                $value = 'default';
                $warnings[] = 'The saved style collection was not available. Corexpress restored the default collection instead.';
            }

            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return $warnings;
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @return array<int, string>
     */
    private function restorePageComponents(array $rows): array
    {
        foreach ($rows as $row) {
            $pageSlug = (string) ($row['page_slug'] ?? '');
            $componentName = (string) ($row['component_name'] ?? '');

            if ($pageSlug === '' || $componentName === '') {
                continue;
            }

            $pageId = DB::table('pages')->where('slug', $pageSlug)->value('id');
            $definitionId = DB::table('component_definitions')->where('name', $componentName)->value('id');

            if ($pageId === null || $definitionId === null) {
                continue;
            }

            DB::table('page_components')->updateOrInsert(
                [
                    'page_id' => (int) $pageId,
                    'component_definition_id' => (int) $definitionId,
                ],
                [
                    'is_visible' => !empty($row['is_visible']) ? 1 : 0,
                    'display_order' => max(0, (int) ($row['display_order'] ?? 0)),
                ]
            );
        }

        return [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function exportSettings(): array
    {
        return DB::table('settings')
            ->select(['key', 'value'])
            ->whereIn('key', self::SETTINGS_ALLOWLIST)
            ->orderBy('key')
            ->get()
            ->map(static fn($row): array => ['key' => (string) $row->key, 'value' => (string) $row->value])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function exportPageComponents(): array
    {
        return DB::table('page_components as pc')
            ->join('pages as p', 'p.id', '=', 'pc.page_id')
            ->join('component_definitions as cd', 'cd.id', '=', 'pc.component_definition_id')
            ->orderBy('p.id')
            ->orderBy('pc.display_order')
            ->get([
                'p.slug as page_slug',
                'cd.name as component_name',
                'pc.is_visible',
                'pc.display_order',
            ])
            ->map(static fn($row): array => [
                'page_slug' => (string) $row->page_slug,
                'component_name' => (string) $row->component_name,
                'is_visible' => (bool) $row->is_visible,
                'display_order' => (int) $row->display_order,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function rows(string $sql): array
    {
        $pdo = DB::connection()->getPdo();
        $stmt = $pdo->query($sql);
        return $stmt !== false ? $stmt->fetchAll(\PDO::FETCH_ASSOC) : [];
    }

    /**
     * @param array<int, mixed> $blocks
     * @return array<int, string>
     */
    private function normalizeBlocks(array $blocks): array
    {
        $normalized = [];
        foreach ($blocks as $block) {
            if (!is_string($block)) {
                continue;
            }

            if (in_array($block, self::BLOCKS, true) && !in_array($block, $normalized, true)) {
                $normalized[] = $block;
            }
        }

        return $normalized;
    }

    private function assertZipSupport(): void
    {
        if (!class_exists(\ZipArchive::class)) {
            throw new \RuntimeException('ZIP support is not available on this server.');
        }
    }

    private function tempZipPath(string $prefix): string
    {
        $base = tempnam(sys_get_temp_dir(), $prefix);
        if ($base === false) {
            throw new \RuntimeException('Could not reserve a temporary file for the backup archive.');
        }

        @unlink($base);
        return $base . '.zip';
    }

    private function snapshotImageDirectory(): string
    {
        $target = sys_get_temp_dir() . '/corexpress-img-snapshot-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4));
        $this->ensureDirectory($target);
        $this->copyDirectory($this->imgDir, $target);
        return $target;
    }

    private function extractMediaFiles(string $zipPath): string
    {
        $this->assertZipSupport();

        $target = sys_get_temp_dir() . '/corexpress-img-stage-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4));
        $this->ensureDirectory($target);

        $zip = new \ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new \RuntimeException('Could not reopen the backup archive for media extraction.');
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            if (!is_array($stat)) {
                continue;
            }

            $name = (string) ($stat['name'] ?? '');
            if (!str_starts_with($name, 'files/img/') || str_ends_with($name, '/')) {
                continue;
            }

            $stream = $zip->getStream($name);
            if ($stream === false) {
                $zip->close();
                throw new \RuntimeException('Could not extract a media file from the backup archive.');
            }

            $relativePath = substr($name, strlen('files/img/'));
            $dest = $target . '/' . $relativePath;
            $this->ensureDirectory(dirname($dest));

            $out = fopen($dest, 'wb');
            if ($out === false) {
                fclose($stream);
                $zip->close();
                throw new \RuntimeException('Could not write an extracted media file.');
            }

            stream_copy_to_stream($stream, $out);
            fclose($stream);
            fclose($out);
        }

        $zip->close();

        return $target;
    }

    private function replaceImageDirectory(string $stageDir): void
    {
        $this->ensureDirectory($this->imgDir);
        $this->clearDirectory($this->imgDir);
        $this->copyDirectory($stageDir, $this->imgDir);
    }

    private function restoreImageDirectory(string $snapshotDir): void
    {
        $this->ensureDirectory($this->imgDir);
        $this->clearDirectory($this->imgDir);
        $this->copyDirectory($snapshotDir, $this->imgDir);
    }

    private function ensureDirectory(string $path): void
    {
        if (is_dir($path)) {
            return;
        }

        if (!mkdir($path, 0775, true) && !is_dir($path)) {
            throw new \RuntimeException('Could not create a required temporary directory.');
        }
    }

    private function copyDirectory(string $source, string $target): void
    {
        if (!is_dir($source)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $relative = substr($item->getPathname(), strlen($source) + 1);
            $dest = $target . '/' . $relative;

            if ($item->isDir()) {
                $this->ensureDirectory($dest);
                continue;
            }

            $this->ensureDirectory(dirname($dest));
            if (!copy($item->getPathname(), $dest)) {
                throw new \RuntimeException('Could not copy a media file during restore.');
            }
        }
    }

    private function clearDirectory(string $path): void
    {
        if (!is_dir($path)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isDir()) {
                if (!rmdir($item->getPathname())) {
                    throw new \RuntimeException('Could not clear the media directory before restore.');
                }
                continue;
            }

            if (!unlink($item->getPathname())) {
                throw new \RuntimeException('Could not remove an old media file before restore.');
            }
        }
    }

    private function deleteDirectory(string $path): void
    {
        if (!is_dir($path)) {
            return;
        }

        $this->clearDirectory($path);
        @rmdir($path);
    }
}
