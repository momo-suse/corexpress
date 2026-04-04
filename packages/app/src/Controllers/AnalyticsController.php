<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\PageView;
use Corexpress\Services\RateLimiter;
use Illuminate\Database\Capsule\Manager as DB;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class AnalyticsController extends Controller
{
    private const VIEW_MAX_PER_IP = 10;
    private const VIEW_WINDOW     = 60; // 1 minute

    private const BOT_PATTERNS = [
        'bot', 'crawl', 'spider', 'slurp', 'bingbot', 'googlebot', 'yandex',
        'baiduspider', 'duckduckbot', 'facebot', 'ia_archiver', 'semrush',
        'ahrefsbot', 'mj12bot', 'dotbot', 'rogerbot', 'exabot', 'zgrab',
        'python-requests', 'go-http-client', 'java/', 'curl/', 'wget/',
        'libwww', 'httpunit', 'nutch', 'phpcrawl', 'msnbot', 'archive.org',
    ];

    /**
     * POST /api/v1/analytics/view   [public, no CSRF]
     * Records a page view if the request passes bot and rate-limit checks.
     */
    public function record(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $ip        = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');

        foreach (self::BOT_PATTERNS as $pattern) {
            if (str_contains($userAgent, $pattern)) {
                return $this->json($response, ['data' => 'ignored'], 200);
            }
        }

        $referer    = $_SERVER['HTTP_REFERER'] ?? '';
        $appDomain  = $this->appDomain();
        if ($referer !== '' && !str_starts_with($referer, $appDomain)) {
            return $this->json($response, ['data' => 'ignored'], 200);
        }

        $rateLimiter  = new RateLimiter();
        $rateLimitKey = 'analytics:' . $ip;
        if ($rateLimiter->tooManyAttempts($rateLimitKey, self::VIEW_MAX_PER_IP, self::VIEW_WINDOW)) {
            return $this->json($response, ['data' => 'ignored'], 200);
        }
        $rateLimiter->increment($rateLimitKey, self::VIEW_WINDOW);

        $body = (array) ($request->getParsedBody() ?? []);
        $slug = trim((string) ($body['slug'] ?? ''));
        if ($slug === '' || strlen($slug) > 255) {
            return $this->error($response, 'Invalid slug.', 422);
        }

        $ipHash  = $this->ipHash($ip);
        $dateKey = date('Y-m-d');

        try {
            PageView::firstOrCreate(
                ['ip_hash' => $ipHash, 'page_slug' => $slug, 'date_key' => $dateKey],
                ['page_slug' => $slug, 'ip_hash' => $ipHash, 'date_key' => $dateKey]
            );
        } catch (\Exception) {
            // Ignore duplicate key violations — already counted
        }

        if (random_int(1, 100) === 1) {
            PageView::where('viewed_at', '<', date('Y-m-d H:i:s', strtotime('-90 days')))->delete();
        }

        return $this->json($response, ['data' => 'ok'], 200);
    }

    /**
     * GET /api/v1/analytics/summary   [admin auth required]
     * Returns aggregated view counts for today (by hour), this week and this month (by day).
     */
    public function summary(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $today = DB::table('page_views')
            ->selectRaw('HOUR(viewed_at) as h, COUNT(*) as c')
            ->whereRaw('DATE(viewed_at) = CURDATE()')
            ->groupByRaw('HOUR(viewed_at)')
            ->orderBy('h')
            ->get()
            ->mapWithKeys(fn($row) => [(int) $row->h => (int) $row->c])
            ->all();

        $week = DB::table('page_views')
            ->selectRaw('date_key, COUNT(*) as c')
            ->whereRaw('date_key >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)')
            ->groupBy('date_key')
            ->orderBy('date_key')
            ->get()
            ->mapWithKeys(fn($row) => [$row->date_key => (int) $row->c])
            ->all();

        $month = DB::table('page_views')
            ->selectRaw('date_key, COUNT(*) as c')
            ->whereRaw('date_key >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)')
            ->groupBy('date_key')
            ->orderBy('date_key')
            ->get()
            ->mapWithKeys(fn($row) => [$row->date_key => (int) $row->c])
            ->all();

        return $this->json($response, [
            'data' => [
                'today' => $today,
                'week'  => $week,
                'month' => $month,
            ],
        ]);
    }

    private function ipHash(string $ip): string
    {
        $salt = $this->sessionKey();
        return hash('sha256', $ip . $salt);
    }

    private function sessionKey(): string
    {
        $config = @include dirname(__DIR__, 3) . '/config.php';
        return (string) ($config['app']['session_key'] ?? 'corexpress');
    }

    private function appDomain(): string
    {
        $config = @include dirname(__DIR__, 3) . '/config.php';
        return (string) ($config['app']['domain'] ?? '');
    }
}
