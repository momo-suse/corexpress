<?php

declare(strict_types=1);

// ── CLI only ───────────────────────────────────────────────────────────────────
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("This script must be run from the command line.\n");
}

// ── Autoload installer classes ─────────────────────────────────────────────────
spl_autoload_register(function (string $class): void {
    $prefix = 'Corexpress\\Installer\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $file = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use Corexpress\Installer\Database;
use Corexpress\Installer\Migrator;

// ── Resolve paths ──────────────────────────────────────────────────────────────
// packages/installer/migrate.php → packages/app/config.php
$configPath = dirname(__DIR__) . '/app/config.php';

// packages/installer/migrate.php → VERSION (repo root)
$versionFile = dirname(dirname(__DIR__)) . '/VERSION';

// ── Load config ────────────────────────────────────────────────────────────────
if (!file_exists($configPath)) {
    fwrite(STDERR, "Error: config.php not found at {$configPath}\n");
    fwrite(STDERR, "Run this script from the Corexpress installation root.\n");
    exit(1);
}

$config = require $configPath;

// ── Connect to database ────────────────────────────────────────────────────────
try {
    $pdo = Database::connect($config['db']);
} catch (\PDOException $e) {
    fwrite(STDERR, "Database connection failed: " . $e->getMessage() . "\n");
    exit(1);
}

// ── Run migrations ─────────────────────────────────────────────────────────────
$migrator = new Migrator($pdo);

echo "Running pending migrations...\n";

try {
    // Capture which migrations were already applied before running
    $before = $pdo->query('SELECT `version` FROM `schema_versions`')->fetchAll(\PDO::FETCH_COLUMN);

    $migrator->run();

    $after   = $pdo->query('SELECT `version` FROM `schema_versions`')->fetchAll(\PDO::FETCH_COLUMN);
    $applied = array_diff($after, $before);

    if (empty($applied)) {
        echo "No new migrations to apply. Database is up to date.\n";
    } else {
        foreach ($applied as $version) {
            echo "  Applied: {$version}\n";
        }
        echo "Migrations complete.\n";
    }
} catch (\RuntimeException $e) {
    fwrite(STDERR, "Migration error: " . $e->getMessage() . "\n");
    exit(1);
}

// ── Update app_version setting ─────────────────────────────────────────────────
if (file_exists($versionFile)) {
    $newVersion = trim((string) file_get_contents($versionFile));
    if ($newVersion !== '') {
        $stmt = $pdo->prepare(
            "INSERT INTO `settings` (`key`, `value`) VALUES ('app_version', :v)
             ON DUPLICATE KEY UPDATE `value` = :v"
        );
        $stmt->execute([':v' => $newVersion]);
        echo "Version updated to {$newVersion}.\n";
    }
}

echo "Done.\n";
exit(0);
