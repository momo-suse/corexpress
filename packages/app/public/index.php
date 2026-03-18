<?php

declare(strict_types=1);

// ── Config guard ───────────────────────────────────────────────────────────
// Must run BEFORE autoload: vendor/ does not exist on a fresh install
// (it is excluded from the release ZIP and requires composer install).
$configPath = __DIR__ . '/../config.php';

if (!file_exists($configPath)) {
    // Installer hasn't been run — send the browser to the web installer.
    // API clients hitting /api/* will also land here; the installer page
    // is a better UX than a raw JSON error for anyone opening the root URL.
    header('Location: /setup/', true, 302);
    exit;
}

use Corexpress\Bootstrap\Database;
use Corexpress\Middleware\SessionMiddleware;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// ── Bootstrap Eloquent ORM ─────────────────────────────────────────────────
try {
    Database::boot();
} catch (\RuntimeException $e) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// ── Bootstrap Slim application ─────────────────────────────────────────────
$app = AppFactory::create();

// Parse JSON / form / multipart request bodies — must be registered before routing
$app->addBodyParsingMiddleware();

// Routing middleware
$app->addRoutingMiddleware();

// Session middleware — starts the PHP session before any route handler executes
$app->add(new SessionMiddleware());

// Error middleware — outermost; show error details only in development
$displayErrors = (getenv('APP_ENV') ?: 'production') === 'development';
$app->addErrorMiddleware($displayErrors, true, true);

// ── Load routes ────────────────────────────────────────────────────────────
// API routes must be registered first — the SPA catch-all in web.php
// uses a wildcard pattern that would shadow any static route registered after it.
require __DIR__ . '/../src/Routes/api.php';
require __DIR__ . '/../src/Routes/web.php';

$app->run();