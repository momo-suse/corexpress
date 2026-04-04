<?php

declare(strict_types=1);

namespace Corexpress\Services;

use Corexpress\Models\Image;
use Corexpress\Models\Post;
use Corexpress\Models\PostTranslation;
use Corexpress\Models\Setting;
use Illuminate\Database\Eloquent\Collection;

final class ImageUsageService
{
    private const DIRECT_SETTING_KEYS = [
        'blog_logo_id',
        'hero_image_id',
        'profile_image_id',
        'profile_cover_id',
    ];

    /**
     * @param Collection<int, Image> $images
     * @return array<int, array{usage_count:int,usage_titles:array<int,string>,usage_records:array<int,array<string,mixed>>,seen:array<string,bool>}>
     */
    public function buildUsageMap(Collection $images): array
    {
        $usageMap = [];
        if ($images->isEmpty()) {
            return $usageMap;
        }

        /** @var array<int, string> $filenamesById */
        $filenamesById = $images->pluck('filename', 'id')->toArray();
        $imageIds = array_map('intval', array_keys($filenamesById));

        foreach ($imageIds as $imageId) {
            $usageMap[$imageId] = [
                'usage_count' => 0,
                'usage_titles' => [],
                'usage_records' => [],
                'seen' => [],
            ];
        }

        $settings = Setting::all(['key', 'value']);
        foreach (self::DIRECT_SETTING_KEYS as $settingKey) {
            $value = (string)($settings->firstWhere('key', $settingKey)?->value ?? '');
            if ($value !== '' && is_numeric($value)) {
                $imageId = (int)$value;
                if (isset($usageMap[$imageId])) {
                    $this->addUsageRecord($usageMap, $imageId, [
                        'key' => 'setting:' . $settingKey,
                        'kind' => 'setting',
                        'setting_key' => $settingKey,
                        'post_id' => null,
                        'locale' => null,
                        'titles' => [],
                    ]);
                }
            }
        }

        foreach ($settings as $setting) {
            $value = (string)$setting->value;
            if ($value === '' || !str_contains($value, '/img/')) {
                continue;
            }

            foreach ($filenamesById as $imageId => $filename) {
                if ($this->textContainsImage($value, $filename)) {
                    $this->addUsageRecord($usageMap, $imageId, [
                        'key' => 'setting:' . $setting->key,
                        'kind' => 'setting',
                        'setting_key' => $setting->key,
                        'post_id' => null,
                        'locale' => null,
                        'titles' => [],
                    ]);
                }
            }
        }

        $featuredPosts = Post::with(['translations:id,post_id,title'])
            ->whereIn('featured_image_id', $imageIds)
            ->get(['id', 'title', 'featured_image_id']);

        foreach ($featuredPosts as $post) {
            if ($post->featured_image_id === null || !isset($usageMap[$post->featured_image_id])) {
                continue;
            }

            $this->addUsageRecord($usageMap, (int)$post->featured_image_id, [
                'key' => 'post_featured:' . $post->id,
                'kind' => 'post_featured',
                'setting_key' => null,
                'post_id' => $post->id,
                'locale' => null,
                'titles' => $this->collectPostTitles($post),
            ]);
        }

        $matchingPosts = Post::with(['translations:id,post_id,title'])->where(function ($query) use ($filenamesById): void {
            foreach ($filenamesById as $filename) {
                $needle = '%/img/' . $filename . '%';
                $query->orWhere('content', 'LIKE', $needle)
                    ->orWhere('excerpt', 'LIKE', $needle);
            }
        })->get(['id', 'title', 'content', 'excerpt']);

        foreach ($matchingPosts as $post) {
            foreach ($filenamesById as $imageId => $filename) {
                if ($this->textContainsImage((string)$post->content, $filename) || $this->textContainsImage((string)$post->excerpt, $filename)) {
                    $this->addUsageRecord($usageMap, $imageId, [
                        'key' => 'post_content:' . $post->id,
                        'kind' => 'post_content',
                        'setting_key' => null,
                        'post_id' => $post->id,
                        'locale' => null,
                        'titles' => $this->collectPostTitles($post),
                    ]);
                }
            }
        }

        $matchingTranslations = PostTranslation::with('post:id,title')
            ->where(function ($query) use ($filenamesById): void {
                foreach ($filenamesById as $filename) {
                    $needle = '%/img/' . $filename . '%';
                    $query->orWhere('content', 'LIKE', $needle)
                        ->orWhere('excerpt', 'LIKE', $needle);
                }
            })
            ->get(['id', 'post_id', 'locale', 'title', 'content', 'excerpt']);

        foreach ($matchingTranslations as $translation) {
            $displayTitle = trim((string)$translation->title);
            if ($displayTitle === '') {
                $displayTitle = (string)($translation->post?->title ?? '');
            }

            foreach ($filenamesById as $imageId => $filename) {
                if ($this->textContainsImage((string)$translation->content, $filename) || $this->textContainsImage((string)$translation->excerpt, $filename)) {
                    $this->addUsageRecord($usageMap, $imageId, [
                        'key' => 'translation_content:' . $translation->id,
                        'kind' => 'translation_content',
                        'setting_key' => null,
                        'post_id' => $translation->post_id,
                        'locale' => $translation->locale,
                        'titles' => $displayTitle !== '' ? [$displayTitle] : [],
                    ]);
                }
            }
        }

        foreach ($usageMap as $imageId => $entry) {
            unset($entry['seen']);
            $usageMap[$imageId] = $entry;
        }

        return $usageMap;
    }

