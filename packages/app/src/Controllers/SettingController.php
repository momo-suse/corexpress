<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Image;
use Corexpress\Models\PageComponent;
use Corexpress\Models\Setting;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class SettingController extends Controller
{
    /**
     * GET /api/v1/settings   [Public — filtered for unauthenticated requests]
     * Returns key-value settings as a flat object.
     * Unauthenticated: only always-public keys + component-linked keys for visible components.
     * Authenticated admin: full settings (except recaptcha_secret_key).
     * Resolves image IDs to public URLs before filtering.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        // Resolve image IDs to public URLs. Collect every referenced image id and
        // fetch their filenames in a single query instead of one Image::find() per
        // setting — this endpoint runs on every page load.
        $imageKeys = [
            'hero_image_id'    => 'hero_image_url',
            'profile_image_id' => 'profile_image_url',
            'blog_logo_id'     => 'blog_logo_url',
            'profile_cover_id' => 'profile_cover_url',
        ];

        $ids = [];
        foreach (array_keys($imageKeys) as $idKey) {
            if (!empty($settings[$idKey]) && is_numeric($settings[$idKey])) {
                $ids[] = (int) $settings[$idKey];
            }
        }

        $filenames = $ids !== []
            ? Image::whereIn('id', $ids)->pluck('filename', 'id')
            : collect();

        foreach ($imageKeys as $idKey => $urlKey) {
            if (!empty($settings[$idKey]) && is_numeric($settings[$idKey]) && isset($filenames[(int) $settings[$idKey]])) {
                $settings[$urlKey] = '/img/' . $filenames[(int) $settings[$idKey]];
            }
            else {
                $settings[$urlKey] = $settings[$urlKey] ?? '';
            }
        }

        unset($settings['recaptcha_secret_key'], $settings['google_client_secret']);

        if (!$this->isAdmin()) {
            $settings = $this->filterPublicSettings($settings);
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

    /**
     * DELETE /api/v1/settings/credentials/{type}   [Auth + CSRF required]
     * Clears a saved credential group. Accepted types: google, recaptcha.
     */
    public function deleteCredentials(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $type = $args['type'] ?? '';

        $keysMap = [
            'google'    => ['google_client_id', 'google_client_secret', 'subscribers_enabled'],
            'recaptcha' => ['recaptcha_site_key', 'recaptcha_secret_key', 'recaptcha_enabled'],
        ];

        if (!array_key_exists($type, $keysMap)) {
            return $response->withStatus(400);
        }

        Setting::whereIn('key', $keysMap[$type])->update(['value' => '']);

        return $response->withStatus(204);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * For unauthenticated requests: return only settings that are safe to expose publicly.
     * Global config keys are always included. Component-specific keys (profile data, hero,
     * social links) are only included if the respective component is visible on any page.
     *
     * @param array<string, string> $settings
     * @return array<string, string>
     */
    private function filterPublicSettings(array $settings): array
    {
        $alwaysPublic = [
            'blog_name', 'blog_description', 'blog_theme', 'active_style_collection',
            'app_locale', 'comments_enabled', 'tags_max_count', 'recaptcha_site_key',
            'app_version', 'blog_logo_id', 'blog_logo_url', 'setup_complete',
            'google_client_id', 'subscribers_enabled', 'recaptcha_enabled', 'likes_enabled',
        ];

        $componentSettings = [
            'hero'              => ['hero_text', 'hero_image_id', 'hero_image_url'],
            'profile'           => [
                'profile_name', 'profile_summary', 'profile_description',
                'profile_image_id', 'profile_image_url', 'profile_cover_id',
                'profile_cover_url', 'profile_title',
            ],
            'about-gallery'     => ['profile_gallery'],
            'about-experience'  => ['profile_experience'],
            'about-skills'      => ['profile_skills'],
            'about-education'   => ['profile_education', 'profile_certifications'],
            'about-testimonials'=> ['profile_testimonials'],
            'social-links'      => ['social_linkedin', 'social_instagram', 'social_youtube', 'social_facebook'],
        ];

        $visibleNames = PageComponent::where('is_visible', true)
            ->with('componentDefinition')
            ->get()
            ->map(fn(PageComponent $pc) => $pc->componentDefinition?->name)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $allowed = $alwaysPublic;
        foreach ($componentSettings as $componentName => $keys) {
            if (in_array($componentName, $visibleNames, true)) {
                array_push($allowed, ...$keys);
            }
        }

        return array_filter(
            $settings,
            static fn(string $key) => in_array($key, $allowed, true),
            ARRAY_FILTER_USE_KEY
        );
    }
}