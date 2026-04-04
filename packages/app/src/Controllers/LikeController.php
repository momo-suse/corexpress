<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Post;
use Corexpress\Models\PostLike;
use Corexpress\Models\Setting;
use Corexpress\Services\RateLimiter;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class LikeController extends Controller
{
    private const LIKE_MAX_PER_IP = 5;
    private const LIKE_WINDOW     = 60; // 1 minute

    /**
     * GET /api/v1/posts/{id}/likes
     * Returns like count and whether the current IP already liked this post.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        if ((Setting::where('key', 'likes_enabled')->value('value') ?? '0') !== '1') {
            return $this->error($response, 'Likes are disabled.', 404);
        }

        $post = Post::find((int) $args['id']);
        if ($post === null || $post->status !== 'published') {
            return $this->error($response, 'Post not found.', 404);
        }

        $ipHash = $this->ipHash();
        $liked  = PostLike::where('post_id', $post->id)->where('ip_hash', $ipHash)->exists();

        return $this->json($response, [
            'data' => [
                'count' => (int) $post->likes_count,
                'liked' => $liked,
            ],
        ]);
    }

    /**
     * POST /api/v1/posts/{id}/likes   [CSRF required, no auth]
     * Toggles a like for the current IP on the given post.
     */
    public function toggle(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        if ((Setting::where('key', 'likes_enabled')->value('value') ?? '0') !== '1') {
            return $this->error($response, 'Likes are disabled.', 404);
        }

        $ip          = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $rateLimiter = new RateLimiter();
        $rateLimitKey = 'like:' . $ip;

        if ($rateLimiter->tooManyAttempts($rateLimitKey, self::LIKE_MAX_PER_IP, self::LIKE_WINDOW)) {
            return $this->error($response, 'Too many requests. Please try again later.', 429);
        }
        $rateLimiter->increment($rateLimitKey, self::LIKE_WINDOW);

        $post = Post::find((int) $args['id']);
        if ($post === null || $post->status !== 'published') {
            return $this->error($response, 'Post not found.', 404);
        }

        $ipHash   = $this->ipHash();
        $existing = PostLike::where('post_id', $post->id)->where('ip_hash', $ipHash)->first();

        if ($existing !== null) {
            $existing->delete();
            Post::where('id', $post->id)->decrement('likes_count');
            $liked = false;
            $count = max(0, (int) $post->likes_count - 1);
        } else {
            PostLike::create(['post_id' => $post->id, 'ip_hash' => $ipHash]);
            Post::where('id', $post->id)->increment('likes_count');
            $liked = true;
            $count = (int) $post->likes_count + 1;
        }

        return $this->json($response, [
            'data' => ['count' => $count, 'liked' => $liked],
        ]);
    }

    private function ipHash(): string
    {
        $ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $salt = $this->sessionKey();
        return hash('sha256', $ip . $salt);
    }

    private function sessionKey(): string
    {
        $config = @include dirname(__DIR__, 3) . '/config.php';
        return (string) ($config['app']['session_key'] ?? 'corexpress');
    }
}
