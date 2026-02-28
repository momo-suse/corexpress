<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Image;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

class ImageController extends Controller
{
    private const MAX_FILE_SIZE  = 10 * 1024 * 1024; // 10 MB
    private const ALLOWED_MIMES  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private const MIME_EXTENSION = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
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

        if (!$file instanceof UploadedFileInterface || $file->getError() !== UPLOAD_ERR_OK) {
            return $this->json($response, ['error' => 'No valid file uploaded.'], 422);
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            return $this->json($response, ['error' => 'File too large. Maximum size is 10 MB.'], 422);
        }

        $imgDir = $this->imgDir();

        // Move to a temp name first, then validate actual MIME type via magic bytes
        $tempName = $imgDir . '/tmp_' . bin2hex(random_bytes(8));
        $file->moveTo($tempName);

        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($tempName);

        if (!in_array($mimeType, self::ALLOWED_MIMES, true)) {
            unlink($tempName);
            return $this->json($response, ['error' => 'Only JPEG, PNG, GIF, and WebP images are allowed.'], 422);
        }

        $ext      = self::MIME_EXTENSION[$mimeType];
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        rename($tempName, $imgDir . '/' . $filename);

        // Optional post_id from form body
        $body   = (array) ($request->getParsedBody() ?? []);
        $postId = isset($body['post_id']) && is_numeric($body['post_id'])
            ? (int) $body['post_id']
            : null;

        $image = Image::create([
            'post_id'       => $postId,
            'filename'      => $filename,
            'original_name' => $file->getClientFilename() ?? 'image',
            'mime_type'     => $mimeType,
            'file_size'     => $file->getSize(),
        ]);

        return $this->json($response, [
            'data' => $this->format($image),
        ], 201);
    }

    /**
     * GET /api/v1/images   [Auth required]
     * Lists all uploaded images, newest first.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $images = Image::orderBy('created_at', 'desc')->get();

        return $this->json($response, [
            'data' => $images->map(fn (Image $img) => $this->format($img))->values()->toArray(),
        ]);
    }

    /**
     * DELETE /api/v1/images/{id}   [Auth + CSRF required]
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $image = Image::find((int) $args['id']);

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
            mkdir($dir, 0777, true);
        } elseif (!is_writable($dir)) {
            chmod($dir, 0777);
        }
        return $dir;
    }

    /**
     * @return array<string, mixed>
     */
    private function format(Image $image): array
    {
        return [
            'id'            => $image->id,
            'post_id'       => $image->post_id,
            'filename'      => $image->filename,
            'original_name' => $image->original_name,
            'mime_type'     => $image->mime_type,
            'file_size'     => $image->file_size,
            'url'           => '/img/' . $image->filename,
            'created_at'    => $image->created_at,
        ];
    }
}
