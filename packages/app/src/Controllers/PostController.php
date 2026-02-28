<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Post;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class PostController extends Controller
{
    private const DEFAULT_PER_PAGE = 10;
    private const MAX_PER_PAGE     = 50;

    /**
     * GET /api/v1/posts
     * Returns paginated published posts (public).
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params  = $request->getQueryParams();
        $page    = max(1, (int) ($params['page']     ?? 1));
        $perPage = min(self::MAX_PER_PAGE, max(1, (int) ($params['per_page'] ?? self::DEFAULT_PER_PAGE)));

        $query = Post::published()->orderBy('created_at', 'desc');
        $total = $query->count();
        $posts = (clone $query)
            ->select(['id', 'title', 'slug', 'excerpt', 'status', 'created_at', 'updated_at'])
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return $this->json($response, [
            'data' => $posts->values()->toArray(),
            'meta' => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    /**
     * GET /api/v1/posts/{slug}
     * Returns a single published post with its comment count (public).
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::published()->where('slug', $args['slug'])->first();

        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $data              = $post->toArray();
        $data['comment_count'] = $post->comments()->where('status', 'approved')->count();

        return $this->json($response, ['data' => $data]);
    }

    /**
     * POST /api/v1/posts   [Auth + CSRF required]
     */
    public function store(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body   = (array) ($request->getParsedBody() ?? []);
        $errors = $this->validatePostBody($body);

        if ($errors !== []) {
            return $this->json($response, ['error' => 'Validation failed', 'fields' => $errors], 422);
        }

        $userId = (int) $request->getAttribute('user_id');

        $post = Post::create([
            'user_id' => $userId,
            'title'   => trim((string) $body['title']),
            'slug'    => $this->generateSlug(trim((string) $body['title'])),
            'content' => trim((string) $body['content']),
            'excerpt' => isset($body['excerpt']) ? trim((string) $body['excerpt']) : null,
            'status'  => in_array($body['status'] ?? '', ['draft', 'published'], true)
                ? $body['status']
                : 'draft',
        ]);

        return $this->json($response, ['data' => $post->fresh()], 201);
    }

    /**
     * PUT /api/v1/posts/{id}   [Auth + CSRF required]
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int) $args['id']);

        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $body = (array) ($request->getParsedBody() ?? []);

        if (isset($body['title'])) {
            $title = trim((string) $body['title']);
            if ($title === '') {
                return $this->json($response, ['error' => 'Validation failed', 'fields' => ['title' => 'Title cannot be empty.']], 422);
            }
            $post->title = $title;
        }

        if (isset($body['content'])) {
            $content = trim((string) $body['content']);
            if ($content === '') {
                return $this->json($response, ['error' => 'Validation failed', 'fields' => ['content' => 'Content cannot be empty.']], 422);
            }
            $post->content = $content;
        }

        if (array_key_exists('excerpt', $body)) {
            $post->excerpt = $body['excerpt'] !== null ? trim((string) $body['excerpt']) : null;
        }

        if (isset($body['status']) && in_array($body['status'], ['draft', 'published'], true)) {
            $post->status = $body['status'];
        }

        $post->save();

        return $this->json($response, ['data' => $post->fresh()]);
    }

    /**
     * DELETE /api/v1/posts/{id}   [Auth + CSRF required]
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int) $args['id']);

        if ($post === null) {
            return $this->error($response, 'Post not found.', 404);
        }

        $post->comments()->delete();
        $post->delete();

        return $response->withStatus(204);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed> $body
     * @return array<string, string>
     */
    private function validatePostBody(array $body): array
    {
        $errors = [];

        $title   = trim((string) ($body['title']   ?? ''));
        $content = trim((string) ($body['content'] ?? ''));

        if ($title === '') {
            $errors['title'] = 'Title is required.';
        } elseif (mb_strlen($title) > 500) {
            $errors['title'] = 'Title must be 500 characters or fewer.';
        }

        if ($content === '') {
            $errors['content'] = 'Content is required.';
        }

        return $errors;
    }

    /**
     * Generate a URL-friendly slug from a title. Appends a numeric suffix on collision.
     */
    private function generateSlug(string $title): string
    {
        $slug = strtolower(trim((string) preg_replace('/[^a-z0-9]+/i', '-', $title), '-'));
        $slug = substr($slug, 0, 200);

        $base = $slug;
        $i    = 1;
        while (Post::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }
}