    /**
     * @return array<int>
     */
    public function findImageIdsByPostSearch(string $search): array
    {
        $term = '%' . $this->escapeLike($search) . '%';
        $posts = Post::with(['translations:id,post_id,locale,title,content,excerpt'])
            ->where(function ($query) use ($term): void {
                $query->where('title', 'LIKE', $term)
                    ->orWhere('slug', 'LIKE', $term)
                    ->orWhere('excerpt', 'LIKE', $term)
                    ->orWhere('tags', 'LIKE', $term)
                    ->orWhereHas('translations', function ($translationQuery) use ($term): void {
                        $translationQuery->where('title', 'LIKE', $term)
                            ->orWhere('excerpt', 'LIKE', $term);
                    });
            })
            ->get(['id', 'title', 'slug', 'content', 'excerpt', 'featured_image_id']);

        if ($posts->isEmpty()) {
            return [];
        }

        /** @var array<string, int> $imageIdByFilename */
        $imageIdByFilename = Image::query()->pluck('id', 'filename')->map(fn($id) => (int)$id)->toArray();
        $matchedIds = [];

        foreach ($posts as $post) {
            if ($post->featured_image_id !== null) {
                $matchedIds[] = (int)$post->featured_image_id;
            }

            $matchedIds = array_merge(
                $matchedIds,
                $this->matchImageIdsInText([(string)$post->content, (string)$post->excerpt], $imageIdByFilename)
            );

            foreach ($post->translations as $translation) {
                $matchedIds = array_merge(
                    $matchedIds,
                    $this->matchImageIdsInText([(string)$translation->content, (string)$translation->excerpt], $imageIdByFilename)
                );
            }
        }

        return array_values(array_unique(array_map('intval', $matchedIds)));
    }

    /**
     * @param array<int, array{usage_count:int,usage_titles:array<int,string>,usage_records:array<int,array<string,mixed>>,seen:array<string,bool>}> $usageMap
     * @param array{key:string,kind:string,setting_key:?string,post_id:?int,locale:?string,titles:array<int,string>} $record
     */
    private function addUsageRecord(array &$usageMap, int $imageId, array $record): void
    {
        if (!isset($usageMap[$imageId])) {
            return;
        }

        if (($usageMap[$imageId]['seen'][$record['key']] ?? false) === true) {
            return;
        }

        $usageMap[$imageId]['seen'][$record['key']] = true;
        $usageMap[$imageId]['usage_count']++;
        $usageMap[$imageId]['usage_records'][] = [
            'kind' => $record['kind'],
            'setting_key' => $record['setting_key'],
            'post_id' => $record['post_id'],
            'locale' => $record['locale'],
            'titles' => array_values(array_unique(array_values(array_filter(
                $record['titles'],
                static fn(string $title): bool => trim($title) !== ''
            )))),
        ];

        foreach ($record['titles'] as $title) {
            $title = trim($title);
            if ($title !== '' && !in_array($title, $usageMap[$imageId]['usage_titles'], true)) {
                $usageMap[$imageId]['usage_titles'][] = $title;
            }
        }
    }

    /**
     * @param array<int, string> $texts
     * @param array<string, int> $imageIdByFilename
     * @return array<int>
     */
    private function matchImageIdsInText(array $texts, array $imageIdByFilename): array
    {
        $matchedIds = [];
        foreach ($texts as $text) {
            if ($text === '' || !str_contains($text, '/img/')) {
                continue;
            }

            foreach ($imageIdByFilename as $filename => $imageId) {
                if ($this->textContainsImage($text, $filename)) {
                    $matchedIds[] = $imageId;
                }
            }
        }

        return $matchedIds;
    }

    private function textContainsImage(string $text, string $filename): bool
    {
        return $text !== '' && str_contains($text, '/img/' . $filename);
    }

    /**
     * @return array<int, string>
     */
    private function collectPostTitles(Post $post): array
    {
        $titles = [];

        $baseTitle = trim((string)$post->title);
        if ($baseTitle !== '') {
            $titles[] = $baseTitle;
        }

        foreach ($post->translations as $translation) {
            $title = trim((string)$translation->title);
            if ($title !== '' && !in_array($title, $titles, true)) {
                $titles[] = $title;
            }
        }

        return $titles;
    }

    /**
     * @return array{total_resources:int,total_bytes:int,unused_resources:int}
     */
    public function summarizeImages(): array
    {
        $images = Image::orderBy('created_at', 'desc')->get(['id', 'filename', 'file_size']);
        if ($images->isEmpty()) {
            return [
                'total_resources' => 0,
                'total_bytes' => 0,
                'unused_resources' => 0,
            ];
        }

        $usageMap = $this->buildUsageMap($images);
        $unusedResources = 0;

        foreach ($images as $image) {
            if (($usageMap[$image->id]['usage_count'] ?? 0) === 0) {
                $unusedResources++;
            }
        }

        return [
            'total_resources' => $images->count(),
            'total_bytes' => (int)$images->sum(fn(Image $image): int => (int)$image->file_size),
            'unused_resources' => $unusedResources,
        ];
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
