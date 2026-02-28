<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\User;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS     = 5;
    private const WINDOW_SECONDS   = 15 * 60; // 15 minutes

    // ── Public endpoints ───────────────────────────────────────────────────

    /**
     * GET /api/v1/auth/csrf
     * Returns a fresh CSRF token for the current session.
     */
    public function csrf(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, ['csrf_token' => $this->regenerateCsrfToken()]);
    }

    /**
     * POST /api/v1/auth/login
     * Body: {email, password}
     */
    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        if (!$this->checkRateLimit()) {
            return $this->error($response, sprintf(
                'Too many login attempts. Try again in %d minute(s).',
                $this->minutesUntilReset()
            ), 429);
        }

        $body     = (array) ($request->getParsedBody() ?? []);
        $email    = trim((string) ($body['email']    ?? ''));
        $password = (string) ($body['password'] ?? '');

        $errors = [];
        if ($email === '') {
            $errors['email'] = 'Email is required.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format.';
        }
        if ($password === '') {
            $errors['password'] = 'Password is required.';
        }

        if ($errors !== []) {
            return $this->json($response, ['error' => 'Validation failed', 'fields' => $errors], 422);
        }

        $user = User::where('email', $email)->first();

        if ($user === null || !password_verify($password, (string) $user->password_hash)) {
            $this->incrementLoginAttempts();
            return $this->error($response, 'Invalid credentials.', 401);
        }

        // Successful login — reset rate limit, regenerate session
        $_SESSION['login_attempts'] = 0;
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user->id;
        $csrfToken = $this->regenerateCsrfToken();

        return $this->json($response, [
            'data'       => ['id' => $user->id, 'email' => $user->email, 'created_at' => $user->created_at],
            'csrf_token' => $csrfToken,
        ]);
    }

    // ── Authenticated endpoints ────────────────────────────────────────────

    /**
     * GET /api/v1/auth/me   [Auth required]
     */
    public function me(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = (int) $request->getAttribute('user_id');
        $user   = User::find($userId);

        if ($user === null) {
            return $this->error($response, 'User not found.', 404);
        }

        return $this->json($response, [
            'data' => ['id' => $user->id, 'email' => $user->email, 'created_at' => $user->created_at],
        ]);
    }

    /**
     * POST /api/v1/auth/logout   [Auth + CSRF required]
     */
    public function logout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        return $response->withStatus(204);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private function regenerateCsrfToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        return $token;
    }

    private function checkRateLimit(): bool
    {
        $now = time();

        if (!isset($_SESSION['login_attempts'])) {
            $_SESSION['login_attempts']     = 0;
            $_SESSION['login_window_start'] = $now;
        }

        if ($now - (int) $_SESSION['login_window_start'] > self::WINDOW_SECONDS) {
            $_SESSION['login_attempts']     = 0;
            $_SESSION['login_window_start'] = $now;
        }

        return (int) $_SESSION['login_attempts'] < self::MAX_ATTEMPTS;
    }

    private function incrementLoginAttempts(): void
    {
        $_SESSION['login_attempts'] = ((int) ($_SESSION['login_attempts'] ?? 0)) + 1;
    }

    private function minutesUntilReset(): int
    {
        $elapsed   = time() - (int) ($_SESSION['login_window_start'] ?? time());
        $remaining = self::WINDOW_SECONDS - $elapsed;
        return (int) ceil(max(0, $remaining) / 60);
    }
}
