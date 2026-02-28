<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\ComponentStyle;
use Corexpress\Models\StyleCollection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class StyleCollectionController extends Controller
{
    /**
     * GET /api/v1/style-collections   [Public]
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $collections = StyleCollection::with('componentStyles.componentDefinition')->orderBy('id')->get();

        return $this->json($response, ['data' => $collections]);
    }

    /**
     * GET /api/v1/style-collections/{id}   [Public]
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $collection = StyleCollection::with('componentStyles.componentDefinition')->find((int) $args['id']);

        if ($collection === null) {
            return $this->error($response, 'Style collection not found.', 404);
        }

        return $this->json($response, ['data' => $collection]);
    }

    /**
     * POST /api/v1/style-collections   [Auth + CSRF required]
     */
    public function store(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body   = (array) ($request->getParsedBody() ?? []);
        $errors = $this->validateCollectionBody($body);

        if ($errors !== []) {
            return $this->json($response, ['error' => 'Validation failed', 'fields' => $errors], 422);
        }

        $name = trim((string) $body['name']);

        if (StyleCollection::where('name', $name)->exists()) {
            return $this->json($response, [
                'error'  => 'Validation failed',
                'fields' => ['name' => 'A collection with this name already exists.'],
            ], 422);
        }

        $collection = StyleCollection::create([
            'name'       => $name,
            'label'      => trim((string) $body['label']),
            'is_default' => false,
        ]);

        return $this->json($response, ['data' => $collection], 201);
    }

    /**
     * PUT /api/v1/style-collections/{id}   [Auth + CSRF required]
     *
     * Body can include:
     *   label: string (optional)
     *   styles: array of {component_definition_id: int, styles_config: object} (optional)
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $collection = StyleCollection::find((int) $args['id']);

        if ($collection === null) {
            return $this->error($response, 'Style collection not found.', 404);
        }

        $body = (array) ($request->getParsedBody() ?? []);

        if (isset($body['label'])) {
            $label = trim((string) $body['label']);
            if ($label === '') {
                return $this->json($response, ['error' => 'Validation failed', 'fields' => ['label' => 'Label cannot be empty.']], 422);
            }
            $collection->label = $label;
            $collection->save();
        }

        // Upsert component styles if provided
        if (isset($body['styles']) && is_array($body['styles'])) {
            foreach ($body['styles'] as $styleEntry) {
                if (!is_array($styleEntry)) {
                    continue;
                }

                $componentDefinitionId = (int) ($styleEntry['component_definition_id'] ?? 0);
                $stylesConfig          = $styleEntry['styles_config'] ?? null;

                if ($componentDefinitionId <= 0 || !is_array($stylesConfig)) {
                    continue;
                }

                ComponentStyle::updateOrCreate(
                    [
                        'collection_id'           => $collection->id,
                        'component_definition_id' => $componentDefinitionId,
                    ],
                    ['styles_config' => $stylesConfig]
                );
            }
        }

        return $this->json($response, [
            'data' => $collection->fresh()->load('componentStyles.componentDefinition'),
        ]);
    }

    /**
     * DELETE /api/v1/style-collections/{id}   [Auth + CSRF required]
     * Cannot delete the default collection.
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $collection = StyleCollection::find((int) $args['id']);

        if ($collection === null) {
            return $this->error($response, 'Style collection not found.', 404);
        }

        if ($collection->is_default) {
            return $this->error($response, 'The default style collection cannot be deleted.', 422);
        }

        $collection->delete();

        return $response->withStatus(204);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed> $body
     * @return array<string, string>
     */
    private function validateCollectionBody(array $body): array
    {
        $errors = [];

        $name  = trim((string) ($body['name']  ?? ''));
        $label = trim((string) ($body['label'] ?? ''));

        if ($name === '') {
            $errors['name'] = 'Name is required.';
        } elseif (!preg_match('/^[a-z0-9_-]+$/', $name)) {
            $errors['name'] = 'Name may only contain lowercase letters, numbers, hyphens, and underscores.';
        } elseif (mb_strlen($name) > 100) {
            $errors['name'] = 'Name must be 100 characters or fewer.';
        }

        if ($label === '') {
            $errors['label'] = 'Label is required.';
        } elseif (mb_strlen($label) > 255) {
            $errors['label'] = 'Label must be 255 characters or fewer.';
        }

        return $errors;
    }
}
