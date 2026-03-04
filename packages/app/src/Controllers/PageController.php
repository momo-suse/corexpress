<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\ComponentStyle;
use Corexpress\Models\Page;
use Corexpress\Models\PageComponent;
use Corexpress\Models\Setting;
use Corexpress\Models\StyleCollection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class PageController extends Controller
{
    /**
     * GET /api/v1/pages
     * Returns all pages with their component placement (public).
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $pages = Page::with([
            'pageComponents.componentDefinition',
        ])->orderBy('id')->get();

        return $this->json($response, ['data' => $pages->map(fn (Page $p) => $this->formatPage($p))]);
    }

    /**
     * GET /api/v1/pages/{slug}
     * Returns a page with its components and resolved styles from the active collection (public).
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $page = Page::where('slug', $args['slug'])
            ->with(['pageComponents.componentDefinition'])
            ->first();

        if ($page === null) {
            return $this->error($response, 'Page not found.', 404);
        }

        // Resolve the active style collection and default collection
        $activeName       = Setting::find('active_style_collection')?->value ?? 'default';
        $activeCollection = StyleCollection::with('componentStyles')->where('name', $activeName)->first();
        $defaultCollection = StyleCollection::with('componentStyles')->where('is_default', true)->first();

        // Build index maps: component_definition_id => styles_config (already decoded as array by Eloquent)
        $defaultStyles = $this->indexStyles($defaultCollection?->componentStyles ?? collect());
        $activeStyles  = $this->indexStyles($activeCollection?->componentStyles ?? collect());

        $components = $page->pageComponents->map(function (PageComponent $pc) use ($activeStyles, $defaultStyles): array {
            $defId  = $pc->component_definition_id;
            $def    = $pc->componentDefinition;
            $styles = $activeStyles[$defId] ?? $defaultStyles[$defId] ?? [];

            return [
                'id'                      => $pc->id,
                'component_definition_id' => $defId,
                'type'                    => $def?->type ?? 'component',
                'parent_id'               => $def?->parent_id,
                'has_own_page'            => (bool) ($def?->has_own_page ?? false),
                'name'                    => $def?->name,
                'label'                   => $def?->label,
                'is_visible'              => $pc->is_visible,
                'display_order'           => $pc->display_order,
                'styles'                  => $styles,
            ];
        });

        return $this->json($response, [
            'data' => [
                'id'         => $page->id,
                'slug'       => $page->slug,
                'title'      => $page->title,
                'components' => $components,
            ],
        ]);
    }

    /**
     * PUT /api/v1/pages/{slug}/components/{componentId}   [Auth + CSRF required]
     * Admin: toggle a component's visibility on a page.
     */
    public function updateComponent(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $pageComponent = PageComponent::find((int) $args['componentId']);

        if ($pageComponent === null) {
            return $this->error($response, 'Component not found.', 404);
        }

        $body = (array) ($request->getParsedBody() ?? []);

        if (array_key_exists('is_visible', $body)) {
            $pageComponent->is_visible = (bool) $body['is_visible'];
        }

        if (array_key_exists('display_order', $body) && is_numeric($body['display_order'])) {
            $pageComponent->display_order = max(0, (int) $body['display_order']);
        }

        $pageComponent->save();

        return $this->json($response, ['data' => $pageComponent->fresh()->load('componentDefinition')]);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * @param \Illuminate\Support\Collection<int, ComponentStyle> $styles
     * @return array<int, array<string, mixed>>
     */
    private function indexStyles(iterable $styles): array
    {
        $map = [];
        foreach ($styles as $cs) {
            $map[$cs->component_definition_id] = $cs->styles_config;
        }
        return $map;
    }

    private function formatPage(Page $page): array
    {
        return [
            'id'         => $page->id,
            'slug'       => $page->slug,
            'title'      => $page->title,
            'components' => $page->pageComponents->map(function (PageComponent $pc): array {
                $def = $pc->componentDefinition;
                return [
                    'id'                      => $pc->id,
                    'component_definition_id' => $pc->component_definition_id,
                    'type'                    => $def?->type ?? 'component',
                    'parent_id'               => $def?->parent_id,
                    'has_own_page'            => (bool) ($def?->has_own_page ?? false),
                    'name'                    => $def?->name,
                    'label'                   => $def?->label,
                    'is_visible'              => $pc->is_visible,
                    'display_order'           => $pc->display_order,
                ];
            }),
        ];
    }
}
