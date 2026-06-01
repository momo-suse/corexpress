<?php

declare(strict_types=1);

namespace Corexpress\Services;

use Corexpress\Models\Post;
use Corexpress\Models\Setting;
use Corexpress\Models\Subscriber;

class Mailer
{
    /**
     * Schedules the subscriber notification to run *after* the HTTP response is
     * sent, so publishing a post returns immediately instead of blocking the
     * request while every email goes out (the loop sleeps 100ms per recipient).
     * Re-fetches the post inside the shutdown handler to keep the closure light.
     */
    public static function notifySubscribersAsync(int $postId): void
    {
        register_shutdown_function(static function () use ($postId): void {
            // Close the connection to the client first when running under FPM,
            // so the remaining work happens in the background.
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            }
            try {
                $post = Post::find($postId);
                if ($post !== null) {
                    self::notifySubscribers($post);
                }
            } catch (\Throwable) {
                // Background send — must never surface or crash shutdown.
            }
        });
    }

    /**
     * Sends a new-post notification to all active subscribers.
     * Returns the number of emails successfully queued.
     */
    public static function notifySubscribers(Post $post): int
    {
        $domain = self::domain();

        $settings   = Setting::whereIn('key', ['blog_name', 'blog_logo_url', 'active_style_collection', 'app_locale'])
                              ->pluck('value', 'key');
        $blogName   = $settings['blog_name']              ?? 'Blog';
        $logoUrl    = $settings['blog_logo_url']          ?? '';
        $collection = $settings['active_style_collection'] ?? 'default';
        $locale     = $settings['app_locale']             ?? 'en';

        $logoAbsUrl = $logoUrl
            ? (str_starts_with($logoUrl, 'http') ? $logoUrl : rtrim($domain, '/') . $logoUrl)
            : '';

        $t = self::loadTranslations($locale);

        $postUrl = rtrim($domain, '/') . '/post/' . $post->slug;

        $excerpt = $post->excerpt
            ? strip_tags($post->excerpt)
            : mb_substr(strip_tags($post->content ?? ''), 0, 300);

        if (mb_strlen(strip_tags($post->content ?? '')) > 300 && !$post->excerpt) {
            $excerpt .= '…';
        }

        // This may run as a background task after fastcgi_finish_request(); lift
        // the time limit and stream subscribers in chunks so a large list neither
        // hits max_execution_time nor loads the whole table into memory.
        @set_time_limit(0);

        $sent = 0;

        Subscriber::where('subscribed', 1)
            ->orderBy('id')
            ->chunkById(200, function ($subscribers) use (&$sent, $domain, $blogName, $logoAbsUrl, $post, $excerpt, $postUrl, $collection, $t): void {
                foreach ($subscribers as $subscriber) {
                    $unsubscribeUrl = rtrim($domain, '/') . '/api/v1/auth/subscriber/unsubscribe?token=' . urlencode($subscriber->unsubscribe_token);

                    $html = self::renderTemplate($collection, [
                        'blogName'       => $blogName,
                        'blogLogoUrl'    => $logoAbsUrl,
                        'postTitle'      => $post->title,
                        'excerpt'        => $excerpt,
                        'postUrl'        => $postUrl,
                        'subscriberName' => $subscriber->name,
                        'unsubscribeUrl' => $unsubscribeUrl,
                        't'              => $t,
                    ]);

                    $headers = implode("\r\n", [
                        'MIME-Version: 1.0',
                        'Content-Type: text/html; charset=UTF-8',
                        'From: ' . $blogName . ' <noreply@' . parse_url($domain, PHP_URL_HOST) . '>',
                        'Reply-To: noreply@' . parse_url($domain, PHP_URL_HOST),
                        'X-Mailer: Corexpress',
                    ]);

                    $subject = '[' . $blogName . '] ' . $post->title;

                    if (@mail($subscriber->email, $subject, $html, $headers)) {
                        $sent++;
                    }

                    usleep(100000);
                }
            });

        return $sent;
    }

    private static function domain(): string
    {
        $configPath = dirname(__DIR__, 2) . '/config.php';
        if (file_exists($configPath)) {
            $config = require $configPath;
            return $config['app']['domain'] ?? '';
        }
        return '';
    }

    private static function loadTranslations(string $locale): array
    {
        $path = __DIR__ . '/EmailTemplates/locales/' . $locale . '.php';
        if (!file_exists($path)) {
            $path = __DIR__ . '/EmailTemplates/locales/en.php';
        }
        return require $path;
    }

    private static function renderTemplate(string $collection, array $vars): string
    {
        $path = __DIR__ . '/EmailTemplates/' . $collection . '.php';
        if (!file_exists($path)) {
            $path = __DIR__ . '/EmailTemplates/default.php';
        }
        return (static function (array $v, string $tplPath): string {
            ob_start();
            extract($v);
            include $tplPath;
            return (string) ob_get_clean();
        })($vars, $path);
    }
}
