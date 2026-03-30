<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Subscriber;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class SubscriberController extends Controller
{
    /**
     * GET /api/v1/subscribers   [Auth required]
     * Admin: lists all subscribers with basic info.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params  = $request->getQueryParams();
        $page    = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($params['per_page'] ?? 20)));

        $query = Subscriber::orderBy('created_at', 'desc');

        if (isset($params['subscribed'])) {
            $query->where('subscribed', $params['subscribed'] === '1' ? 1 : 0);
        }

        $total       = (clone $query)->count();
        $subscribers = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        return $this->json($response, [
            'data' => $subscribers->map(fn(Subscriber $s) => $this->format($s))->values()->toArray(),
            'meta' => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => max(1, (int) ceil($total / $perPage)),
                'active'       => Subscriber::where('subscribed', 1)->count(),
            ],
        ]);
    }

    /**
     * DELETE /api/v1/subscribers/{id}   [Auth + CSRF required]
     * Admin: removes a subscriber.
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $subscriber = Subscriber::find((int) $args['id']);

        if ($subscriber === null) {
            return $this->error($response, 'Subscriber not found.', 404);
        }

        $subscriber->delete();

        return $response->withStatus(204);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * @return array<string, mixed>
     */
    private function format(Subscriber $s): array
    {
        return [
            'id'         => $s->id,
            'name'       => $s->name,
            'email'      => $s->email,
            'avatar_url' => $s->avatar_url,
            'subscribed' => $s->subscribed,
            'created_at' => $s->created_at,
        ];
    }
}
