<?php

declare(strict_types=1);

namespace Corexpress\Tests\Unit\Controllers;

use Corexpress\Controllers\PostController;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Unit tests for the private helper methods in PostController.
 *
 * These are pure functions with no database dependency, so no SQLite setup
 * is needed. Reflection is used to access private methods directly.
 */
class PostControllerValidationTest extends TestCase
{
    private PostController $controller;

    protected function setUp(): void
    {
        $this->controller = new PostController();
    }

    // ── Helper: invoke a private method ──────────────────────────────────────

    private function call(string $method, mixed ...$args): mixed
    {
        $ref = new ReflectionMethod($this->controller, $method);
        $ref->setAccessible(true);
        return $ref->invokeArgs($this->controller, $args);
    }

    // ── validatePostBody ──────────────────────────────────────────────────────

    public function test_validate_returns_error_for_missing_title(): void
    {
        $errors = $this->call('validatePostBody', ['content' => 'some content']);

        $this->assertArrayHasKey('title', $errors);
    }

    public function test_validate_returns_error_for_empty_title(): void
    {
        $errors = $this->call('validatePostBody', ['title' => '   ', 'content' => 'x']);

        $this->assertArrayHasKey('title', $errors);
    }

    public function test_validate_returns_error_for_title_over_500_chars(): void
    {
        $errors = $this->call('validatePostBody', [
            'title'   => str_repeat('a', 501),
            'content' => 'some content',
        ]);

        $this->assertArrayHasKey('title', $errors);
        $this->assertStringContainsString('500', $errors['title']);
    }

    public function test_validate_title_at_exactly_500_chars_is_valid(): void
    {
        $errors = $this->call('validatePostBody', [
            'title'   => str_repeat('a', 500),
            'content' => 'some content',
        ]);

        $this->assertArrayNotHasKey('title', $errors);
    }

    public function test_validate_returns_error_for_missing_content(): void
    {
        $errors = $this->call('validatePostBody', ['title' => 'A title']);

        $this->assertArrayHasKey('content', $errors);
    }

    public function test_validate_returns_error_for_empty_content(): void
    {
        $errors = $this->call('validatePostBody', ['title' => 'A title', 'content' => '']);

        $this->assertArrayHasKey('content', $errors);
    }

    public function test_validate_returns_empty_array_for_valid_body(): void
    {
        $errors = $this->call('validatePostBody', [
            'title'   => 'A valid title',
            'content' => 'Some content here',
        ]);

        $this->assertSame([], $errors);
    }

    public function test_validate_returns_both_errors_when_body_is_empty(): void
    {
        $errors = $this->call('validatePostBody', []);

        $this->assertArrayHasKey('title', $errors);
        $this->assertArrayHasKey('content', $errors);
    }

    // ── sanitizeMapUrl ────────────────────────────────────────────────────────

    public function test_sanitize_map_url_returns_null_for_null_input(): void
    {
        $this->assertNull($this->call('sanitizeMapUrl', null));
    }

    public function test_sanitize_map_url_returns_null_for_empty_string(): void
    {
        $this->assertNull($this->call('sanitizeMapUrl', ''));
    }

    public function test_sanitize_map_url_rejects_http_scheme(): void
    {
        $this->assertNull($this->call('sanitizeMapUrl', 'http://maps.google.com/embed?q=paris'));
    }

    public function test_sanitize_map_url_rejects_ftp_scheme(): void
    {
        $this->assertNull($this->call('sanitizeMapUrl', 'ftp://maps.example.com'));
    }

    public function test_sanitize_map_url_accepts_https_scheme(): void
    {
        $url    = 'https://maps.google.com/embed?q=paris';
        $result = $this->call('sanitizeMapUrl', $url);

        $this->assertSame($url, $result);
    }

    public function test_sanitize_map_url_returns_null_for_url_over_2048_chars(): void
    {
        $url    = 'https://' . str_repeat('a', 2050);
        $result = $this->call('sanitizeMapUrl', $url);

        $this->assertNull($result);
    }

    public function test_sanitize_map_url_accepts_url_at_exactly_2048_chars(): void
    {
        // Build an https:// URL of exactly 2048 characters
        $prefix = 'https://';
        $url    = $prefix . str_repeat('a', 2048 - strlen($prefix));

        $this->assertSame($url, $this->call('sanitizeMapUrl', $url));
    }

    public function test_sanitize_map_url_trims_surrounding_whitespace(): void
    {
        $url    = 'https://maps.google.com/embed';
        $result = $this->call('sanitizeMapUrl', '  ' . $url . '  ');

        $this->assertSame($url, $result);
    }
}
