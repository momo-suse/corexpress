<?php

declare(strict_types=1);

use Corexpress\Controllers\AuthController;
use Corexpress\Controllers\CommentController;
use Corexpress\Controllers\ImageController;
use Corexpress\Controllers\PageController;
use Corexpress\Controllers\PostController;
use Corexpress\Controllers\SettingController;
use Corexpress\Controllers\StyleCollectionController;
use Corexpress\Middleware\AuthMiddleware;
use Corexpress\Middleware\CsrfMiddleware;
use Corexpress\Middleware\JsonResponseMiddleware;

// ── Shared middleware instances ────────────────────────────────────────────────
$authMiddleware = new AuthMiddleware();
$csrfMiddleware = new CsrfMiddleware();

// ── API v1 routes ──────────────────────────────────────────────────────────────
// All routes in this group automatically receive Content-Type: application/json.
// Slim 4 middleware is LIFO on request: last .add() runs first.
// Admin pattern: ->add($csrfMiddleware)->add($authMiddleware)
// Execution order: AuthMiddleware (outermost) → CsrfMiddleware → handler.

$app->group('/api/v1', function (\Slim\Routing\RouteCollectorProxy $group) use ($authMiddleware, $csrfMiddleware): void {

    // ── Auth ───────────────────────────────────────────────────────────────────

    // Public: get a CSRF token for the current session (call before login or comment form)
    $group->get('/auth/csrf', [AuthController::class, 'csrf']);

    // Public: authenticate with email + password
    $group->post('/auth/login', [AuthController::class, 'login']);

    // Public: request a password reset email
    $group->post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

    // Public + CSRF: consume reset token and set new password
    $group->post('/auth/reset-password', [AuthController::class, 'resetPassword'])
          ->add($csrfMiddleware);

    // Authenticated: current user info
    $group->get('/auth/me', [AuthController::class, 'me'])
          ->add($authMiddleware);

    // Authenticated + CSRF: destroy session
    $group->post('/auth/logout', [AuthController::class, 'logout'])
          ->add($csrfMiddleware)
          ->add($authMiddleware);

    // Authenticated + CSRF: change password (requires current password)
    $group->post('/auth/change-password', [AuthController::class, 'changePassword'])
          ->add($csrfMiddleware)
          ->add($authMiddleware);

    // ── Posts ──────────────────────────────────────────────────────────────────

    // Public: tag aggregation (top N tags by frequency across all published posts)
    $group->get('/tags', [PostController::class, 'tags']);

    // Public: paginated list of published posts
    $group->get('/posts', [PostController::class, 'index']);

    // Public: single published post by slug
    $group->get('/posts/{slug}', [PostController::class, 'show']);

    // Admin: create / update / delete posts
    $group->post('/posts',        [PostController::class, 'store'])->add($csrfMiddleware)->add($authMiddleware);
    $group->put('/posts/{id}',    [PostController::class, 'update'])->add($csrfMiddleware)->add($authMiddleware);
    $group->delete('/posts/{id}', [PostController::class, 'destroy'])->add($csrfMiddleware)->add($authMiddleware);

    // ── Comments ───────────────────────────────────────────────────────────────

    // Public (CSRF protected): submit a comment — stored with status=pending
    $group->post('/posts/{postId}/comments', [CommentController::class, 'store'])
          ->add($csrfMiddleware);

    // Admin read (Auth only — no CSRF needed for GET)
    $group->get('/comments', [CommentController::class, 'index'])
          ->add($authMiddleware);

    // Admin write (Auth + CSRF)
    $group->put('/comments/{id}',    [CommentController::class, 'update'])->add($csrfMiddleware)->add($authMiddleware);
    // Static route BEFORE {id} so the router does not treat 'spam' as a numeric ID
    $group->delete('/comments/spam',  [CommentController::class, 'clearSpam'])->add($csrfMiddleware)->add($authMiddleware);
    $group->delete('/comments/{id}', [CommentController::class, 'destroy'])->add($csrfMiddleware)->add($authMiddleware);

    // ── Pages ──────────────────────────────────────────────────────────────────

    // Public: list all pages with components
    $group->get('/pages', [PageController::class, 'index']);

    // Public: single page with components + resolved styles from active collection
    $group->get('/pages/{slug}', [PageController::class, 'show']);

    // Admin: toggle a component's visibility or order on a page
    $group->put('/pages/components/{componentId}', [PageController::class, 'updateComponent'])
          ->add($csrfMiddleware)
          ->add($authMiddleware);

    // ── Style Collections ──────────────────────────────────────────────────────

    // Public: list and view collections
    $group->get('/style-collections',      [StyleCollectionController::class, 'index']);
    $group->get('/style-collections/{id}', [StyleCollectionController::class, 'show']);

    // Admin: create / update / delete collections
    $group->post('/style-collections',        [StyleCollectionController::class, 'store'])->add($csrfMiddleware)->add($authMiddleware);
    $group->put('/style-collections/{id}',    [StyleCollectionController::class, 'update'])->add($csrfMiddleware)->add($authMiddleware);
    $group->delete('/style-collections/{id}', [StyleCollectionController::class, 'destroy'])->add($csrfMiddleware)->add($authMiddleware);

    // ── Images ─────────────────────────────────────────────────────────────────

    // Admin read (Auth only)
    $group->get('/images', [ImageController::class, 'index'])
          ->add($authMiddleware);

    // Admin upload (Auth + CSRF — multipart/form-data, field name: "image")
    $group->post('/images', [ImageController::class, 'store'])
          ->add($csrfMiddleware)
          ->add($authMiddleware);

    // Admin delete (Auth + CSRF)
    $group->delete('/images/{id}', [ImageController::class, 'destroy'])
          ->add($csrfMiddleware)
          ->add($authMiddleware);

    // ── Settings ───────────────────────────────────────────────────────────────

    // Public: read settings (blog name, description, theme, social links — all safe to expose)
    $group->get('/settings', [SettingController::class, 'index']);

    // Admin + CSRF: bulk update settings
    $group->put('/settings', [SettingController::class, 'update'])
          ->add($csrfMiddleware)
          ->add($authMiddleware);

})->add(new JsonResponseMiddleware());