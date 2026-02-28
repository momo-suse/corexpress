<?php

declare(strict_types=1);

namespace Corexpress\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ResponseFactory;

class AuthMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (empty($_SESSION['user_id'])) {
            $response = (new ResponseFactory())->createResponse(401);
            $response->getBody()->write(json_encode(['error' => 'Unauthenticated'], JSON_THROW_ON_ERROR));
            return $response->withHeader('Content-Type', 'application/json');
        }

        // Pass user_id as a request attribute so controllers can read it
        return $handler->handle(
            $request->withAttribute('user_id', (int) $_SESSION['user_id'])
        );
    }
}
