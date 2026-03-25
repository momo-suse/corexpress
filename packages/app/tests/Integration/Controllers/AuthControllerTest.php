<?php

declare(strict_types=1);

namespace Corexpress\Tests\Integration\Controllers;

use Corexpress\Controllers\AuthController;
use Corexpress\Models\User;
use Corexpress\Tests\TestCase;

class AuthControllerTest extends TestCase
{
    private AuthController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new AuthController();

        User::create([
            'email'         => 'admin@test.com',
            'password_hash' => password_hash('secret123', PASSWORD_ARGON2ID),
        ]);
    }

    // ── csrf ──────────────────────────────────────────────────────────────────

    public function test_csrf_returns_token(): void
    {
        $response = $this->controller->csrf(
            $this->makeRequest('GET', '/api/v1/auth/csrf'),
            $this->makeResponse(),
        );

        $this->assertSame(200, $response->getStatusCode());
        $body = $this->decodeJson($response);
        $this->assertArrayHasKey('csrf_token', $body);
        $this->assertNotEmpty($body['csrf_token']);
    }

    public function test_csrf_stores_token_in_session(): void
    {
        $this->controller->csrf(
            $this->makeRequest('GET', '/api/v1/auth/csrf'),
            $this->makeResponse(),
        );

        $this->assertNotEmpty($_SESSION['csrf_token']);
    }

    // ── login — validación ────────────────────────────────────────────────────

    public function test_login_returns_422_when_email_is_missing(): void
    {
        $response = $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', ['password' => 'secret123']),
            $this->makeResponse(),
        );

        $this->assertSame(422, $response->getStatusCode());
        $body = $this->decodeJson($response);
        $this->assertArrayHasKey('email', $body['fields']);
    }

    public function test_login_returns_422_when_email_format_is_invalid(): void
    {
        $response = $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', [
                'email'    => 'not-an-email',
                'password' => 'secret123',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(422, $response->getStatusCode());
        $body = $this->decodeJson($response);
        $this->assertArrayHasKey('email', $body['fields']);
    }

    public function test_login_returns_422_when_password_is_missing(): void
    {
        $response = $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', ['email' => 'admin@test.com']),
            $this->makeResponse(),
        );

        $this->assertSame(422, $response->getStatusCode());
        $body = $this->decodeJson($response);
        $this->assertArrayHasKey('password', $body['fields']);
    }

    // ── login — credenciales ──────────────────────────────────────────────────

    public function test_login_returns_401_for_wrong_password(): void
    {
        $response = $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', [
                'email'    => 'admin@test.com',
                'password' => 'wrong_password',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(401, $response->getStatusCode());
        $body = $this->decodeJson($response);
        $this->assertSame('Invalid credentials.', $body['error']);
    }

    public function test_login_returns_401_for_unknown_email(): void
    {
        $response = $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', [
                'email'    => 'nobody@test.com',
                'password' => 'secret123',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(401, $response->getStatusCode());
    }

    public function test_login_succeeds_and_returns_user_data(): void
    {
        $response = $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', [
                'email'    => 'admin@test.com',
                'password' => 'secret123',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(200, $response->getStatusCode());
        $body = $this->decodeJson($response);
        $this->assertArrayHasKey('data', $body);
        $this->assertSame('admin@test.com', $body['data']['email']);
        $this->assertArrayHasKey('csrf_token', $body);
    }

    public function test_login_sets_user_id_in_session(): void
    {
        $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', [
                'email'    => 'admin@test.com',
                'password' => 'secret123',
            ]),
            $this->makeResponse(),
        );

        $this->assertNotEmpty($_SESSION['user_id']);
    }

    public function test_login_response_does_not_expose_password_hash(): void
    {
        $response = $this->controller->login(
            $this->makeRequest('POST', '/api/v1/auth/login', [
                'email'    => 'admin@test.com',
                'password' => 'secret123',
            ]),
            $this->makeResponse(),
        );

        $raw = (string) $response->getBody();
        $this->assertStringNotContainsString('password_hash', $raw);
        $this->assertStringNotContainsString('secret123', $raw);
    }

    // ── login — rate limit ────────────────────────────────────────────────────

    public function test_login_blocked_after_five_failed_attempts(): void
    {
        // Build the request first — ServerRequestFactory reads superglobals internally
        // and resets $_SESSION as a side-effect. Set session state AFTER.
        $request = $this->makeRequest('POST', '/api/v1/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'secret123', // correct — rate limit blocks regardless
        ]);

        $_SESSION['login_attempts']     = 5;
        $_SESSION['login_window_start'] = time();

        $response = $this->controller->login($request, $this->makeResponse());

        $this->assertSame(429, $response->getStatusCode());
    }

    public function test_rate_limit_resets_after_window_expires(): void
    {
        // Build the request first, then set session state (ServerRequestFactory side-effect)
        $request = $this->makeRequest('POST', '/api/v1/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'secret123',
        ]);

        // 5 attempts exhausted but the window started 16 minutes ago (> 15 min) → should reset
        $_SESSION['login_attempts']     = 5;
        $_SESSION['login_window_start'] = time() - (16 * 60);

        $response = $this->controller->login($request, $this->makeResponse());

        // Window expired → reset → login should succeed
        $this->assertSame(200, $response->getStatusCode());
    }

    // ── me ────────────────────────────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::where('email', 'admin@test.com')->first();

        $response = $this->controller->me(
            $this->makeRequest('GET', '/api/v1/auth/me')
                ->withAttribute('user_id', $user->id),
            $this->makeResponse(),
        );

        $this->assertSame(200, $response->getStatusCode());
        $body = $this->decodeJson($response);
        $this->assertSame('admin@test.com', $body['data']['email']);
        $this->assertArrayNotHasKey('password_hash', $body['data']);
    }

    public function test_me_returns_404_for_nonexistent_user_id(): void
    {
        $response = $this->controller->me(
            $this->makeRequest('GET', '/api/v1/auth/me')
                ->withAttribute('user_id', 9999),
            $this->makeResponse(),
        );

        $this->assertSame(404, $response->getStatusCode());
    }

    // ── logout ────────────────────────────────────────────────────────────────

    public function test_logout_returns_204_and_clears_session(): void
    {
        $_SESSION['user_id']    = 1;
        $_SESSION['csrf_token'] = 'abc';

        $response = $this->controller->logout(
            $this->makeRequest('POST', '/api/v1/auth/logout'),
            $this->makeResponse(),
        );

        $this->assertSame(204, $response->getStatusCode());
        $this->assertEmpty($_SESSION);
    }

    // ── changePassword ────────────────────────────────────────────────────────

    public function test_change_password_returns_400_for_wrong_current_password(): void
    {
        $user = User::where('email', 'admin@test.com')->first();

        $response = $this->controller->changePassword(
            $this->makeRequest('POST', '/api/v1/auth/change-password', [
                'current_password'    => 'wrong',
                'new_password'        => 'newpassword123',
                'new_password_confirm' => 'newpassword123',
            ])->withAttribute('user_id', $user->id),
            $this->makeResponse(),
        );

        $this->assertSame(400, $response->getStatusCode());
    }

    public function test_change_password_returns_422_for_short_new_password(): void
    {
        $user = User::where('email', 'admin@test.com')->first();

        $response = $this->controller->changePassword(
            $this->makeRequest('POST', '/api/v1/auth/change-password', [
                'current_password'    => 'secret123',
                'new_password'        => 'short',
                'new_password_confirm' => 'short',
            ])->withAttribute('user_id', $user->id),
            $this->makeResponse(),
        );

        $this->assertSame(422, $response->getStatusCode());
    }

    public function test_change_password_returns_422_when_confirmation_does_not_match(): void
    {
        $user = User::where('email', 'admin@test.com')->first();

        $response = $this->controller->changePassword(
            $this->makeRequest('POST', '/api/v1/auth/change-password', [
                'current_password'    => 'secret123',
                'new_password'        => 'newpassword123',
                'new_password_confirm' => 'different123',
            ])->withAttribute('user_id', $user->id),
            $this->makeResponse(),
        );

        $this->assertSame(422, $response->getStatusCode());
    }

    public function test_change_password_succeeds_and_updates_hash(): void
    {
        $user = User::where('email', 'admin@test.com')->first();

        $response = $this->controller->changePassword(
            $this->makeRequest('POST', '/api/v1/auth/change-password', [
                'current_password'    => 'secret123',
                'new_password'        => 'newpassword123',
                'new_password_confirm' => 'newpassword123',
            ])->withAttribute('user_id', $user->id),
            $this->makeResponse(),
        );

        $this->assertSame(200, $response->getStatusCode());

        // Verify the hash actually changed in the DB
        $updated = User::find($user->id);
        $this->assertTrue(password_verify('newpassword123', (string) $updated->password_hash));
        $this->assertFalse(password_verify('secret123', (string) $updated->password_hash));
    }

    // ── resetPassword ─────────────────────────────────────────────────────────

    public function test_reset_password_returns_400_when_token_is_missing(): void
    {
        $response = $this->controller->resetPassword(
            $this->makeRequest('POST', '/api/v1/auth/reset-password', [
                'password'         => 'newpassword123',
                'password_confirm' => 'newpassword123',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(400, $response->getStatusCode());
    }

    public function test_reset_password_returns_422_for_short_password(): void
    {
        $response = $this->controller->resetPassword(
            $this->makeRequest('POST', '/api/v1/auth/reset-password', [
                'token'            => 'sometoken',
                'password'         => 'short',
                'password_confirm' => 'short',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(422, $response->getStatusCode());
    }

    public function test_reset_password_returns_422_when_confirmation_does_not_match(): void
    {
        $response = $this->controller->resetPassword(
            $this->makeRequest('POST', '/api/v1/auth/reset-password', [
                'token'            => 'sometoken',
                'password'         => 'newpassword123',
                'password_confirm' => 'different456',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(422, $response->getStatusCode());
    }

    public function test_reset_password_returns_400_for_invalid_token(): void
    {
        $response = $this->controller->resetPassword(
            $this->makeRequest('POST', '/api/v1/auth/reset-password', [
                'token'            => 'invalid_token',
                'password'         => 'newpassword123',
                'password_confirm' => 'newpassword123',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(400, $response->getStatusCode());
    }

    public function test_reset_password_returns_400_for_expired_token(): void
    {
        $user = User::where('email', 'admin@test.com')->first();
        $token = 'expiredtoken123';
        $user->reset_token_hash    = hash('sha256', $token);
        $user->reset_token_expires = date('Y-m-d H:i:s', time() - 60); // expired 1 min ago
        $user->save();

        $response = $this->controller->resetPassword(
            $this->makeRequest('POST', '/api/v1/auth/reset-password', [
                'token'            => $token,
                'password'         => 'newpassword123',
                'password_confirm' => 'newpassword123',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(400, $response->getStatusCode());
    }

    public function test_reset_password_succeeds_with_valid_token(): void
    {
        $user = User::where('email', 'admin@test.com')->first();
        $token = 'validtoken123';
        $user->reset_token_hash    = hash('sha256', $token);
        $user->reset_token_expires = date('Y-m-d H:i:s', time() + 600); // valid 10 min
        $user->save();

        $response = $this->controller->resetPassword(
            $this->makeRequest('POST', '/api/v1/auth/reset-password', [
                'token'            => $token,
                'password'         => 'newpassword123',
                'password_confirm' => 'newpassword123',
            ]),
            $this->makeResponse(),
        );

        $this->assertSame(200, $response->getStatusCode());

        // Token must be consumed (nulled out)
        $updated = User::find($user->id);
        $this->assertNull($updated->reset_token_hash);
        $this->assertTrue(password_verify('newpassword123', (string) $updated->password_hash));
    }
}
