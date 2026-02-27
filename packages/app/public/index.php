<?php

declare(strict_types=1);

use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// ── Bootstrap application ──────────────────────────────────────────────────
$app = AppFactory::create();

// Add routing middleware
$app->addRoutingMiddleware();

// Add error middleware (display errors only in development)
$displayErrors = (getenv('APP_ENV') ?: 'production') === 'development';
$app->addErrorMiddleware($displayErrors, true, true);

// ── Load routes ────────────────────────────────────────────────────────────
require __DIR__ . '/../src/Routes/web.php';
require __DIR__ . '/../src/Routes/api.php';

$app->run();