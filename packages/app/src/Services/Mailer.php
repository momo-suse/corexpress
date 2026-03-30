<?php

declare(strict_types=1);

namespace Corexpress\Services;

use Corexpress\Models\Post;
use Corexpress\Models\Setting;
use Corexpress\Models\Subscriber;

class Mailer
{
    /**
     * Sends a new-post notification to all active subscribers.
     * Returns the number of emails successfully queued.
     */
    public static function notifySubscribers(Post $post): int
    {
        $domain   = self::domain();
        $blogName = Setting::where('key', 'blog_name')->value('value') ?? 'Blog';
        $postUrl  = rtrim($domain, '/') . '/post/' . $post->slug;

        $excerpt = $post->excerpt
            ? strip_tags($post->excerpt)
            : mb_substr(strip_tags($post->content ?? ''), 0, 300);

        if (mb_strlen(strip_tags($post->content ?? '')) > 300 && !$post->excerpt) {
            $excerpt .= '…';
        }

        $subscribers = Subscriber::where('subscribed', 1)->get();
        $sent = 0;

        foreach ($subscribers as $subscriber) {
            $unsubscribeUrl = rtrim($domain, '/') . '/api/v1/auth/subscriber/unsubscribe?token=' . urlencode($subscriber->unsubscribe_token);

            $html = self::buildEmailHtml(
                blogName: $blogName,
                postTitle: $post->title,
                excerpt: $excerpt,
                postUrl: $postUrl,
                subscriberName: $subscriber->name,
                unsubscribeUrl: $unsubscribeUrl,
            );

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

            usleep(100000); // 100ms between sends to avoid SMTP throttling
        }

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

    private static function buildEmailHtml(
        string $blogName,
        string $postTitle,
        string $excerpt,
        string $postUrl,
        string $subscriberName,
        string $unsubscribeUrl,
    ): string {
        $blogNameE    = htmlspecialchars($blogName, ENT_QUOTES);
        $postTitleE   = htmlspecialchars($postTitle, ENT_QUOTES);
        $excerptE     = nl2br(htmlspecialchars($excerpt, ENT_QUOTES));
        $postUrlE     = htmlspecialchars($postUrl, ENT_QUOTES);
        $nameE        = htmlspecialchars($subscriberName, ENT_QUOTES);
        $unsubscribeE = htmlspecialchars($unsubscribeUrl, ENT_QUOTES);

        return <<<HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{$postTitleE}</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
                  <tr>
                    <td style="background:#18181b;padding:24px 32px;">
                      <p style="margin:0;color:#a1a1aa;font-size:13px;text-transform:uppercase;letter-spacing:1px;">{$blogNameE}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 32px 24px;">
                      <p style="margin:0 0 8px;color:#71717a;font-size:13px;">Hi {$nameE},</p>
                      <h1 style="margin:0 0 16px;font-size:22px;color:#09090b;line-height:1.3;">{$postTitleE}</h1>
                      <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.6;">{$excerptE}</p>
                      <a href="{$postUrlE}"
                         style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                        Read article →
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 32px 24px;border-top:1px solid #f4f4f5;">
                      <p style="margin:0;color:#a1a1aa;font-size:12px;">
                        You're receiving this because you subscribed to {$blogNameE}.<br>
                        <a href="{$unsubscribeE}" style="color:#71717a;">Unsubscribe</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        HTML;
    }
}
