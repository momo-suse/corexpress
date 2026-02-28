<?php

declare(strict_types=1);

namespace Corexpress\Installer;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Runs SQL migration files against the database.
 *
 * Reads all *.sql files from the migrations/ directory in alphabetical order
 * and executes only the ones that have not been applied yet.
 *
 * Applied migrations are tracked in a `schema_versions` table:
 *   CREATE TABLE schema_versions (version VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP)
 *
 * On a fresh install every migration runs. On re-runs (dev env, upgrades)
 * only new migrations are applied, existing data is preserved.
 */
final class Migrator
{
    private PDO $pdo;
    private string $migrationsDir;

    public function __construct(PDO $pdo)
    {
        $this->pdo           = $pdo;
        $this->migrationsDir = dirname(__DIR__) . '/migrations';
    }

    /**
     * Ensures the schema_versions table exists, then runs any pending migrations.
     *
     * @throws RuntimeException on migration failure
     */
    public function run(): void
    {
        $this->ensureVersionsTable();

        $files = $this->getMigrationFiles();

        if (empty($files)) {
            throw new RuntimeException('No migration files found in ' . $this->migrationsDir);
        }

        $applied = $this->getAppliedVersions();

        try {
            foreach ($files as $file) {
                $version = basename($file);

                if (in_array($version, $applied, true)) {
                    continue; // Already applied — skip
                }

                $sql = file_get_contents($file);
                if ($sql === false) {
                    throw new RuntimeException("Could not read migration file: {$file}");
                }

                $this->executeSql($sql);
                $this->markApplied($version);
            }
        } catch (PDOException | RuntimeException $e) {
            throw new RuntimeException('Migration failed: ' . $e->getMessage(), 0, $e);
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Creates the schema_versions table if it does not exist.
     */
    private function ensureVersionsTable(): void
    {
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS `schema_versions` (
                `version`    VARCHAR(255) NOT NULL,
                `applied_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`version`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    /**
     * Returns the list of already-applied migration filenames.
     *
     * @return string[]
     */
    private function getAppliedVersions(): array
    {
        $stmt = $this->pdo->query('SELECT `version` FROM `schema_versions`');
        if ($stmt === false) {
            return [];
        }
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Records a migration as applied.
     */
    private function markApplied(string $version): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO `schema_versions` (`version`) VALUES (:v)
             ON DUPLICATE KEY UPDATE `applied_at` = CURRENT_TIMESTAMP'
        );
        $stmt->execute([':v' => $version]);
    }

    /**
     * Returns sorted list of .sql file paths from the migrations directory.
     *
     * @return string[]
     */
    private function getMigrationFiles(): array
    {
        if (!is_dir($this->migrationsDir)) {
            throw new RuntimeException('Migrations directory not found: ' . $this->migrationsDir);
        }

        $files = glob($this->migrationsDir . '/*.sql');
        if ($files === false) {
            return [];
        }

        sort($files);
        return $files;
    }

    /**
     * Splits a multi-statement SQL string on semicolons and executes each.
     * Skips empty statements.
     */
    private function executeSql(string $sql): void
    {
        // Strip block comments (/* ... */) and line comments (-- ...)
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
        $sql = preg_replace('/--[^\n]*/', '', $sql);

        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            static fn(string $s) => $s !== ''
        );

        foreach ($statements as $statement) {
            $this->pdo->exec($statement);
        }
    }
}
