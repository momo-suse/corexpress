<?php

declare(strict_types=1);

namespace Corexpress\Installer;

/**
 * Checks system requirements before installation.
 *
 * Validates PHP version, required extensions, Apache mod_rewrite,
 * and file system write permissions.
 */
final class Requirements
{
    /**
     * Runs all requirement checks and returns a structured result set.
     *
     * @return array<string, array{label: string, ok: bool, detail: string, critical: bool}>
     */
    public static function check(): array
    {
        return [
            'php_version'  => self::checkPhpVersion(),
            'pdo'          => self::checkExtension('pdo', 'PDO'),
            'pdo_mysql'    => self::checkExtension('pdo_mysql', 'PDO MySQL'),
            'mbstring'     => self::checkExtension('mbstring', 'Multibyte String'),
            'json'         => self::checkExtension('json', 'JSON'),
            'session'      => self::checkExtension('session', 'Sessions'),
            'openssl'      => self::checkExtension('openssl', 'OpenSSL'),
            'mod_rewrite'  => self::checkModRewrite(),
            'write_public' => self::checkWritable(dirname(__DIR__, 2), 'App root (/var/www/html)'),
        ];
    }

    /**
     * Returns true only if all critical requirements pass.
     *
     * @param array<string, array{ok: bool, critical: bool}> $results
     */
    public static function allPassed(array $results): bool
    {
        foreach ($results as $result) {
            if ($result['critical'] && !$result['ok']) {
                return false;
            }
        }
        return true;
    }

    // ── Individual checks ──────────────────────────────────────────────────────

    private static function checkPhpVersion(): array
    {
        $required = '8.3.0';
        $current  = PHP_VERSION;
        $ok       = version_compare($current, $required, '>=');

        return [
            'label'    => 'PHP Version',
            'ok'       => $ok,
            'detail'   => $ok
                ? "PHP {$current} detected"
                : "PHP {$required}+ required, {$current} found",
            'critical' => true,
        ];
    }

    private static function checkExtension(string $ext, string $label): array
    {
        $ok = extension_loaded($ext);

        return [
            'label'    => $label,
            'ok'       => $ok,
            'detail'   => $ok ? "Extension loaded" : "Extension '{$ext}' is not available",
            'critical' => true,
        ];
    }

    private static function checkModRewrite(): array
    {
        // On Apache, loaded modules are exposed via apache_get_modules().
        // On non-Apache servers this function doesn't exist, so we fall back
        // to checking the SERVER_SOFTWARE header.
        $ok = false;

        if (function_exists('apache_get_modules')) {
            $ok = in_array('mod_rewrite', apache_get_modules(), true);
        } elseif (isset($_SERVER['HTTP_MOD_REWRITE'])) {
            $ok = strtolower($_SERVER['HTTP_MOD_REWRITE']) === 'on';
        } else {
            // Inside the Docker container the rewrite is already confirmed by .htaccess
            // working — assume true when running as mod_php under Apache.
            $ok = str_contains($_SERVER['SERVER_SOFTWARE'] ?? '', 'Apache');
        }

        return [
            'label'    => 'Apache mod_rewrite',
            'ok'       => $ok,
            'detail'   => $ok ? "mod_rewrite is enabled" : "mod_rewrite must be enabled in Apache",
            'critical' => true,
        ];
    }

    private static function checkWritable(string $path, string $label): array
    {
        $ok = is_writable($path);

        return [
            'label'    => "Write permission: {$label}",
            'ok'       => $ok,
            // Non-critical: actual write is tested at install time (Step 5).
            // On rootless Podman / SELinux systems is_writable() may return false
            // even when the write will succeed via the container's user-namespace mapping.
            'detail'   => $ok ? "Directory is writable" : "May not be writable — will be verified at install time",
            'critical' => false,
        ];
    }
}
