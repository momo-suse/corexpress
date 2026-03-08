<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Image;
use Corexpress\Models\Setting;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class SettingController extends Controller
{
    /**
     * GET /api/v1/settings   [Auth required]
     * Returns all key-value settings as a flat object.
     * Resolves hero_image_url and profile_image_url from their stored image IDs.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        // Resolve hero image URL
        if (!empty($settings['hero_image_id']) && is_numeric($settings['hero_image_id'])) {
            $img = Image::find((int)$settings['hero_image_id']);
            $settings['hero_image_url'] = $img !== null ? '/img/' . $img->filename : '';
        }
        else {
            $settings['hero_image_url'] = '';
        }

        // Resolve profile image URL
        if (!empty($settings['profile_image_id']) && is_numeric($settings['profile_image_id'])) {
            $img = Image::find((int)$settings['profile_image_id']);
            $settings['profile_image_url'] = $img !== null ? '/img/' . $img->filename : '';
        }
        else {
            $settings['profile_image_url'] = '';
        }

        // Resolve blog logo URL
        if (!empty($settings['blog_logo_id']) && is_numeric($settings['blog_logo_id'])) {
            $img = Image::find((int)$settings['blog_logo_id']);
            $settings['blog_logo_url'] = $img !== null ? '/img/' . $img->filename : '';
        }
        else {
            $settings['blog_logo_url'] = '';
        }

        // Resolve profile cover URL
        if (!empty($settings['profile_cover_id']) && is_numeric($settings['profile_cover_id'])) {
            $img = Image::find((int)$settings['profile_cover_id']);
            $settings['profile_cover_url'] = $img !== null ? '/img/' . $img->filename : '';
        }
        else {
            $settings['profile_cover_url'] = $settings['profile_cover_url'] ?? '';
        }

        return $this->json($response, ['data' => $settings]);
    }

    /**
     * PUT /api/v1/settings   [Auth + CSRF required]
     * Bulk-upserts settings. Body is a flat JSON object: {"key": "value", ...}.
     * Keys and values must both be strings.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array)($request->getParsedBody() ?? []);

        if ($body === []) {
            return $this->json($response, ['error' => 'Validation failed', 'fields' => ['body' => 'Request body must not be empty.']], 422);
        }

        $updated = [];
        foreach ($body as $key => $value) {
            if (!is_string($key) || $key === '' || mb_strlen($key) > 100) {
                continue;
            }
            if (!is_string($value)) {
                continue;
            }

            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
            $updated[$key] = $value;
        }

        if ($updated === []) {
            return $this->json($response, ['error' => 'No valid key-value pairs provided.'], 422);
        }

        return $this->json($response, ['data' => $updated]);
    }
}