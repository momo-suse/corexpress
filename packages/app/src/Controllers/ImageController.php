<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Image;
use Corexpress\Services\ImageUsageService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

class ImageController extends Controller
{
    private const DEFAULT_PER_PAGE = 18;
    private const MAX_PER_PAGE = 60;
    private const MAX_FILE_SIZE  = 10 * 1024 * 1024; // 10 MB
    private const MAX_DIMENSION  = 8192; // px
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/jpg', // alias on some systems
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
    ];
    private const MIME_EXTENSION = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'image/avif' => 'avif',
    ];

    /**
     * POST /api/v1/images   [Auth + CSRF required]
     * Receives a multipart upload with field name "image".
     */
    public function store(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $uploadedFiles = $request->getUploadedFiles();
        /** @var UploadedFileInterface|null $file */
        $file = $uploadedFiles['image'] ?? null;

        if (!$file instanceof UploadedFileInterface) {
            return $this->json($response, ['error' => 'No file was received.'], 422);
        }

        // Map PHP upload error codes to user-friendly messages
        $uploadError = $file->getError();
        if ($uploadError !== UPLOAD_ERR_OK) {
            $uploadErrorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File is too large. Maximum allowed size is 10 MB. Please compress or resize the image before uploading.',
                UPLOAD_ERR_FORM_SIZE => 'File is too large. Please compress or resize the image before uploading.',
                UPLOAD_ERR_PARTIAL => 'Upload was interrupted. Please try again.',
                UPLOAD_ERR_NO_FILE => 'No file was selected.',
                UPLOAD_ERR_NO_TMP_DIR => 'Server error: temporary folder unavailable.',
                UPLOAD_ERR_CANT_WRITE => 'Server error: could not write file to disk.',
            ];
            $message = $uploadErrorMessages[$uploadError] ?? 'Upload failed (error code: ' . $uploadError . ').';
            return $this->json($response, ['error' => $message], 422);
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            return $this->json($response, ['error' => 'File too large. Maximum size is 10 MB.'], 422);
        }

        $imgDir = $this->imgDir();

        // Move to a temp name first, then validate actual MIME type via magic bytes
        $tempName = $imgDir . '/tmp_' . bin2hex(random_bytes(8));
        $file->moveTo($tempName);

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($tempName);

        if (!in_array($mimeType, self::ALLOWED_MIMES, true)) {
            unlink($tempName);
            return $this->json($response, ['error' => 'Unsupported format. Use JPEG, PNG, GIF, WebP or AVIF.'], 422);
        }

        $dimensions = @getimagesize($tempName);
        if ($dimensions !== false) {
            [$width, $height] = $dimensions;
            if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
                unlink($tempName);
                return $this->json($response, [
                    'error' => sprintf('Image too large. Maximum dimensions are %dx%d pixels.', self::MAX_DIMENSION, self::MAX_DIMENSION),
                ], 422);
            }
        }

        $ext = self::MIME_EXTENSION[$mimeType];
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $finalPath = $imgDir . '/' . $filename;
        rename($tempName, $finalPath);

        $this->stripMetadata($finalPath, $mimeType);

        // Optional post_id from form body
        $body = (array)($request->getParsedBody() ?? []);
        $postId = isset($body['post_id']) && is_numeric($body['post_id'])
            ? (int)$body['post_id']
            : null;

        $image = Image::create([
            'post_id' => $postId,
            'filename' => $filename,
            'original_name' => $file->getClientFilename() ?? 'image',
            'mime_type' => $mimeType,
            'file_size' => $file->getSize(),
        ]);

        return $this->json($response, [
            'data' => $this->format($image),
        ], 201);
    }

    /**
     * GET /api/v1/images   [Auth required]
     * Lists uploaded images with usage metadata, newest first.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params = $request->getQueryParams();
        $page = max(1, (int)($params['page'] ?? 1));
        $perPage = min(self::MAX_PER_PAGE, max(1, (int)($params['per_page'] ?? self::DEFAULT_PER_PAGE)));
        $search = trim((string)($params['search'] ?? ''));
        $usageService = new ImageUsageService();
        $query = Image::orderBy('created_at', 'desc');

        if ($search !== '') {
            $matchedIds = $usageService->findImageIdsByPostSearch($search);
            if ($matchedIds === []) {
                return $this->json($response, [
                    'data' => [],
                    'meta' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total' => 0,
                        'last_page' => 1,
                        'resource_stats' => $usageService->summarizeImages(),
                    ],
                ]);
            }
            $query->whereIn('id', $matchedIds);
        }

        $total = (clone $query)->count();
        $images = $query
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();
        $usageMap = $usageService->buildUsageMap($images);

        return $this->json($response, [
            'data' => $images->map(fn(Image $img) => $this->format($img, $usageMap[$img->id] ?? null))->values()->toArray(),
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => max(1, (int)ceil($total / $perPage)),
                'resource_stats' => $usageService->summarizeImages(),
            ],
        ]);
    }

    /**
     * POST /api/v1/images/{id}/replace   [Auth + CSRF required]
     * Replaces an uploaded image while preserving its public filename.
     */
    public function replace(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $image = Image::find((int)$args['id']);

        if ($image === null) {
            return $this->error($response, 'Image not found.', 404);
        }

        $uploadedFiles = $request->getUploadedFiles();
        /** @var UploadedFileInterface|null $file */
        $file = $uploadedFiles['image'] ?? null;

        if (!$file instanceof UploadedFileInterface) {
            return $this->json($response, ['error' => 'No file was received.'], 422);
        }

        $uploadError = $file->getError();
        if ($uploadError !== UPLOAD_ERR_OK) {
            $uploadErrorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File is too large. Maximum allowed size is 10 MB. Please compress or resize the image before uploading.',
                UPLOAD_ERR_FORM_SIZE => 'File is too large. Please compress or resize the image before uploading.',
                UPLOAD_ERR_PARTIAL => 'Upload was interrupted. Please try again.',
                UPLOAD_ERR_NO_FILE => 'No file was selected.',
                UPLOAD_ERR_NO_TMP_DIR => 'Server error: temporary folder unavailable.',
                UPLOAD_ERR_CANT_WRITE => 'Server error: could not write file to disk.',
            ];
            $message = $uploadErrorMessages[$uploadError] ?? 'Upload failed (error code: ' . $uploadError . ').';
            return $this->json($response, ['error' => $message], 422);
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            return $this->json($response, ['error' => 'File too large. Maximum size is 10 MB.'], 422);
        }

        $imgDir = $this->imgDir();
        $tempName = $imgDir . '/tmp_' . bin2hex(random_bytes(8));
        $file->moveTo($tempName);

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($tempName);

        if (!in_array($mimeType, self::ALLOWED_MIMES, true)) {
            unlink($tempName);
            return $this->json($response, ['error' => 'Unsupported format. Use JPEG, PNG, GIF, WebP or AVIF.'], 422);
        }

        $dimensions = @getimagesize($tempName);
        if ($dimensions !== false) {
            [$width, $height] = $dimensions;
            if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
                unlink($tempName);
                return $this->json($response, [
                    'error' => sprintf('Image too large. Maximum dimensions are %dx%d pixels.', self::MAX_DIMENSION, self::MAX_DIMENSION),
                ], 422);
            }
        }

        $ext = self::MIME_EXTENSION[$mimeType];
        $currentExt = strtolower((string)pathinfo($image->filename, PATHINFO_EXTENSION));
        if ($currentExt !== $ext) {
            unlink($tempName);
            return $this->json($response, [
                'error' => sprintf('Replacement image must keep the same format as the existing file (.%s).', $currentExt),
            ], 422);
        }

        $finalPath = $imgDir . '/' . $image->filename;
        if (!rename($tempName, $finalPath)) {
            unlink($tempName);
            return $this->json($response, ['error' => 'Server error: could not replace the existing file.'], 500);
        }

        $this->stripMetadata($finalPath, $mimeType);

        $image->original_name = $file->getClientFilename() ?? $image->original_name;
        $image->mime_type = $mimeType;
        $image->file_size = filesize($finalPath) ?: $file->getSize();
        $image->save();

        return $this->json($response, [
            'data' => $this->format($image->fresh()),
        ]);
    }

    /**
     * DELETE /api/v1/images/{id}   [Auth + CSRF required]
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $image = Image::find((int)$args['id']);

        if ($image === null) {
            return $this->error($response, 'Image not found.', 404);
        }

        $filePath = $this->imgDir() . '/' . $image->filename;
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $image->delete();

        return $response->withStatus(204);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private function imgDir(): string
    {
        $dir = dirname(__DIR__, 2) . '/public/img';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        elseif (!is_writable($dir)) {
            chmod($dir, 0755);
        }
        return $dir;
    }

    /**
     * @return array<string, mixed>
     */
    private function format(Image $image, ?array $usage = null): array
    {
        $usage ??= [
            'usage_count' => 0,
            'usage_titles' => [],
            'usage_records' => [],
        ];

        return [
            'id' => $image->id,
            'post_id' => $image->post_id,
            'filename' => $image->filename,
            'original_name' => $image->original_name,
            'mime_type' => $image->mime_type,
            'file_size' => $image->file_size,
            'url' => '/img/' . $image->filename,
            'created_at' => $image->created_at,
            'usage_count' => $usage['usage_count'],
            'usage_titles' => $usage['usage_titles'],
            'usage_records' => $usage['usage_records'],
        ];
    }

    private function stripMetadata(string $path, string $mime): void
    {
        if (!extension_loaded('gd')) {
            return;
        }

        $image = match ($mime) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/gif' => @imagecreatefromgif($path),
            'image/webp' => @imagecreatefromwebp($path),
            'image/avif' => function_exists('imagecreatefromavif') ? @imagecreatefromavif($path) : null,
            default => null,
        };

        if ($image === null || $image === false) {
            return;
        }

        match ($mime) {
            'image/jpeg', 'image/jpg' => imagejpeg($image, $path, 90),
            'image/png' => imagepng($image, $path, 6),
            'image/gif' => imagegif($image, $path),
            'image/webp' => imagewebp($image, $path, 85),
            'image/avif' => function_exists('imageavif') ? imageavif($image, $path, 60) : null,
            default => null,
        };

        imagedestroy($image);
    }
}