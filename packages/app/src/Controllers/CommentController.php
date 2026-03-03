<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Comment;
use Corexpress\Models\Post;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class CommentController extends Controller
{
    private const DEFAULT_PER_PAGE  = 20;
    private const MAX_CONTENT_LENGTH = 5000;

    /**
     * POST /api/v1/posts/{postId}/comments   [CSRF required, no auth]
     * Public endpoint — new comments are created with status=pending.
     */
    public function store(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $post = Post::find((int) $args['postId']);

        if ($post === null || $post->status !== 'published') {
            return $this->error($response, 'Post not found.', 404);
        }

        $body   = (array) ($request->getParsedBody() ?? []);
        $errors = $this->validateCommentBody($body);

        if ($errors !== []) {
            return $this->json($response, ['error' => 'Validation failed', 'fields' => $errors], 422);
        }

        $comment = Comment::create([
            'post_id'      => $post->id,
            'author_name'  => trim((string) $body['author_name']),
            'author_email' => strtolower(trim((string) $body['author_email'])),
            'content'      => trim((string) $body['content']),
            'status'       => 'pending',
        ]);

        // Do not expose author_email in the public response (privacy)
        return $this->json($response, [
            'data' => [
                'id'          => $comment->id,
                'post_id'     => $comment->post_id,
                'author_name' => $comment->author_name,
                'status'      => $comment->status,
                'created_at'  => $comment->created_at,
            ],
        ], 201);
    }

    /**
     * GET /api/v1/comments   [Auth required]
     * Admin: lists all comments with optional filters.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params  = $request->getQueryParams();
        $page    = max(1, (int) ($params['page']     ?? 1));
        $perPage = min(100, max(1, (int) ($params['per_page'] ?? self::DEFAULT_PER_PAGE)));

        $query = Comment::with('post:id,title,slug')->orderBy('created_at', 'desc');

        if (isset($params['status']) && in_array($params['status'], ['pending', 'approved', 'spam'], true)) {
            $query->where('status', $params['status']);
        }

        if (isset($params['post_id']) && is_numeric($params['post_id'])) {
            $query->where('post_id', (int) $params['post_id']);
        }

        $total    = (clone $query)->count();
        $comments = $query
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return $this->json($response, [
            'data' => $comments->values()->toArray(),
            'meta' => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    /**
     * PUT /api/v1/comments/{id}   [Auth + CSRF required]
     * Admin: updates the status of a comment.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $comment = Comment::find((int) $args['id']);

        if ($comment === null) {
            return $this->error($response, 'Comment not found.', 404);
        }

        $body   = (array) ($request->getParsedBody() ?? []);
        $status = (string) ($body['status'] ?? '');

        if (!in_array($status, ['pending', 'approved', 'spam'], true)) {
            return $this->json($response, [
                'error'  => 'Validation failed',
                'fields' => ['status' => 'Status must be pending, approved, or spam.'],
            ], 422);
        }

        $comment->status = $status;
        $comment->save();

        return $this->json($response, ['data' => $comment->fresh()]);
    }

    /**
     * DELETE /api/v1/comments/spam   [Auth + CSRF required]
     * Bulk-deletes all comments with status=spam.
     */
    public function clearSpam(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        Comment::where('status', 'spam')->delete();

        return $response->withStatus(204);
    }

    /**
     * DELETE /api/v1/comments/{id}   [Auth + CSRF required]
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $comment = Comment::find((int) $args['id']);

        if ($comment === null) {
            return $this->error($response, 'Comment not found.', 404);
        }

        $comment->delete();

        return $response->withStatus(204);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed> $body
     * @return array<string, string>
     */
    private function validateCommentBody(array $body): array
    {
        $errors = [];

        $authorName  = trim((string) ($body['author_name']  ?? ''));
        $authorEmail = trim((string) ($body['author_email'] ?? ''));
        $content     = trim((string) ($body['content']      ?? ''));

        if ($authorName === '') {
            $errors['author_name'] = 'Name is required.';
        } elseif (mb_strlen($authorName) > 255) {
            $errors['author_name'] = 'Name must be 255 characters or fewer.';
        }

        if ($authorEmail === '') {
            $errors['author_email'] = 'Email is required.';
        } elseif (!filter_var($authorEmail, FILTER_VALIDATE_EMAIL)) {
            $errors['author_email'] = 'Invalid email format.';
        }

        if ($content === '') {
            $errors['content'] = 'Comment content is required.';
        } elseif (mb_strlen($content) > self::MAX_CONTENT_LENGTH) {
            $errors['content'] = sprintf('Comment must be %d characters or fewer.', self::MAX_CONTENT_LENGTH);
        }

        return $errors;
    }
}
