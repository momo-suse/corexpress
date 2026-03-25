<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Illuminate\Container\Container;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;

// ── Eloquent with SQLite in-memory (no config.php required) ────────────────
$capsule = new Capsule();
$capsule->addConnection([
    'driver'   => 'sqlite',
    'database' => ':memory:',
    'prefix'   => '',
]);
$capsule->setEventDispatcher(new Dispatcher(new Container()));
$capsule->setAsGlobal();
$capsule->bootEloquent();

// ── Simulate PHP session without starting a real one ───────────────────────
// Controllers and middleware read/write $_SESSION directly.
// Setting it as a plain array here allows CLI tests to run without
// triggering "headers already sent" errors.
if (!isset($_SESSION)) {
    $_SESSION = [];
}
