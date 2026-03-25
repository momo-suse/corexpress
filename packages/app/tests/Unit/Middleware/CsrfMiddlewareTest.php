<?php

declare(strict_types=1);

namespace Corexpress\Tests\Unit\Middleware;

use Corexpress\Middleware\CsrfMiddleware;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\RequestFactory;
use Slim\Psr7\Factory\ResponseFactory;

class CsrfMiddlewareTest extends TestCase
{
    private CsrfMiddleware $middleware;
    private RequestHandlerInterface $handler;

    protected function setUp(): void
    {
        $_SESSION = [];
        $this->middleware = new CsrfMiddleware();

        // A handler that simply returns 200 — verifies the middleware passed the request through
        $ok = (new ResponseFactory())->createResponse(200);
        $this->handler = new class ($ok) implements RequestHandlerInterface {
            public function __construct(private readonly ResponseInterface $response) {}

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return $this->response;
            }
        };
    }

    // ── Safe methods pass through without a token ─────────────────────────────

    public function test_get_request_passes_without_csrf_token(): void
    {
        $request  = (new RequestFactory())->createRequest('GET', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_head_request_passes_without_csrf_token(): void
    {
        $request  = (new RequestFactory())->createRequest('HEAD', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_options_request_passes_without_csrf_token(): void
    {
        $request  = (new RequestFactory())->createRequest('OPTIONS', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(200, $response->getStatusCode());
    }

    // ── POST without session token is blocked ─────────────────────────────────

    public function test_post_request_blocked_when_no_session_token(): void
    {
        $request  = (new RequestFactory())->createRequest('POST', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(403, $response->getStatusCode());
    }

    // ── POST with wrong token is blocked ─────────────────────────────────────

    public function test_post_request_blocked_when_token_mismatch(): void
    {
        $_SESSION['csrf_token'] = 'correct_token';

        $request = (new RequestFactory())
            ->createRequest('POST', '/api/v1/posts')
            ->withHeader('X-CSRF-Token', 'wrong_token');

        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(403, $response->getStatusCode());
    }

    // ── POST with empty header is blocked ────────────────────────────────────

    public function test_post_request_blocked_when_header_is_empty(): void
    {
        $_SESSION['csrf_token'] = 'some_token';

        $request  = (new RequestFactory())->createRequest('POST', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(403, $response->getStatusCode());
    }

    // ── POST with valid token passes ──────────────────────────────────────────

    public function test_post_request_passes_with_valid_csrf_token(): void
    {
        $_SESSION['csrf_token'] = 'valid_token_xyz';

        $request = (new RequestFactory())
            ->createRequest('POST', '/api/v1/posts')
            ->withHeader('X-CSRF-Token', 'valid_token_xyz');

        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_put_request_passes_with_valid_csrf_token(): void
    {
        $_SESSION['csrf_token'] = 'put_token';

        $request = (new RequestFactory())
            ->createRequest('PUT', '/api/v1/posts/1')
            ->withHeader('X-CSRF-Token', 'put_token');

        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_delete_request_passes_with_valid_csrf_token(): void
    {
        $_SESSION['csrf_token'] = 'delete_token';

        $request = (new RequestFactory())
            ->createRequest('DELETE', '/api/v1/posts/1')
            ->withHeader('X-CSRF-Token', 'delete_token');

        $response = $this->middleware->process($request, $this->handler);

        $this->assertSame(200, $response->getStatusCode());
    }

    // ── Error response format ─────────────────────────────────────────────────

    public function test_blocked_response_is_json_with_error_key(): void
    {
        $request  = (new RequestFactory())->createRequest('POST', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->handler);

        $body = (array) json_decode((string) $response->getBody(), true);
        $this->assertArrayHasKey('error', $body);
        $this->assertSame('application/json', $response->getHeaderLine('Content-Type'));
    }
}
