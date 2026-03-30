<?php

declare(strict_types=1);

namespace Corexpress\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class SecurityHeadersMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);

        return $response
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('X-Frame-Options', 'DENY')
            ->withHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->withHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
            ->withHeader(
                'Content-Security-Policy',
                "default-src 'self'; "
                . "script-src 'self' https://www.google.com https://www.gstatic.com; "
                . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                . "img-src 'self' data: https:; "
                . "font-src 'self' https://fonts.gstatic.com; "
                . "frame-src https://www.google.com https://*.openstreetmap.org; "
                . "connect-src 'self' https://www.google.com https://accounts.google.com https://www.googleapis.com;"
            );
    }
}
