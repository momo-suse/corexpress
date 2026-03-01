<?php

declare(strict_types=1);

namespace Corexpress\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class SessionMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (session_status() === PHP_SESSION_NONE) {
            // Only mark session cookie as Secure when served over HTTPS.
            // This allows local HTTP dev to work while enforcing security in production.
            $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
                || ($_SERVER['SERVER_PORT'] ?? 80) == 443;

            ini_set('session.cookie_httponly', '1');
            ini_set('session.cookie_samesite', 'Strict');
            ini_set('session.cookie_secure', $isHttps ? '1' : '0');
            ini_set('session.use_only_cookies', '1'); // prevents session ID in URL (fixation)
            ini_set('session.use_strict_mode', '1'); // server rejects unrecognized session IDs
            // Keep sessions alive for 8 hours so CSRF tokens don't expire mid-use
            ini_set('session.gc_maxlifetime', '28800');
            ini_set('session.cookie_lifetime', '28800');
            session_name('corexpress_session');
            session_start();
        }

        return $handler->handle($request);
    }
}