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
     * @param  callable|null $t  Optional translation callable — t(string $key, array $params): string.
     *                           Falls back to the global t() if defined, otherwise returns the key as-is.
     * @return array<string, array{label: string, ok: bool, detail: string, critical: bool}>
     */
    public static function check(?callable $t = null): array
    {
        if ($t === null) {
            $t = function_exists('t')
                ? \Closure::fromCallable('t')
                : static fn(string $k, array $p = []): string => $k;
        }

        return [
            'php_version'  => self::checkPhpVersion($t),
            'pdo'          => self::checkExtension('pdo', $t('req.pdo'), $t),
            'pdo_mysql'    => self::checkExtension('pdo_mysql', $t('req.pdo_mysql'), $t),
            'mbstring'     => self::checkExtension('mbstring', $t('req.mbstring'), $t),
            'json'         => self::checkExtension('json', $t('req.json'), $t),
            'session'      => self::checkExtension('session', $t('req.session'), $t),
            'openssl'      => self::checkExtension('openssl', $t('req.openssl'), $t),
            'mod_rewrite'  => self::checkModRewrite($t),
            'write_public' => self::checkWritable(dirname(__DIR__, 2), $t),
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

    private static function checkPhpVersion(callable $t): array
    {
        $required = '8.3.0';
        $current  = PHP_VERSION;
        $ok       = version_compare($current, $required, '>=');

        return [
            'label'    => $t('req.php_version'),
            'ok'       => $ok,
            'detail'   => $ok
                ? $t('req.php_ok',   ['current' => $current])
                : $t('req.php_fail', ['required' => $required, 'current' => $current]),
            'critical' => true,
        ];
    }

    private static function checkExtension(string $ext, string $label, callable $t): array
    {
        $ok = extension_loaded($ext);

        return [
            'label'    => $label,
            'ok'       => $ok,
            'detail'   => $ok
                ? $t('req.ext_loaded')
                : $t('req.ext_missing', ['ext' => $ext]),
            'critical' => true,
        ];
    }

    private static function checkModRewrite(callable $t): array
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
            'label'    => $t('req.mod_rewrite'),
            'ok'       => $ok,
            'detail'   => $ok ? $t('req.rewrite_ok') : $t('req.rewrite_fail'),
            'critical' => true,
        ];
    }

    private static function checkWritable(string $path, callable $t): array
    {
        $ok = is_writable($path);

        return [
            'label'    => $t('req.write_public'),
            'ok'       => $ok,
            // Non-critical: actual write is tested at install time (Step 5).
            // On rootless Podman / SELinux systems is_writable() may return false
            // even when the write will succeed via the container's user-namespace mapping.
            'detail'   => $ok ? $t('req.writable_ok') : $t('req.writable_warn'),
            'critical' => false,
        ];
    }
}
