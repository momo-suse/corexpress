<?php

declare(strict_types=1);

namespace Corexpress\Tests;

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;
use PHPUnit\Framework\TestCase as BaseTestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $_SESSION = [];
        $this->createSchema();
    }

    protected function tearDown(): void
    {
        $this->dropSchema();
        parent::tearDown();
    }

    // ── Schema ────────────────────────────────────────────────────────────────

    private function createSchema(): void
    {
        $schema = Capsule::schema();

        $schema->create('users', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('email', 255)->unique();
            $table->string('password_hash', 255);
            $table->string('reset_token_hash', 255)->nullable()->unique();
            $table->timestamp('reset_token_expires')->nullable();
            $table->timestamps();
        });

        $schema->create('settings', function (Blueprint $table): void {
            $table->string('key', 100)->primary();
            $table->text('value');
            $table->timestamps();
        });

        // images must exist before posts (posts.featured_image_id references it)
        $schema->create('images', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('post_id')->nullable();
            $table->string('filename', 255);
            $table->string('original_name', 255);
            $table->string('mime_type', 100);
            $table->unsignedInteger('file_size');
            $table->timestamp('created_at')->useCurrent();
        });

        $schema->create('posts', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('title', 500);
            $table->string('slug', 500)->unique();
            $table->string('base_locale', 10)->default('en');
            $table->longText('content');
            $table->text('excerpt')->nullable();
            $table->string('tags', 500)->nullable();
            $table->unsignedInteger('featured_image_id')->nullable();
            $table->string('map_embed_url', 2048)->nullable();
            $table->string('reading_time', 50)->nullable();
            // SQLite has no ENUM — TEXT with application-level validation
            $table->string('status', 20)->default('draft');
            $table->timestamps();
        });

        $schema->create('comments', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('post_id');
            $table->string('author_name', 255);
            $table->string('author_email', 255);
            $table->text('content');
            $table->string('status', 20)->default('pending');
            $table->timestamp('created_at')->useCurrent();
        });

        $schema->create('post_translations', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('post_id');
            $table->string('locale', 10);
            $table->string('title', 500);
            $table->longText('content');
            $table->text('excerpt')->nullable();
            $table->timestamps();
            $table->unique(['post_id', 'locale']);
        });
    }

    private function dropSchema(): void
    {
        $schema = Capsule::schema();
        // Drop in reverse dependency order
        $schema->dropIfExists('post_translations');
        $schema->dropIfExists('comments');
        $schema->dropIfExists('posts');
        $schema->dropIfExists('images');
        $schema->dropIfExists('settings');
        $schema->dropIfExists('users');
    }

    // ── PSR-7 factories ───────────────────────────────────────────────────────

    /**
     * Build a PSR-7 server request for controller tests.
     *
     * @param array<string, mixed>  $body     Parsed body (simulates JSON/form payload)
     * @param array<string, mixed>|null $session  Session state to set. null = leave $_SESSION untouched.
     * @param array<string, string> $headers  Additional request headers
     * @param array<string, string> $query    Query string parameters
     */
    protected function makeRequest(
        string $method,
        string $path,
        array $body = [],
        ?array $session = null,
        array $headers = [],
        array $query = [],
    ): ServerRequestInterface {
        // Only overwrite $_SESSION when the caller explicitly passes an array.
        // null (default) means "don't touch the session" — allows tests to set
        // $_SESSION state before or after this call without it being clobbered.
        if ($session !== null) {
            $_SESSION = $session;
        }

        $uri = $query !== [] ? $path . '?' . http_build_query($query) : $path;
        $request = (new ServerRequestFactory())->createServerRequest($method, $uri);

        if ($body !== []) {
            $request = $request->withParsedBody($body);
        }

        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }

        return $request;
    }

    /**
     * Return a fresh empty PSR-7 response.
     */
    protected function makeResponse(): ResponseInterface
    {
        return (new ResponseFactory())->createResponse();
    }

    /**
     * Decode the JSON body of a response and return it as an array.
     *
     * @return array<string, mixed>
     */
    protected function decodeJson(ResponseInterface $response): array
    {
        $body = (string) $response->getBody();
        return (array) json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    }
}
