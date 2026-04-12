<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Services\BackupService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

final class BackupController extends Controller
{
    public function export(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $body = (array) ($request->getParsedBody() ?? []);
            $blocks = is_array($body['blocks'] ?? null) ? $body['blocks'] : [];
            $includeMediaFiles = filter_var($body['include_media_files'] ?? false, FILTER_VALIDATE_BOOL);

            $service = new BackupService();
            $archive = $service->exportArchive($blocks, $includeMediaFiles);

            register_shutdown_function(static function () use ($archive): void {
                @unlink($archive['path']);
            });

            $handle = fopen($archive['path'], 'rb');
            if ($handle === false) {
                return $this->error($response, 'Could not read the generated backup archive.', 500);
            }

            while (!feof($handle)) {
                $chunk = fread($handle, 8192);
                if ($chunk === false) {
                    fclose($handle);
                    return $this->error($response, 'Could not stream the backup archive.', 500);
                }
                $response->getBody()->write($chunk);
            }

            fclose($handle);

            return $response
                ->withHeader('Content-Type', 'application/zip')
                ->withHeader('Content-Disposition', 'attachment; filename="' . $archive['filename'] . '"')
                ->withHeader('Content-Length', (string) filesize($archive['path']));
        } catch (\JsonException) {
            return $this->error($response, 'The generated backup archive could not be encoded.', 500);
        } catch (\InvalidArgumentException $e) {
            return $this->error($response, $e->getMessage(), 422);
        } catch (\RuntimeException $e) {
            return $this->error($response, $e->getMessage(), 500);
        }
    }

    public function inspect(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $tempFile = null;

        try {
            $file = $this->uploadedArchive($request);
            $tempFile = $this->moveUploadedArchive($file);

            $service = new BackupService();
            return $this->json($response, $service->inspectArchive($tempFile));
        } catch (\JsonException) {
            return $this->error($response, 'The backup archive is corrupted.', 422);
        } catch (\InvalidArgumentException $e) {
            return $this->error($response, $e->getMessage(), 422);
        } catch (\RuntimeException $e) {
            return $this->error($response, $e->getMessage(), 500);
        } finally {
            if ($tempFile !== null) {
                @unlink($tempFile);
            }
        }
    }

    public function restore(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $tempFile = null;

        try {
            $file = $this->uploadedArchive($request);
            $tempFile = $this->moveUploadedArchive($file);

            $body = (array) ($request->getParsedBody() ?? []);
            $blocksJson = (string) ($body['blocks'] ?? '[]');
            $blocks = json_decode($blocksJson, true, 512, JSON_THROW_ON_ERROR);

            if (!is_array($blocks)) {
                return $this->error($response, 'Restore blocks must be a JSON array.', 422);
            }

            $service = new BackupService();
            $result = $service->restoreArchive($tempFile, $blocks, (int) ($_SESSION['user_id'] ?? 0));

            return $this->json($response, $result);
        } catch (\JsonException) {
            return $this->error($response, 'The backup archive or restore payload is invalid.', 422);
        } catch (\InvalidArgumentException $e) {
            return $this->error($response, $e->getMessage(), 422);
        } catch (\RuntimeException $e) {
            return $this->error($response, $e->getMessage(), 500);
        } finally {
            if ($tempFile !== null) {
                @unlink($tempFile);
            }
        }
    }

    private function uploadedArchive(ServerRequestInterface $request): UploadedFileInterface
    {
        $uploadedFiles = $request->getUploadedFiles();
        $file = $uploadedFiles['archive'] ?? null;

        if (!$file instanceof UploadedFileInterface) {
            throw new \InvalidArgumentException('No backup archive was received.');
        }

        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException('The backup archive upload failed.');
        }

        return $file;
    }

    private function moveUploadedArchive(UploadedFileInterface $file): string
    {
        $path = sys_get_temp_dir()
            . '/corexpress-backup-upload-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.zip';

        $file->moveTo($path);

        return $path;
    }
}
