<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Setting;
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

    // ── Password reset (public) ────────────────────────────────────────────

    /**
     * POST /api/v1/auth/forgot-password
     * Body: {email}
     * Always returns 200 to avoid email enumeration.
     */
    public function forgotPassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        // Rate limit: 3 requests / 15 min per session
        if (!$this->checkResetRateLimit()) {
            return $this->error($response, 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.', 429);
        }

        $body  = (array) ($request->getParsedBody() ?? []);
        $email = trim((string) ($body['email'] ?? ''));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Return 200 anyway — don't reveal input errors that help enumeration
            return $this->json($response, ['message' => 'Si ese correo existe, recibirás un enlace en breve.']);
        }

        $user = User::where('email', $email)->first();

        if ($user !== null) {
            $token     = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);
            $expires   = date('Y-m-d H:i:s', time() + 10 * 60); // 10 minutes

            $user->reset_token_hash    = $tokenHash;
            $user->reset_token_expires = $expires;
            $user->save();

            $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $link   = "{$scheme}://{$host}/cx-admin/reset-password?token={$token}";

            $blogName = \Corexpress\Models\Setting::where('key', 'blog_name')->value('value') ?? 'Corexpress';
            $subject  = "Recupera tu acceso a {$blogName}";
            $body     = "<!DOCTYPE html><html><body style='font-family:sans-serif;'>" .
                "<p>Alguien solicitó restablecer la contraseña de tu cuenta en <strong>{$host}</strong>.</p>" .
                "<p><a href='{$link}' style='background:#1e293b;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;'>Restablecer contraseña</a></p>" .
                "<p style='color:#6b7280;font-size:13px;'>El enlace es válido por 10 minutos. Si no fuiste tú, ignora este correo.</p>" .
                "<p style='color:#6b7280;font-size:12px;'>O copia este enlace: {$link}</p>" .
                "</body></html>";

            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: noreply@{$host}\r\n";

            $mailSent = @mail($email, $subject, $body, $headers);

            if (!$mailSent) {
                $this->incrementResetAttempts();
                return $this->json($response, [
                    'message'    => 'Si ese correo existe, recibirás un enlace en breve.',
                    'email_sent' => false,
                ]);
            }
        }

        $this->incrementResetAttempts();

        return $this->json($response, [
            'message'    => 'Si ese correo existe, recibirás un enlace en breve.',
            'email_sent' => true,
        ]);
    }

    /**
     * POST /api/v1/auth/reset-password   [CSRF required]
     * Body: {token, password, password_confirm}
     */
    public function resetPassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body            = (array) ($request->getParsedBody() ?? []);
        $token           = trim((string) ($body['token']            ?? ''));
        $password        = (string) ($body['password']        ?? '');
        $passwordConfirm = (string) ($body['password_confirm'] ?? '');

        if ($token === '') {
            return $this->error($response, 'Token requerido.', 400);
        }
        if (strlen($password) < 8) {
            return $this->error($response, 'La contraseña debe tener al menos 8 caracteres.', 422);
        }
        if ($password !== $passwordConfirm) {
            return $this->error($response, 'Las contraseñas no coinciden.', 422);
        }

        $tokenHash = hash('sha256', $token);
        $user      = User::where('reset_token_hash', $tokenHash)
            ->where('reset_token_expires', '>', date('Y-m-d H:i:s'))
            ->first();

        if ($user === null) {
            return $this->error($response, 'Enlace inválido o expirado.', 400);
        }

        $user->password_hash      = password_hash($password, PASSWORD_ARGON2ID);
        $user->reset_token_hash   = null;
        $user->reset_token_expires = null;
        $user->save();

        return $this->json($response, ['message' => 'Contraseña restablecida correctamente.']);
    }

    // ── Authenticated endpoints ────────────────────────────────────────────

    /**
     * POST /api/v1/auth/change-password   [Auth + CSRF required]
     * Body: {current_password, new_password, new_password_confirm}
     */
    public function changePassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = (int) $request->getAttribute('user_id');
        $user   = User::find($userId);

        if ($user === null) {
            return $this->error($response, 'User not found.', 404);
        }

        $body               = (array) ($request->getParsedBody() ?? []);
        $currentPassword    = (string) ($body['current_password']    ?? '');
        $newPassword        = (string) ($body['new_password']        ?? '');
        $newPasswordConfirm = (string) ($body['new_password_confirm'] ?? '');

        if (!password_verify($currentPassword, (string) $user->password_hash)) {
            return $this->error($response, 'Contraseña actual incorrecta.', 400);
        }
        if (strlen($newPassword) < 8) {
            return $this->error($response, 'La nueva contraseña debe tener al menos 8 caracteres.', 422);
        }
        if ($newPassword !== $newPasswordConfirm) {
            return $this->error($response, 'Las contraseñas nuevas no coinciden.', 422);
        }

        $user->password_hash = password_hash($newPassword, PASSWORD_ARGON2ID);
        $user->save();

        return $this->json($response, ['message' => 'Contraseña actualizada correctamente.']);
    }

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

    private function checkResetRateLimit(): bool
    {
        $now = time();

        if (!isset($_SESSION['reset_attempts'])) {
            $_SESSION['reset_attempts']      = 0;
            $_SESSION['reset_window_start']  = $now;
        }

        if ($now - (int) $_SESSION['reset_window_start'] > self::WINDOW_SECONDS) {
            $_SESSION['reset_attempts']     = 0;
            $_SESSION['reset_window_start'] = $now;
        }

        return (int) $_SESSION['reset_attempts'] < 3;
    }

    private function incrementResetAttempts(): void
    {
        $_SESSION['reset_attempts'] = ((int) ($_SESSION['reset_attempts'] ?? 0)) + 1;
    }
}
