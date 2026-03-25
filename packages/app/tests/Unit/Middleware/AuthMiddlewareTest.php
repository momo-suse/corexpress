<?php

declare(strict_types=1);

namespace Corexpress\Tests\Unit\Middleware;

use Corexpress\Middleware\AuthMiddleware;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\RequestFactory;
use Slim\Psr7\Factory\ResponseFactory;

/**
 * Test double that passes the request through and lets assertions
 * inspect it directly via $handler->lastRequest.
 */
final class CapturingHandler implements RequestHandlerInterface
{
    public ?ServerRequestInterface $lastRequest = null;

    public function __construct(private readonly ResponseInterface $response) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $this->lastRequest = $request;
        return $this->response;
    }
}

class AuthMiddlewareTest extends TestCase
{
    private AuthMiddleware $middleware;

    protected function setUp(): void
    {
        $_SESSION = [];
        $this->middleware = new AuthMiddleware();
    }

    private function okHandler(): CapturingHandler
    {
        return new CapturingHandler((new ResponseFactory())->createResponse(200));
    }

    // ── No session → 401 ─────────────────────────────────────────────────────

    public function test_returns_401_when_no_session(): void
    {
        $request  = (new RequestFactory())->createRequest('GET', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->okHandler());

        $this->assertSame(401, $response->getStatusCode());
    }

    public function test_returns_401_when_user_id_is_empty_string(): void
    {
        $_SESSION['user_id'] = '';

        $request  = (new RequestFactory())->createRequest('GET', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->okHandler());

        $this->assertSame(401, $response->getStatusCode());
    }

    public function test_returns_401_when_user_id_is_zero(): void
    {
        $_SESSION['user_id'] = 0;

        $request  = (new RequestFactory())->createRequest('GET', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->okHandler());

        $this->assertSame(401, $response->getStatusCode());
    }

    // ── Valid session → passes through ───────────────────────────────────────

    public function test_passes_through_when_user_id_is_set(): void
    {
        $_SESSION['user_id'] = 42;

        $request  = (new RequestFactory())->createRequest('GET', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->okHandler());

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_passes_user_id_as_request_attribute(): void
    {
        $_SESSION['user_id'] = 7;

        $handler = $this->okHandler();
        $request = (new RequestFactory())->createRequest('GET', '/api/v1/me');
        $this->middleware->process($request, $handler);

        $this->assertNotNull($handler->lastRequest);
        $this->assertSame(7, $handler->lastRequest->getAttribute('user_id'));
    }

    // ── Error response format ─────────────────────────────────────────────────

    public function test_unauthenticated_response_is_json_with_error_key(): void
    {
        $request  = (new RequestFactory())->createRequest('GET', '/api/v1/posts');
        $response = $this->middleware->process($request, $this->okHandler());

        $body = (array) json_decode((string) $response->getBody(), true);
        $this->assertArrayHasKey('error', $body);
        $this->assertSame('application/json', $response->getHeaderLine('Content-Type'));
    }
}
