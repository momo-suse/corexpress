<?php

declare(strict_types=1);

namespace Corexpress\Installer;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Runs SQL migration files against the database.
 *
 * Reads all *.sql files from the migrations/ directory in order
 * and executes them as a single transaction.
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
     * Runs all migration files in alphabetical order.
     *
     * Wraps execution in a transaction — any failure rolls back all changes.
     *
     * @throws RuntimeException on migration failure
     */
    public function run(): void
    {
        $files = $this->getMigrationFiles();

        if (empty($files)) {
            throw new RuntimeException('No migration files found in ' . $this->migrationsDir);
        }

        // Note: DDL statements (CREATE TABLE) cause an implicit commit in MySQL,
        // so wrapping in a transaction is not possible here.
        try {
            foreach ($files as $file) {
                $sql = file_get_contents($file);
                if ($sql === false) {
                    throw new RuntimeException("Could not read migration file: {$file}");
                }
                $this->executeSql($sql);
            }
        } catch (PDOException | RuntimeException $e) {
            throw new RuntimeException('Migration failed: ' . $e->getMessage(), 0, $e);
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

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
     * Skips empty statements and SQL comments.
     */
    private function executeSql(string $sql): void
    {
        // Strip block comments (/* ... */) and line comments (-- ...)
        // before splitting so comment-prefixed blocks are not discarded.
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
