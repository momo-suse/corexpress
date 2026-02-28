<?php

declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ── Health check ───────────────────────────────────────────────────────────
$app->get('/health', function (Request $request, Response $response): Response {
    $response->getBody()->write(json_encode(['status' => 'ok', 'app' => 'corexpress']));
    return $response->withHeader('Content-Type', 'application/json');
});

// ── Blog public view ───────────────────────────────────────────────────────
// Serves the pre-built React SPA for all non-API routes.
$app->get('[/{path:.*}]', function (Request $request, Response $response): Response {
    $indexPath = __DIR__ . '/../../public/index.html';

    if (!file_exists($indexPath)) {
        $response->getBody()->write('<h1>Corexpress</h1><p>Frontend not built yet. Run <code>npm run build</code> in packages/web/.</p>');
        return $response->withHeader('Content-Type', 'text/html');
    }

    $response->getBody()->write(file_get_contents($indexPath));
    return $response->withHeader('Content-Type', 'text/html');
});