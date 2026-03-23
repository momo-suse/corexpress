<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Image;
use Corexpress\Models\Post;
use Corexpress\Models\PostTranslation;
use Corexpress\Models\Setting;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class PostController extends Controller
{
    private const DEFAULT_PER_PAGE = 10;
    private const MAX_PER_PAGE = 50;
    private const SUPPORTED_LOCALES = ['en', 'es', 'ja'];

    /**
     * GET /api/v1/posts
     * Returns paginated published posts (public).
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params = $request->getQueryParams();
        $page = max(1, (int)($params['page'] ?? 1));
        $perPage = min(self::MAX_PER_PAGE, max(1, (int)($params['per_page'] ?? self::DEFAULT_PER_PAGE)));

        // Authenticated admins can pass ?all=1 to include drafts
        $isAdmin = !empty($_SESSION['user_id']);
        $showAll = $isAdmin && ($params['all'] ?? '') === '1';

        $search = trim((string) ($params['search'] ?? ''));

        $query = $showAll
            ?Post::orderBy('created_at', 'desc')
            : Post::published()->orderBy('created_at', 'desc');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $term = '%' . $search . '%';
                $q->where('title',   'LIKE', $term)
                  ->orWhere('excerpt', 'LIKE', $term)
                  ->orWhere('content', 'LIKE', $term)
                  ->orWhere('tags',    'LIKE', $term);
            });
        }

        $tag = trim((string) ($params['tag'] ?? ''));
        if ($tag !== '') {
            $tagNorm = strtolower($tag);
            $query->whereRaw(
                "LOWER(CONCAT(',', REPLACE(tags, ', ', ','), ',')) LIKE ?",
                ["%,{$tagNorm},%"]
            );
        }

        $total = $query->count();
        $posts = (clone $query)
            ->select(['id', 'title', 'slug', 'excerpt', 'tags', 'reading_time', 'content', 'featured_image_id', 'status', 'created_at', 'updated_at'])
            ->withCount([
                'comments as comments_count',
                'comments as comments_pending_count' => static fn ($q) => $q->where('status', 'pending'),
            ])
            ->with(['translations:id,post_id,locale'])
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->map(function (Post $post) {
                $data = $post->toArray();
                $data['featured_image_url'] = $this->resolveFeaturedImageUrl($post->featured_image_id);
                // Compute reading_time from content when not manually set
                if (empty($data['reading_time']) && !empty($data['content'])) {
                    $words = str_word_count(strip_tags((string) $data['content']));
                    $data['reading_time'] = max(1, (int) round($words / 200)) . ' min';
                }
                // Content is never returned in list — use the show endpoint to fetch a single post for editing
                unset($data['content']);
                // Include only the locale codes of existing translations
                $data['translation_locales'] = $post->translations->pluck('locale')->values()->all();
                unset($data['translations']);
                return $data;
            });

        return $this->json($response, [
            'data' => $posts->values()->toArray(),
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, (int)ceil($total / $perPage)),
            ],
        ]);
    }

    /**
     * GET /api/v1/posts/{slug}[?locale=XX]
     * Returns a single published post with its comment count (public).
     * When ?locale= is provided, content fields may be overridden by a translation.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $isAdmin = !empty($_SESSION['user_id']);
        $post = $isAdmin
            ? Post::where('slug', $args['slug'])->with('translations')->first()
            : Post::published()->where('slug', $args['slug'])->with('translations')->first();

        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $baseLocale = $post->base_locale ?? 'en';
        $translations = $post->translations->keyBy('locale');
        $translationLocales = $translations->keys()->all();
        $availableLocales = array_values(array_unique(array_merge([$baseLocale], $translationLocales)));

        $data = $post->toArray();
        unset($data['translations']); // don't expose full translation objects in show

        $data['comment_count'] = $post->comments()->where('status', 'approved')->count();
        $data['featured_image_url'] = $this->resolveFeaturedImageUrl($post->featured_image_id);
        $data['base_locale'] = $baseLocale;
        $data['available_locales'] = $availableLocales;

        // Apply locale override when a specific locale is requested
        $params = $request->getQueryParams();
        $requestedLocale = trim((string)($params['locale'] ?? ''));

        if ($requestedLocale !== '' && $requestedLocale !== $baseLocale) {
            // Use the requested locale's translation; if not available fall back to base content (already in $data)
            $translation = $translations->get($requestedLocale);

            if ($translation !== null) {
                $data['title'] = $translation->title;
                $data['content'] = $translation->content;
                $data['excerpt'] = $translation->excerpt;
            }
        }

        // Admins also receive the full translation list for the editor
        if ($isAdmin) {
            $data['translations'] = $translations->values()->toArray();
        }

        return $this->json($response, ['data' => $data]);
    }

    /**
     * POST /api/v1/posts/{id}/translations   [Admin + CSRF]
     */
    public function storeTranslation(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int)$args['id']);
        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $body = (array)($request->getParsedBody() ?? []);
        $locale = trim((string)($body['locale'] ?? ''));
        $title = trim((string)($body['title'] ?? ''));
        $content = trim((string)($body['content'] ?? ''));

        $baseLocale = $post->base_locale ?? 'en';
        $errors = $this->validateTranslationBody($body, $locale, $baseLocale);
        if ($errors !== []) {
            return $this->json($response, ['error' => 'Validation failed', 'fields' => $errors], 422);
        }

        // Upsert — replace if locale already exists
        $translation = PostTranslation::updateOrCreate(
            ['post_id' => $post->id, 'locale' => $locale],
            [
                'title'   => $title,
                'content' => $content,
                'excerpt' => isset($body['excerpt']) && $body['excerpt'] !== '' ? trim((string)$body['excerpt']) : null,
            ]
        );

        return $this->json($response, ['data' => $translation->fresh()->toArray()], 201);
    }

    /**
     * PUT /api/v1/posts/{id}/translations/{locale}   [Admin + CSRF]
     */
    public function updateTranslation(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int)$args['id']);
        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $locale = trim((string)($args['locale'] ?? ''));
        $translation = PostTranslation::where('post_id', $post->id)->where('locale', $locale)->first();
        if ($translation === null) {
            return $this->error($response, 'Translation not found.', 404);
        }

        $body = (array)($request->getParsedBody() ?? []);

        if (isset($body['title'])) {
            $title = trim((string)$body['title']);
            if ($title === '') {
                return $this->json($response, ['error' => 'Validation failed', 'fields' => ['title' => 'Title cannot be empty.']], 422);
            }
            $translation->title = $title;
        }

        if (isset($body['content'])) {
            $content = trim((string)$body['content']);
            if ($content === '') {
                return $this->json($response, ['error' => 'Validation failed', 'fields' => ['content' => 'Content cannot be empty.']], 422);
            }
            $translation->content = $content;
        }

        if (array_key_exists('excerpt', $body)) {
            $translation->excerpt = $body['excerpt'] !== null && $body['excerpt'] !== '' ? trim((string)$body['excerpt']) : null;
        }

        $translation->save();

        return $this->json($response, ['data' => $translation->fresh()->toArray()]);
    }

    /**
     * DELETE /api/v1/posts/{id}/translations/{locale}   [Admin + CSRF]
     */
    public function destroyTranslation(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int)$args['id']);
        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $locale = trim((string)($args['locale'] ?? ''));
        $translation = PostTranslation::where('post_id', $post->id)->where('locale', $locale)->first();
        if ($translation === null) {
            return $this->error($response, 'Translation not found.', 404);
        }

        $translation->delete();

        return $response->withStatus(204);
    }

    /**
     * POST /api/v1/posts   [Auth + CSRF required]
     */
    public function store(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array)($request->getParsedBody() ?? []);
        $errors = $this->validatePostBody($body);

        if ($errors !== []) {
            return $this->json($response, ['error' => 'Validation failed', 'fields' => $errors], 422);
        }

        $userId = (int)$request->getAttribute('user_id');

        // Validate optional featured_image_id
        $featuredImageId = null;
        if (isset($body['featured_image_id']) && is_numeric($body['featured_image_id'])) {
            $img = Image::find((int)$body['featured_image_id']);
            if ($img !== null) {
                $featuredImageId = $img->id;
            }
        }

        $baseLocale = Setting::where('key', 'app_locale')->value('value') ?? 'en';

        $post = Post::create([
            'user_id' => $userId,
            'title' => trim((string)$body['title']),
            'slug' => $this->generateSlug(trim((string)$body['title'])),
            'base_locale' => $baseLocale,
            'content' => trim((string)$body['content']),
            'excerpt' => isset($body['excerpt']) ? trim((string)$body['excerpt']) : null,
            'tags' => isset($body['tags']) && $body['tags'] !== '' ? trim((string)$body['tags']) : null,
            'featured_image_id' => $featuredImageId,
            'map_embed_url' => $this->sanitizeMapUrl($body['map_embed_url'] ?? null),
            'reading_time' => isset($body['reading_time']) && $body['reading_time'] !== '' ? trim((string)$body['reading_time']) : null,
            'status' => in_array($body['status'] ?? '', ['draft', 'published'], true)
            ? $body['status']
            : 'draft',
        ]);

        $data = $post->fresh()->toArray();
        $data['featured_image_url'] = $this->resolveFeaturedImageUrl($post->featured_image_id);

        return $this->json($response, ['data' => $data], 201);
    }

    /**
     * PUT /api/v1/posts/{id}   [Auth + CSRF required]
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int)$args['id']);

        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $body = (array)($request->getParsedBody() ?? []);

        if (isset($body['title'])) {
            $title = trim((string)$body['title']);
            if ($title === '') {
                return $this->json($response, ['error' => 'Validation failed', 'fields' => ['title' => 'Title cannot be empty.']], 422);
            }
            $post->title = $title;
        }

        if (isset($body['content'])) {
            $content = trim((string)$body['content']);
            if ($content === '') {
                return $this->json($response, ['error' => 'Validation failed', 'fields' => ['content' => 'Content cannot be empty.']], 422);
            }
            $post->content = $content;
        }

        if (array_key_exists('excerpt', $body)) {
            $post->excerpt = $body['excerpt'] !== null ? trim((string)$body['excerpt']) : null;
        }

        if (array_key_exists('tags', $body)) {
            $post->tags = $body['tags'] !== null && $body['tags'] !== '' ? trim((string)$body['tags']) : null;
        }

        if (isset($body['status']) && in_array($body['status'], ['draft', 'published'], true)) {
            $post->status = $body['status'];
        }

        if (array_key_exists('featured_image_id', $body)) {
            if ($body['featured_image_id'] === null) {
                $post->featured_image_id = null;
            }
            elseif (is_numeric($body['featured_image_id'])) {
                $img = Image::find((int)$body['featured_image_id']);
                if ($img !== null) {
                    $post->featured_image_id = $img->id;
                }
            }
        }

        if (array_key_exists('map_embed_url', $body)) {
            $post->map_embed_url = $this->sanitizeMapUrl($body['map_embed_url']);
        }

        if (array_key_exists('reading_time', $body)) {
            $post->reading_time = $body['reading_time'] !== null && $body['reading_time'] !== '' ? trim((string)$body['reading_time']) : null;
        }

        $post->save();

        $data = $post->fresh()->toArray();
        $data['featured_image_url'] = $this->resolveFeaturedImageUrl($post->featured_image_id);

        return $this->json($response, ['data' => $data]);
    }

    /**
     * DELETE /api/v1/posts/{id}   [Auth + CSRF required]
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int)$args['id']);

        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $post->comments()->delete();
        $post->delete();

        return $response->withStatus(204);
    }

    /**
     * GET /api/v1/tags
     * Returns the most-used tags across all published posts, sorted by frequency.
     */
    public function tags(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params = $request->getQueryParams();
        $limit  = min(20, max(1, (int) ($params['limit'] ?? 6)));

        $tagStrings = Post::published()->whereNotNull('tags')->pluck('tags');

        $counts = [];
        foreach ($tagStrings as $raw) {
            foreach (array_map('trim', explode(',', strtolower((string) $raw))) as $t) {
                if ($t !== '') {
                    $counts[$t] = ($counts[$t] ?? 0) + 1;
                }
            }
        }
        arsort($counts);

        $slice = array_slice($counts, 0, $limit, true);
        $data  = array_values(array_map(
            static fn (string $tag, int $count) => ['tag' => $tag, 'count' => $count],
            array_keys($slice),
            $slice
        ));

        return $this->json($response, ['data' => $data]);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed> $body
     * @return array<string, string>
     */
    private function validateTranslationBody(array $body, string $locale, string $baseLocale): array
    {
        $errors = [];

        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $errors['locale'] = 'Locale must be one of: ' . implode(', ', self::SUPPORTED_LOCALES) . '.';
        } elseif ($locale === $baseLocale) {
            $errors['locale'] = 'Cannot create a translation for the base locale.';
        }

        $title = trim((string)($body['title'] ?? ''));
        if ($title === '') {
            $errors['title'] = 'Title is required.';
        } elseif (mb_strlen($title) > 500) {
            $errors['title'] = 'Title must be 500 characters or fewer.';
        }

        $content = trim((string)($body['content'] ?? ''));
        if ($content === '') {
            $errors['content'] = 'Content is required.';
        }

        return $errors;
    }

    /**
     * @param  array<string, mixed> $body
     * @return array<string, string>
     */
    private function validatePostBody(array $body): array
    {
        $errors = [];

        $title = trim((string)($body['title'] ?? ''));
        $content = trim((string)($body['content'] ?? ''));

        if ($title === '') {
            $errors['title'] = 'Title is required.';
        }
        elseif (mb_strlen($title) > 500) {
            $errors['title'] = 'Title must be 500 characters or fewer.';
        }

        if ($content === '') {
            $errors['content'] = 'Content is required.';
        }

        return $errors;
    }

    /**
     * Resolve a featured image ID to its public URL.
     */
    private function resolveFeaturedImageUrl(?int $imageId): ?string
    {
        if ($imageId === null) {
            return null;
        }
        $image = Image::find($imageId);
        return $image !== null ? '/img/' . $image->filename : null;
    }

    /**
     * Sanitize a map embed URL — accepts Google Maps, OpenStreetMap, etc.
     * Returns null if empty/invalid.
     */
    private function sanitizeMapUrl(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $url = trim((string)$value);
        if (mb_strlen($url) > 2048) {
            return null;
        }
        // Only accept https:// URLs
        if (!str_starts_with($url, 'https://')) {
            return null;
        }
        return $url;
    }

    /**
     * Generate a URL-friendly slug from a title. Appends a numeric suffix on collision.
     */
    private function generateSlug(string $title): string
    {
        $slug = strtolower(trim((string)preg_replace('/[^a-z0-9]+/i', '-', $title), '-'));
        $slug = substr($slug, 0, 200);

        $base = $slug;
        $i = 1;
        while (Post::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }
}