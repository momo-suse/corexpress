<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Corexpress\Models\Setting;
use Corexpress\Models\Subscriber;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class SubscriberAuthController extends Controller
{
    private const GOOGLE_AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const GOOGLE_USER_URL  = 'https://www.googleapis.com/oauth2/v3/userinfo';

    /**
     * GET /api/v1/auth/subscriber/google
     * Redirects to Google OAuth consent screen.
     */
    public function redirect(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $enabled = Setting::where('key', 'subscribers_enabled')->value('value') ?? '0';
        if ($enabled !== '1') {
            return $this->error($response, 'Subscriber features are disabled.', 503);
        }

        $clientId = Setting::where('key', 'google_client_id')->value('value') ?? '';

        if ($clientId === '') {
            return $this->error($response, 'Google OAuth is not configured.', 503);
        }

        $state = bin2hex(random_bytes(16));
        $_SESSION['oauth_state'] = $state;

        $params = $request->getQueryParams();
        if (!empty($params['return_to'])) {
            $_SESSION['oauth_return_to'] = $params['return_to'];
        }

        $callbackUrl = $this->callbackUrl($request);

        $url = self::GOOGLE_AUTH_URL . '?' . http_build_query([
            'client_id'     => $clientId,
            'redirect_uri'  => $callbackUrl,
            'response_type' => 'code',
            'scope'         => 'openid email profile',
            'state'         => $state,
            'prompt'        => 'select_account',
        ]);

        return $response->withStatus(302)->withHeader('Location', $url);
    }

    /**
     * GET /api/v1/auth/subscriber/google/callback
     * Handles the OAuth callback from Google.
     */
    public function callback(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params = $request->getQueryParams();
        $code   = (string) ($params['code']  ?? '');
        $state  = (string) ($params['state'] ?? '');

        $expectedState = (string) ($_SESSION['oauth_state'] ?? '');
        unset($_SESSION['oauth_state']);

        if ($state === '' || !hash_equals($expectedState, $state)) {
            return $this->redirectToFrontend($request, $response, '/subscriber/error?reason=state_mismatch');
        }

        if ($code === '') {
            return $this->redirectToFrontend($request, $response, '/subscriber/error?reason=no_code');
        }

        $clientId     = Setting::where('key', 'google_client_id')->value('value') ?? '';
        $clientSecret = Setting::where('key', 'google_client_secret')->value('value') ?? '';

        if ($clientId === '' || $clientSecret === '') {
            return $this->redirectToFrontend($request, $response, '/subscriber/error?reason=not_configured');
        }

        $callbackUrl = $this->callbackUrl($request);

        $tokenResponse = $this->httpPost(self::GOOGLE_TOKEN_URL, [
            'code'          => $code,
            'client_id'     => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri'  => $callbackUrl,
            'grant_type'    => 'authorization_code',
        ]);

        if ($tokenResponse === null) {
            return $this->redirectToFrontend($request, $response, '/subscriber/error?reason=token_exchange');
        }

        $accessToken = (string) ($tokenResponse['access_token'] ?? '');
        if ($accessToken === '') {
            return $this->redirectToFrontend($request, $response, '/subscriber/error?reason=no_token');
        }

        $profile = $this->httpGet(self::GOOGLE_USER_URL, $accessToken);
        if ($profile === null) {
            return $this->redirectToFrontend($request, $response, '/subscriber/error?reason=profile_fetch');
        }

        $googleId  = (string) ($profile['sub']     ?? '');
        $email     = strtolower(trim((string) ($profile['email'] ?? '')));
        $name      = trim((string) ($profile['name'] ?? ''));
        $avatarUrl = (string) ($profile['picture'] ?? '');

        if ($googleId === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->redirectToFrontend($request, $response, '/subscriber/error?reason=invalid_profile');
        }

        $subscriber = Subscriber::where('google_id', $googleId)->first()
            ?? Subscriber::where('email', $email)->first();

        if ($subscriber === null) {
            $subscriber = Subscriber::create([
                'google_id'          => $googleId,
                'name'               => $name !== '' ? $name : $email,
                'email'              => $email,
                'avatar_url'         => $avatarUrl !== '' ? $avatarUrl : null,
                'unsubscribe_token'  => bin2hex(random_bytes(32)),
                'subscribed'         => true,
            ]);
        } else {
            $subscriber->google_id  = $googleId;
            $subscriber->name       = $name !== '' ? $name : $subscriber->name;
            $subscriber->avatar_url = $avatarUrl !== '' ? $avatarUrl : $subscriber->avatar_url;
            $subscriber->save();
        }

        $_SESSION['subscriber_id'] = $subscriber->id;

        $returnTo = (string) ($_SESSION['oauth_return_to'] ?? '/');
        unset($_SESSION['oauth_return_to']);

        if (!preg_match('#^/#', $returnTo)) {
            $returnTo = '/';
        }

        return $this->redirectToFrontend($request, $response, $returnTo);
    }

    /**
     * GET /api/v1/auth/subscriber/me   [SubscriberMiddleware]
     * Returns current subscriber info.
     */
    public function me(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $subscriber = Subscriber::find((int) $_SESSION['subscriber_id']);

        if ($subscriber === null) {
            unset($_SESSION['subscriber_id']);
            return $this->error($response, 'Subscriber not found.', 404);
        }

        return $this->json($response, [
            'data' => [
                'id'         => $subscriber->id,
                'name'       => $subscriber->name,
                'email'      => $subscriber->email,
                'avatar_url' => $subscriber->avatar_url,
                'subscribed' => $subscriber->subscribed,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/subscriber/logout   [SubscriberMiddleware + CSRF]
     */
    public function logout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        unset($_SESSION['subscriber_id']);

        return $response->withStatus(204);
    }

    /**
     * PATCH /api/v1/auth/subscriber/me   [SubscriberMiddleware + CSRF]
     * Updates the subscriber's notification preference.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $subscriber = Subscriber::find((int) $_SESSION['subscriber_id']);

        if ($subscriber === null) {
            unset($_SESSION['subscriber_id']);
            return $this->error($response, 'Subscriber not found.', 404);
        }

        $body = (array) ($request->getParsedBody() ?? []);

        if (array_key_exists('subscribed', $body)) {
            $subscriber->subscribed = (bool) $body['subscribed'];
            $subscriber->save();
        }

        return $this->json($response, [
            'data' => [
                'id'         => $subscriber->id,
                'subscribed' => $subscriber->subscribed,
            ],
        ]);
    }

    /**
     * DELETE /api/v1/auth/subscriber/me   [SubscriberMiddleware + CSRF]
     * Permanently deletes the subscriber's account.
     */
    public function destroy(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $subscriber = Subscriber::find((int) $_SESSION['subscriber_id']);

        unset($_SESSION['subscriber_id']);

        if ($subscriber !== null) {
            $subscriber->delete();
        }

        return $response->withStatus(204);
    }

    /**
     * GET /api/v1/auth/subscriber/unsubscribe?token=xxx   [Public]
     * Unsubscribes via token link (used from email footer).
     */
    public function unsubscribe(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $enabled = Setting::where('key', 'subscribers_enabled')->value('value') ?? '0';
        if ($enabled !== '1') {
            return $this->error($response, 'Subscriber features are disabled.', 503);
        }

        $params = $request->getQueryParams();
        $token  = trim((string) ($params['token'] ?? ''));

        if ($token === '') {
            return $this->error($response, 'Invalid token.', 400);
        }

        $subscriber = Subscriber::where('unsubscribe_token', $token)->first();

        if ($subscriber === null) {
            return $this->error($response, 'Invalid token.', 404);
        }

        $subscriber->subscribed = false;
        $subscriber->save();

        return $this->redirectToFrontend($request, $response, '/subscriber/unsubscribed');
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function callbackUrl(ServerRequestInterface $request): string
    {
        $uri    = $request->getUri();
        $scheme = $uri->getScheme();
        $host   = $uri->getHost();
        $port   = $uri->getPort();

        $base = $scheme . '://' . $host;
        if ($port && !in_array($port, [80, 443], true)) {
            $base .= ':' . $port;
        }

        return $base . '/api/v1/auth/subscriber/google/callback';
    }

    private function redirectToFrontend(
        ServerRequestInterface $request,
        ResponseInterface $response,
        string $path,
    ): ResponseInterface {
        $uri    = $request->getUri();
        $scheme = $uri->getScheme();
        $host   = $uri->getHost();
        $port   = $uri->getPort();

        $base = $scheme . '://' . $host;
        if ($port && !in_array($port, [80, 443], true)) {
            $base .= ':' . $port;
        }

        return $response->withStatus(302)->withHeader('Location', $base . $path);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function httpPost(string $url, array $data): ?array
    {
        $context = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
                'content' => http_build_query($data),
                'timeout' => 15,
            ],
            'ssl' => [
                'verify_peer'      => true,
                'verify_peer_name' => true,
            ],
        ]);

        $raw = @file_get_contents($url, false, $context);
        if ($raw === false) {
            return null;
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function httpGet(string $url, string $bearerToken): ?array
    {
        $context = stream_context_create([
            'http' => [
                'method'  => 'GET',
                'header'  => "Authorization: Bearer {$bearerToken}\r\nAccept: application/json\r\n",
                'timeout' => 15,
            ],
            'ssl' => [
                'verify_peer'      => true,
                'verify_peer_name' => true,
            ],
        ]);

        $raw = @file_get_contents($url, false, $context);
        if ($raw === false) {
            return null;
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }
}
