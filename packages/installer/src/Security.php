<?php

declare(strict_types=1);

namespace Corexpress\Installer;

/**
 * Security helpers for the web installer.
 *
 * Provides CSRF token generation/verification and cryptographic
 * session key generation. No external dependencies.
 */
final class Security
{
    private const SESSION_KEY = 'installer';

    // ── CSRF ───────────────────────────────────────────────────────────────────

    /**
     * Generates and stores a CSRF token in the session.
     * Always generates a fresh token (call once per page render).
     */
    public static function generateCsrfToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $_SESSION[self::SESSION_KEY]['csrf'] = $token;
        return $token;
    }

    /**
     * Returns the current CSRF token without regenerating it.
     * Generates one if none exists.
     */
    public static function getCsrfToken(): string
    {
        if (empty($_SESSION[self::SESSION_KEY]['csrf'])) {
            return self::generateCsrfToken();
        }
        return $_SESSION[self::SESSION_KEY]['csrf'];
    }

    /**
     * Verifies a CSRF token from a form POST.
     * Constant-time comparison to prevent timing attacks.
     */
    public static function verifyCsrfToken(string $token): bool
    {
        $stored = $_SESSION[self::SESSION_KEY]['csrf'] ?? '';
        if ($stored === '') {
            return false;
        }
        return hash_equals($stored, $token);
    }

    /**
     * Verifies the CSRF token from an AJAX request header.
     */
    public static function verifyCsrfHeader(): bool
    {
        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        return self::verifyCsrfToken($header);
    }

    // ── Session key ────────────────────────────────────────────────────────────

    /**
     * Generates a cryptographically secure 64-character hex session key.
     * Used as the app.session_key value in config.php.
     */
    public static function generateSessionKey(): string
    {
        return bin2hex(random_bytes(32));
    }

    // ── Input sanitization ─────────────────────────────────────────────────────

    /**
     * Sanitizes a string for safe HTML output.
     */
    public static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
