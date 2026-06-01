<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Handles in-panel software updates.
 *
 * check() — queries GitHub API and compares with installed VERSION file.
 * apply() — downloads the latest release ZIP, extracts it (preserving user
 *           data), runs pending DB migrations, and updates app_version.
 */
final class UpdateController extends Controller
{
    private const REPO       = 'momo-suse/corexpress';
    private const GITHUB_API = 'https://api.github.com/repos/momo-suse/corexpress/releases/latest';

    // Installation root: packages/app/src/Controllers → 4 levels up = repo root
    private string $installDir;
    private string $versionFile;
    private string $configPath;
    private string $imgDir;
    private string $backupDir;

    public function __construct()
    {
        parent::__construct();
        $this->installDir  = dirname(__DIR__, 4);
        $this->versionFile = $this->installDir . '/VERSION';
        $this->configPath  = $this->installDir . '/packages/app/config.php';
        $this->imgDir      = $this->installDir . '/packages/app/public/img';
        $this->backupDir   = $this->installDir . '/storage/backups';
    }

    // ── GET /api/v1/admin/update/check ────────────────────────────────────────

    public function check(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $current = $this->readCurrentVersion();

        $release = $this->fetchLatestRelease();
        if ($release === null) {
            return $this->json($response, [
                'current'    => $current,
                'latest'     => null,
                'has_update' => false,
                'error'      => 'Could not reach GitHub API. Check server internet access.',
            ]);
        }

        $latestTag     = $release['tag_name'] ?? '';
        $latestVersion = ltrim($latestTag, 'v');
        $latestUrl     = 'https://github.com/' . self::REPO . '/releases/tag/' . $latestTag;

        return $this->json($response, [
            'current'     => $current,
            'latest'      => $latestVersion,
            'has_update'  => ($current !== $latestVersion && $latestVersion !== ''),
            'latest_url'  => $latestUrl,
        ]);
    }

    // ── POST /api/v1/admin/update/apply ──────────────────────────────────────

    public function apply(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        // Long-running operation: extend PHP execution time limit
        set_time_limit(300);

        // ── 1. Pre-flight checks ───────────────────────────────────────────
        if (!class_exists('ZipArchive')) {
            return $this->error($response, 'PHP ZipArchive extension is not available. Contact your hosting provider.', 500);
        }

        if (!file_exists($this->configPath)) {
            return $this->error($response, 'config.php not found. Installation may be corrupted.', 500);
        }

        $previousVersion = $this->readCurrentVersion();

        // ── 2. Fetch latest release ────────────────────────────────────────
        $release = $this->fetchLatestRelease();
        if ($release === null) {
            return $this->error($response, 'Could not reach GitHub API. Check server internet access.', 502);
        }

        $latestTag   = $release['tag_name'] ?? '';
        $downloadUrl = $this->extractZipUrl($release);

        if ($latestTag === '' || $downloadUrl === '') {
            return $this->error($response, 'Could not find a downloadable ZIP in the latest release.', 502);
        }

        // ── 3. Preserve config.php ─────────────────────────────────────────
        $configBackup = file_get_contents($this->configPath);
        if ($configBackup === false) {
            return $this->error($response, 'Failed to read config.php for backup.', 500);
        }

        // ── 4. Preserve uploaded images ────────────────────────────────────
        $imgBackupDir = null;
        if (is_dir($this->imgDir)) {
            $imgBackupDir = sys_get_temp_dir() . '/corexpress-img-' . bin2hex(random_bytes(8));
            if (!$this->copyDirectory($this->imgDir, $imgBackupDir)) {
                return $this->error($response, 'Failed to backup uploaded images.', 500);
            }
        }

        // ── 5. Backup the database BEFORE touching any files ───────────────
        // This is the recovery point. If it cannot be created we abort rather
        // than update without a safety net. The backup is never auto-applied —
        // it is kept for manual recovery with `mysql < backup.sql`.
        try {
            $dbBackupFile = $this->createDatabaseBackup();
        } catch (\Throwable $e) {
            error_log('Corexpress update: DB backup failed: ' . $e->getMessage());
            return $this->error(
                $response,
                'Could not create a database backup before updating. Update aborted; nothing was changed.',
                500
            );
        }

        // Wrap the rest in a try/finally to always restore user data
        $tmpZip    = null;
        $tmpExtDir = null;

        try {
            // ── 5. Download ZIP ────────────────────────────────────────────
            $tmpZip = tempnam(sys_get_temp_dir(), 'corexpress-update-');
            if ($tmpZip === false) {
                throw new \RuntimeException('Failed to create temporary file for download.');
            }

            $zipContent = $this->downloadFile($downloadUrl);
            if ($zipContent === false) {
                throw new \RuntimeException('Failed to download update package. Check server internet access.');
            }

            if (file_put_contents($tmpZip, $zipContent) === false) {
                throw new \RuntimeException('Failed to write downloaded ZIP to disk.');
            }
            unset($zipContent); // free memory

            // ── 6. Verify ZIP is a valid Corexpress release ───────────────
            $zip = new \ZipArchive();
            if ($zip->open($tmpZip) !== true) {
                throw new \RuntimeException('Downloaded file is not a valid ZIP archive.');
            }

            $hasExpectedContent = false;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if (str_starts_with($name, 'packages/app/')) {
                    $hasExpectedContent = true;
                    break;
                }
            }

            if (!$hasExpectedContent) {
                $zip->close();
                throw new \RuntimeException('Downloaded ZIP does not appear to be a valid Corexpress release.');
            }

            // ── 7. Extract to temp directory ──────────────────────────────
            $tmpExtDir = sys_get_temp_dir() . '/corexpress-extract-' . bin2hex(random_bytes(8));
            mkdir($tmpExtDir, 0755, true);

            // Extract only safe paths (zip slip prevention)
            $allowedPrefixes = ['packages/', 'install.sh', 'update.sh', 'VERSION', '.htaccess'];
            $skipPaths       = ['packages/app/config.php', 'packages/app/public/img/'];

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);

