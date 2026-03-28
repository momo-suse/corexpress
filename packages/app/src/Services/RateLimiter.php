<?php

declare(strict_types=1);

namespace Corexpress\Services;

class RateLimiter
{
    private string $storageDir;

    public function __construct(?string $storageDir = null)
    {
        $this->storageDir = $storageDir ?? sys_get_temp_dir() . '/corexpress-ratelimit';
        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0700, true);
        }

        $this->maybeCleanup();
    }

    public function tooManyAttempts(string $key, int $maxAttempts, int $windowSeconds): bool
    {
        $file = $this->filePath($key);
        $fp   = @fopen($file, 'c+');
        if ($fp === false) {
            return false;
        }

        $result = false;

        if (flock($fp, LOCK_SH)) {
            $content = stream_get_contents($fp);
            flock($fp, LOCK_UN);

            $data = ($content !== false && $content !== '')
                ? json_decode($content, true)
                : null;

            if (is_array($data) && isset($data['attempts'], $data['start'])) {
                if ((time() - $data['start']) <= $windowSeconds) {
                    $result = $data['attempts'] >= $maxAttempts;
                }
            }
        }

        fclose($fp);
        return $result;
    }

    public function increment(string $key, int $windowSeconds): void
    {
        $file = $this->filePath($key);
        $fp   = @fopen($file, 'c+');
        if ($fp === false) {
            return;
        }

        if (flock($fp, LOCK_EX)) {
            $content = stream_get_contents($fp);
            $now     = time();

            $data = ($content !== false && $content !== '')
                ? json_decode($content, true)
                : null;

            if (!is_array($data) || !isset($data['attempts'], $data['start']) || ($now - $data['start']) > $windowSeconds) {
                $data = ['attempts' => 0, 'start' => $now];
            }

            $data['attempts']++;

            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($data));
            fflush($fp);
            flock($fp, LOCK_UN);
        }

        fclose($fp);
    }

    public function reset(string $key): void
    {
        $file = $this->filePath($key);
        if (file_exists($file)) {
            @unlink($file);
        }
    }

    private function filePath(string $key): string
    {
        return $this->storageDir . '/' . md5($key) . '.json';
    }

    private function maybeCleanup(): void
    {
        if (random_int(1, 100) > 1) {
            return;
        }

        $maxAge = 3600;
        $now    = time();
        $files  = @scandir($this->storageDir);

        if (!is_array($files)) {
            return;
        }

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $path  = $this->storageDir . '/' . $file;
            $mtime = @filemtime($path);

            if ($mtime !== false && ($now - $mtime) > $maxAge) {
                @unlink($path);
            }
        }
    }
}
