<?php

declare(strict_types=1);

namespace Corexpress\Installer;

use PDO;
use PDOException;

/**
 * Database connection helper for the web installer.
 *
 * Wraps PDO to provide a clean API for testing connections
 * and returning a ready-to-use PDO instance.
 */
final class Database
{
    /**
     * Creates and returns a PDO connection using the provided credentials.
     *
     * @param array{host: string, port: int, name: string, user: string, password: string} $config
     * @throws PDOException on connection failure
     */
    public static function connect(array $config): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $config['host'],
            $config['port'],
            $config['name']
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        return new PDO($dsn, $config['user'], $config['password'], $options);
    }

    /**
     * Tests a database connection without throwing — returns a result array.
     *
     * @param array{host: string, port: int, name: string, user: string, password: string} $config
     * @return array{ok: bool, error?: string}
     */
    public static function test(array $config): array
    {
        try {
            $pdo = self::connect($config);
            // Verify we can run a query (connection is truly usable)
            $pdo->query('SELECT 1');
            return ['ok' => true];
        } catch (PDOException $e) {
            return ['ok' => false, 'error' => self::humanizeError($e->getMessage())];
        }
    }

    /**
     * Converts cryptic PDO/MySQL error messages into user-friendly text.
     */
    private static function humanizeError(string $message): string
    {
        if (str_contains($message, 'Access denied')) {
            return 'Access denied — check your username and password.';
        }
        if (str_contains($message, 'Unknown database')) {
            return 'Database not found — verify the database name.';
        }
        if (str_contains($message, 'Connection refused') || str_contains($message, 'php_network_getaddresses')) {
            return 'Could not reach the server — check the host and port.';
        }
        if (str_contains($message, 'Timed out')) {
            return 'Connection timed out — the server may be unreachable.';
        }
        // Return original message stripped of internal details for other errors
        return 'Connection failed: ' . preg_replace('/\[.*?\]\s*/', '', $message);
    }
}