                // Reject any path traversal attempts
                if (str_contains($name, '..') || str_starts_with($name, '/')) {
                    continue;
                }

                // Only extract files from expected directories
                $allowed = false;
                foreach ($allowedPrefixes as $prefix) {
                    if (str_starts_with($name, $prefix) || $name === $prefix) {
                        $allowed = true;
                        break;
                    }
                }
                if (!$allowed) {
                    continue;
                }

                // Skip user-owned paths
                $skip = false;
                foreach ($skipPaths as $skipPath) {
                    if (str_starts_with($name, $skipPath)) {
                        $skip = true;
                        break;
                    }
                }
                if ($skip) {
                    continue;
                }

                // Extract file
                $destPath = $tmpExtDir . '/' . $name;
                $destDir  = dirname($destPath);
                if (!is_dir($destDir)) {
                    mkdir($destDir, 0755, true);
                }

                // Directory entries end with '/'
                if (str_ends_with($name, '/')) {
                    if (!is_dir($destPath)) {
                        mkdir($destPath, 0755, true);
                    }
                    continue;
                }

                $content = $zip->getFromIndex($i);
                if ($content === false) {
                    throw new \RuntimeException("Failed to read '{$name}' from ZIP archive.");
                }
                file_put_contents($destPath, $content);
            }

            $zip->close();

            // ── 8. Copy extracted files to installation directory ─────────
            $this->copyDirectory($tmpExtDir, $this->installDir);

            // ── 9. Restore config.php ─────────────────────────────────────
            if (file_put_contents($this->configPath, $configBackup) === false) {
                throw new \RuntimeException('CRITICAL: Failed to restore config.php. Restore manually from your backup.');
            }

            // ── 10. Restore uploaded images ───────────────────────────────
            if ($imgBackupDir !== null && is_dir($imgBackupDir)) {
                if (!is_dir($this->imgDir)) {
                    mkdir($this->imgDir, 0755, true);
                }
                $this->copyDirectory($imgBackupDir, $this->imgDir);
            }

            // ── 11. Run database migrations ───────────────────────────────
            $migrationsApplied = $this->runMigrations();

            // ── 12. Invalidate opcode cache if available ──────────────────
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }

            // ── 13. Update app_version setting ────────────────────────────
            $newVersion = $this->readCurrentVersion();

        } catch (\Throwable $e) {
            // Restore config.php on failure
            if ($configBackup !== false) {
                @file_put_contents($this->configPath, $configBackup);
            }
            // Restore images on failure
            if ($imgBackupDir !== null && is_dir($imgBackupDir)) {
                if (!is_dir($this->imgDir)) {
                    @mkdir($this->imgDir, 0755, true);
                }
                $this->copyDirectory($imgBackupDir, $this->imgDir);
            }

            error_log('Corexpress update failed: ' . $e->getMessage());

            return $this->json($response, [
                'success' => false,
                'error'   => 'Update failed, but no data was dropped. A pre-update database '
                    . 'backup is available on the server for manual recovery if needed.',
                'backup'  => $dbBackupFile,
            ], 500);

        } finally {
            // Clean up temp files
            if ($tmpZip !== null && file_exists($tmpZip)) {
                @unlink($tmpZip);
            }
            if ($tmpExtDir !== null && is_dir($tmpExtDir)) {
                $this->removeDirectory($tmpExtDir);
            }
            if ($imgBackupDir !== null && is_dir($imgBackupDir)) {
                $this->removeDirectory($imgBackupDir);
            }
        }

        return $this->json($response, [
            'success'           => true,
            'previous_version'  => $previousVersion,
            'new_version'       => $newVersion,
            'migrations_applied' => $migrationsApplied,
            'backup'            => $dbBackupFile,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function readCurrentVersion(): string
    {
        if (!file_exists($this->versionFile)) {
            return 'unknown';
        }
        return trim((string) file_get_contents($this->versionFile));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fetchLatestRelease(): ?array
    {
        $context = stream_context_create([
            'http' => [
                'method'  => 'GET',
                'header'  => "User-Agent: Corexpress-Updater/1.0\r\nAccept: application/json\r\n",
                'timeout' => 15,
            ],
        ]);

        $raw = @file_get_contents(self::GITHUB_API, false, $context);
        if ($raw === false) {
            return null;
        }

        $data = json_decode($raw, true);
        return is_array($data) ? $data : null;
    }

    /**
     * Extracts the corexpress.zip download URL from a GitHub release array.
     *
     * @param array<string, mixed> $release
     */
    private function extractZipUrl(array $release): string
    {
        $assets = $release['assets'] ?? [];
        if (!is_array($assets)) {
            return '';
        }

        $trustedPrefixes = [
            'https://github.com/',
            'https://github-releases.githubusercontent.com/',
        ];

        foreach ($assets as $asset) {
            $url = (string) ($asset['browser_download_url'] ?? '');
            if ($url === '' || !str_ends_with($url, '.zip')) {
                continue;
            }

            $trusted = false;
            foreach ($trustedPrefixes as $prefix) {
                if (str_starts_with($url, $prefix)) {
                    $trusted = true;
                    break;
                }
            }

            if ($trusted) {
                return $url;
            }
        }
        return '';
    }

    /**
     * Downloads a URL and returns the content, or false on failure.
     *
     * @return string|false
     */
    private function downloadFile(string $url): string|false
    {
        $context = stream_context_create([
            'http' => [
                'method'          => 'GET',
                'header'          => "User-Agent: Corexpress-Updater/1.0\r\n",
                'follow_location' => 1,
                'timeout'         => 120,
            ],
        ]);

        return @file_get_contents($url, false, $context);
    }

    /**
     * Recursively copies a directory. Returns false on failure.
     */
    private function copyDirectory(string $src, string $dst): bool
    {
        if (!is_dir($dst)) {
            mkdir($dst, 0755, true);
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($src, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $destPath = $dst . '/' . $iterator->getSubPathname();
            if ($item->isDir()) {
                if (!is_dir($destPath)) {
                    mkdir($destPath, 0755, true);
                }
            } else {
                if (@copy($item->getPathname(), $destPath) === false) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Recursively removes a directory.
     */
    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isDir()) {
                rmdir($item->getPathname());
            } else {
                unlink($item->getPathname());
            }
        }

        rmdir($dir);
    }

    /**
     * Loads the installer's Migrator and runs pending migrations.
     *
     * Migrations are additive and idempotent and each runs in its own
     * transaction. On failure the Migrator aborts and throws WITHOUT dropping
     * any data; the caller surfaces the pre-update backup for manual recovery.
     *
     * @return string[] list of applied migration filenames
     */
    private function runMigrations(): array
    {
        // Manually load installer classes (not in Composer autoloader)
        $installerSrc = $this->installDir . '/packages/installer/src';
        require_once $installerSrc . '/Database.php';
        require_once $installerSrc . '/Migrator.php';

        $config = require $this->configPath;

        $pdo = \Corexpress\Installer\Database::connect($config['db']);

        $before   = $pdo->query('SELECT `version` FROM `schema_versions`')->fetchAll(\PDO::FETCH_COLUMN);
        $migrator = new \Corexpress\Installer\Migrator($pdo);
        $migrator->run(); // aborts and throws on failure; never drops data
        $after    = $pdo->query('SELECT `version` FROM `schema_versions`')->fetchAll(\PDO::FETCH_COLUMN);

        $applied = array_values(array_diff($after, $before));

        // Update app_version setting
        $newVersion = $this->readCurrentVersion();
        if ($newVersion !== 'unknown') {
            $upd = $pdo->prepare("UPDATE `settings` SET `value` = ? WHERE `key` = 'app_version'");
            $upd->execute([$newVersion]);
            if ($upd->rowCount() === 0) {
                $pdo->prepare("INSERT INTO `settings` (`key`, `value`) VALUES ('app_version', ?)")
                    ->execute([$newVersion]);
            }
        }

        return $applied;
    }

    /**
     * Creates a full database backup before updating. Tries native mysqldump
     * first (fast, reliable); falls back to a pure-PHP dump when shell exec is
     * unavailable (common on locked-down shared hosting). The file lands in a
     * web-protected storage/backups directory and is meant to be imported
     * manually with `mysql < backup.sql` if recovery is ever needed — it is
     * never applied automatically.
     *
     * @return string absolute path to the backup file
     * @throws \RuntimeException if no backup could be produced
     */
    private function createDatabaseBackup(): string
    {
        $this->ensureBackupDir();

        /** @var array{db: array{host:string,port:int,name:string,user:string,password:string}} $config */
        $config = require $this->configPath;
        $db     = $config['db'];

        $outputFile = $this->backupDir
            . '/db-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.sql';

        if ($this->dumpViaMysqldump($db, $outputFile)) {
            $this->pruneOldBackups();
            return $outputFile;
        }

        // Fallback: pure-PHP dump via PDO (no shell required).
        require_once $this->installDir . '/packages/installer/src/Database.php';
        $pdo = \Corexpress\Installer\Database::connect($db);
        $this->phpDumpDatabase($pdo, $outputFile);
        $this->pruneOldBackups();

        return $outputFile;
    }

    /**
     * Ensures the backup directory exists and is not readable over the web.
     *
     * @throws \RuntimeException if the directory cannot be created
     */
    private function ensureBackupDir(): void
    {
        if (!is_dir($this->backupDir)) {
            if (!mkdir($this->backupDir, 0750, true) && !is_dir($this->backupDir)) {
                throw new \RuntimeException('Could not create backup directory: ' . $this->backupDir);
            }
        }

        $htaccess = $this->backupDir . '/.htaccess';
        if (!file_exists($htaccess)) {
            // Deny all web access to raw DB dumps (Apache 2.2 and 2.4 syntax).
            @file_put_contents(
                $htaccess,
                "Require all denied\n<IfModule !mod_authz_core.c>\n    Deny from all\n</IfModule>\n"
            );
        }
    }

    /**
     * Attempts a mysqldump into $outputFile. Returns true on success (a non-empty
     * file written with exit code 0), false if mysqldump or shell exec is
     * unavailable so the caller can fall back to the PHP dump.
     *
     * @param array{host:string,port:int,name:string,user:string,password:string} $db
     */
    private function dumpViaMysqldump(array $db, string $outputFile): bool
    {
        // exec() is often disabled on shared hosting.
        if (!function_exists('exec')) {
            return false;
        }
        $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));
        if (in_array('exec', $disabled, true)) {
            return false;
        }

        // Credentials go in a 0600 defaults file so the password never appears
        // in the process list.
        $defaultsFile = tempnam(sys_get_temp_dir(), 'cx-my-');
        if ($defaultsFile === false) {
            return false;
        }
        $ini = "[client]\n"
            . 'host='     . $db['host']        . "\n"
            . 'port='     . (int) $db['port']  . "\n"
            . 'user='     . $db['user']        . "\n"
            . 'password=' . $db['password']    . "\n";
        if (file_put_contents($defaultsFile, $ini) === false) {
            @unlink($defaultsFile);
            return false;
        }
        @chmod($defaultsFile, 0600);

        $errFile = $outputFile . '.err';
        $cmd = 'mysqldump --defaults-extra-file=' . escapeshellarg($defaultsFile)
            . ' --single-transaction --no-tablespaces --skip-lock-tables '
            . escapeshellarg((string) $db['name'])
            . ' > ' . escapeshellarg($outputFile)
            . ' 2> ' . escapeshellarg($errFile);

        $output   = [];
        $exitCode = 1;
        @exec($cmd, $output, $exitCode);

        @unlink($defaultsFile);

        $ok = ($exitCode === 0 && is_file($outputFile) && filesize($outputFile) > 0);

        @unlink($errFile);
        if (!$ok) {
            @unlink($outputFile);
        }

        return $ok;
    }

    /**
     * Keeps only the most recent $keep backups to avoid filling the disk
     * (a full disk would itself break the site).
     */
    private function pruneOldBackups(int $keep = 5): void
    {
        $files = glob($this->backupDir . '/db-*.sql');
        if ($files === false || count($files) <= $keep) {
            return;
        }
        sort($files); // timestamped names sort chronologically — oldest first
        foreach (array_slice($files, 0, count($files) - $keep) as $old) {
            @unlink($old);
        }
    }

    /**
     * Pure-PHP database dump using PDO (no shell required — works on any shared host).
     * Output format: SET FK_CHECKS=0 → DROP TABLE IF EXISTS → CREATE TABLE → INSERTs → FK_CHECKS=1.
     * Produces a standard mysql-importable .sql file.
     *
     * @throws \RuntimeException if the backup file cannot be written
     */
    private function phpDumpDatabase(\PDO $pdo, string $outputFile): void
    {
        $tables = $pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN);

        $lines = [
            '-- Corexpress DB backup: ' . date('Y-m-d H:i:s'),
            '-- Generated by UpdateController before running migrations',
            'SET FOREIGN_KEY_CHECKS = 0;',
            '',
        ];

        foreach ($tables as $table) {
            $row     = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_NUM);
            $lines[] = "-- Table: `{$table}`";
            $lines[] = "DROP TABLE IF EXISTS `{$table}`;";
            $lines[] = $row[1] . ';';
            $lines[] = '';

            $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(\PDO::FETCH_ASSOC);
            foreach ($rows as $dataRow) {
                $cols    = implode(', ', array_map(static fn($c) => "`{$c}`", array_keys($dataRow)));
                $vals    = implode(', ', array_map(
                    static fn($v) => $v === null ? 'NULL' : $pdo->quote((string) $v),
                    $dataRow
                ));
                $lines[] = "INSERT INTO `{$table}` ({$cols}) VALUES ({$vals});";
            }
            $lines[] = '';
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;';

        if (file_put_contents($outputFile, implode("\n", $lines) . "\n") === false) {
            throw new \RuntimeException('Could not write database backup to: ' . $outputFile);
        }
    }
}
