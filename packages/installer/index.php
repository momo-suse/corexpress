<?php

declare(strict_types=1);

// ── Autoload installer classes ─────────────────────────────────────────────────
spl_autoload_register(function (string $class): void {
    $prefix = 'Corexpress\\Installer\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $file = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use Corexpress\Installer\Database;
use Corexpress\Installer\Migrator;
use Corexpress\Installer\Requirements;
use Corexpress\Installer\Security;

// ── i18n helpers ───────────────────────────────────────────────────────────────

function detectInstallerLocale(): string
{
    if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['installer']['locale'])) {
        return $_SESSION['installer']['locale'];
    }
    $accept = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'en';
    preg_match('/^([a-z]{2})/i', $accept, $m);
    $code   = strtolower($m[1] ?? 'en');
    $locale = in_array($code, ['en', 'es', 'ja'], true) ? $code : 'en';
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION['installer']['locale'] = $locale;
    }
    return $locale;
}

/**
 * Translate a key using the active installer locale.
 * Automatically HTML-escapes the result — safe for direct echo in HTML.
 * For raw JS strings use Security::escape() directly.
 *
 * @param array<string, string> $params Placeholder replacements {key} → value
 */
function t(string $key, array $params = []): string
{
    static $strings = null;
    if ($strings === null) {
        $locale = detectInstallerLocale();
        $file   = __DIR__ . '/lang/' . $locale . '.php';
        $strings = file_exists($file) ? require $file : require __DIR__ . '/lang/en.php';
    }
    $str = $strings[$key] ?? $key;
    foreach ($params as $k => $v) {
        $str = str_replace('{' . $k . '}', (string)$v, $str);
    }
    return htmlspecialchars($str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// ── Constants ──────────────────────────────────────────────────────────────────
// config.php is written to the APP root: packages/app/config.php
// From packages/installer/ → go up one level to packages/ → then into app/
define('CONFIG_PATH', dirname(__DIR__) . '/app/config.php');

// ── Session cookie params (explicit for shared hosting compatibility) ─────────
// Must be called before EVERY session_start() — sets Secure, HttpOnly, SameSite
function installerSessionInit(): void
{
    static $configured = false;
    if ($configured && session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly'  => true,
        'samesite'  => 'Lax',
    ]);
    session_name('corexpress_installer');
    session_start();
    $configured = true;
}

// Steps: 0=Welcome, 1=Database, 2=Admin, 3=Settings, 4=Review
// Progress bar tracks steps 1–3 (DB, Admin, Settings)

// ── AJAX endpoints — handled BEFORE the "already installed" check ───────────────
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && in_array($action, ['test-db', 'install'], true)) {
    ini_set('display_errors', '0'); // prevent PHP errors from corrupting JSON
    ob_start();                      // buffer all output; cleared before each echo
    header('Content-Type: application/json');
    installerSessionInit();

    if (!Security::verifyCsrfHeader()) {
        http_response_code(403);
        ob_end_clean();
        echo json_encode(['ok' => false, 'error' => 'Invalid CSRF token.']);
        exit;
    }

    if ($action === 'test-db') {
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $config = [
            'host'     => trim((string)($body['host'] ?? '')),
            'port'     => (int)($body['port'] ?? 3306),
            'name'     => trim((string)($body['name'] ?? '')),
            'user'     => trim((string)($body['user'] ?? '')),
            'password' => (string)($body['password'] ?? ''),
        ];
        ob_end_clean();
        echo json_encode(Database::test($config));
        exit;
    }

    // action === 'install'
    handleInstallAjax();
    exit;
}

// ── Block if already installed ─────────────────────────────────────────────────
if (file_exists(CONFIG_PATH)) {
    http_response_code(403);
    renderAlreadyInstalled();
    exit;
}

// ── Session ────────────────────────────────────────────────────────────────────
installerSessionInit();

// Prevent browser from caching pages that embed CSRF tokens
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

if (!isset($_SESSION['installer'])) {
    $_SESSION['installer'] = ['step' => -1];
}

// ── Router ─────────────────────────────────────────────────────────────────────
$step = (int)($_GET['step'] ?? 0);

if ($step < 0 || $step > 4) {
    redirect('?step=0');
}

// Prevent step skipping
$completedStep = $_SESSION['installer']['step'] ?? -1;
if ($step > 0 && $step > $completedStep + 1) {
    redirect('?step=' . max(0, $completedStep + 1));
}

// ── POST handlers ──────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $csrfToken = trim($_POST['_csrf'] ?? '');
    if (!Security::verifyCsrfToken($csrfToken)) {
        renderError(t('security.error'), t('security.csrf'));
        exit;
    }

    switch ($step) {
        case 0: handleWelcomePost(); break;
        case 1: handleDbPost();      break;
        case 2: handleAdminPost();   break;
        case 3: handleSettingsPost(); break;
    }
}

// ── GET: render steps ──────────────────────────────────────────────────────────
switch ($step) {
    case 0: renderWelcome();  break;
    case 1: renderDb();       break;
    case 2: renderAdmin();    break;
    case 3: renderSettings(); break;
    case 4: renderReview();   break;
    default: redirect('?step=0');
}

exit;

// ═══════════════════════════════════════════════════════════════════════════════
// POST HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

function handleWelcomePost(): void
{
    $results = Requirements::check();
    if (!Requirements::allPassed($results)) {
        redirect('?step=0');
    }
    advanceStep(0);
    redirect('?step=1');
}

function handleDbPost(): void
{
    $host = trim($_POST['db_host'] ?? '');
    $port = (int)($_POST['db_port'] ?? 3306);
    $name = trim($_POST['db_name'] ?? '');
    $user = trim($_POST['db_user'] ?? '');
    $pass = $_POST['db_password'] ?? '';

    $errors = [];
    if ($host === '') $errors[] = t('errors.db_host_required');
    if ($name === '') $errors[] = t('errors.db_name_required');
    if ($user === '') $errors[] = t('errors.db_user_required');
    if ($port < 1 || $port > 65535) $errors[] = t('errors.db_port_invalid');

    if (empty($errors)) {
        $result = Database::test(compact('host', 'port', 'name', 'user') + ['password' => $pass]);
        if (!$result['ok']) {
            $errors[] = $result['error'] ?? t('errors.db_connect_fail');
        }
    }

    if (!empty($errors)) {
        $_SESSION['installer']['errors'] = $errors;
        $_SESSION['installer']['form']   = compact('host', 'port', 'name', 'user');
        redirect('?step=1');
    }

    $_SESSION['installer']['db'] = ['host' => $host, 'port' => $port, 'name' => $name, 'user' => $user, 'password' => $pass];
    unset($_SESSION['installer']['errors'], $_SESSION['installer']['form']);
    advanceStep(1);
    redirect('?step=2');
}

function handleAdminPost(): void
{
    $email    = trim($_POST['admin_email'] ?? '');
    $password = $_POST['admin_password'] ?? '';
    $confirm  = $_POST['admin_confirm'] ?? '';

    $errors = [];
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = t('errors.email_invalid');
    }
    if (strlen($password) < 8) {
        $errors[] = t('errors.password_short');
    }
    if ($password !== $confirm) {
        $errors[] = t('errors.password_mismatch');
    }

    if (!empty($errors)) {
        $_SESSION['installer']['errors'] = $errors;
        $_SESSION['installer']['form']   = ['admin_email' => $email];
        redirect('?step=2');
    }

    $_SESSION['installer']['admin'] = [
        'email'         => $email,
        'password_hash' => password_hash($password, PASSWORD_ARGON2ID),
    ];
    unset($_SESSION['installer']['errors'], $_SESSION['installer']['form']);
    advanceStep(2);
    redirect('?step=3');
}

function handleSettingsPost(): void
{
    $name        = trim($_POST['blog_name'] ?? '');
    $description = trim($_POST['blog_description'] ?? '');
    $theme       = $_POST['blog_theme'] ?? 'default';
    $locale      = $_POST['app_locale'] ?? detectInstallerLocale();

    if (!in_array($theme, ['default', 'minimal', 'dark'], true)) {
        $theme = 'default';
    }
    if (!in_array($locale, ['en', 'es', 'ja'], true)) {
        $locale = 'en';
    }

    // Store chosen locale in session so subsequent pages render in that language
    $_SESSION['installer']['locale'] = $locale;

    $errors = [];
    if ($name === '') $errors[] = t('errors.name_required');
    if (strlen($name) > 100) $errors[] = t('errors.name_too_long');

    if (!empty($errors)) {
        $_SESSION['installer']['errors'] = $errors;
        $_SESSION['installer']['form']   = compact('name', 'description', 'theme', 'locale');
        redirect('?step=3');
    }

    $_SESSION['installer']['blog'] = compact('name', 'description', 'theme', 'locale');
    unset($_SESSION['installer']['errors'], $_SESSION['installer']['form']);
    advanceStep(3);
    redirect('?step=4');
}

function handleInstallAjax(): void
{
    $db    = $_SESSION['installer']['db']    ?? null;
    $admin = $_SESSION['installer']['admin'] ?? null;
    $blog  = $_SESSION['installer']['blog']  ?? null;

    if (!$db || !$admin || !$blog) {
        ob_end_clean();
        echo json_encode(['ok' => false, 'error' => t('session.expired')]);
        return;
    }

    try {
        $pdo      = Database::connect($db);
        $migrator = new Migrator($pdo);
        $migrator->run();

        $stmt = $pdo->prepare(
            'INSERT INTO `settings` (`key`, `value`) VALUES (:k, :v)
             ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)'
        );
        foreach ([
            'blog_name'        => $blog['name'],
            'blog_description' => $blog['description'],
            'blog_theme'       => $blog['theme'],
            'app_locale'       => $blog['locale'] ?? 'en',
            'comments_enabled' => '1',
        ] as $key => $value) {
            $stmt->execute([':k' => $key, ':v' => $value]);
        }

        $pdo->prepare(
            'INSERT INTO `users` (`email`, `password_hash`) VALUES (:email, :hash)
             ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`)'
        )->execute([':email' => $admin['email'], ':hash' => $admin['password_hash']]);

        writeConfig($db, $blog, Security::generateSessionKey(), detectDomain());
        session_destroy();

        ob_end_clean();
        echo json_encode(['ok' => true]);
    } catch (\Throwable $e) {
        ob_end_clean();
        echo json_encode(['ok' => false, 'error' => Security::escape($e->getMessage())]);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function renderWelcome(): void
{
    $results  = Requirements::check();
    $allOk    = Requirements::allPassed($results);
    $hasIssue = false;
    foreach ($results as $r) {
        if (!$r['ok']) { $hasIssue = true; break; }
    }
    $csrf = Security::getCsrfToken();

    renderLayout('Welcome', 0, function () use ($results, $allOk, $hasIssue, $csrf): void {
        echo '<div class="card-body welcome-body">';
        echo '<div class="welcome-hero">';
        echo '<h1 class="welcome-title">Welcome to <span class="brand-name"><span class="brand-chevron">«</span>orexpress</span></h1>';
        echo '<p class="welcome-sub">The best automated blog installer.</p>';
        echo '</div>';

        $badgeClass = $hasIssue ? 'req-badge req-badge--warn' : 'req-badge req-badge--ok';
        $badgeIcon  = $hasIssue ? '⚠' : '✓';
        $badgeText  = $hasIssue ? 'Review requirements' : 'All systems ready';

        if ($allOk) {
            echo '<form method="POST" action="?step=0" class="welcome-form">';
            echo '<input type="hidden" name="_csrf" value="' . Security::escape($csrf) . '">';
            echo '<button type="submit" class="btn btn-primary btn-large">Get Started</button>';
            echo '</form>';
        } else {
            echo '<div class="alert alert-error" style="margin-top:1.5rem;">Fix the critical issues above before continuing.</div>';
        }

        echo '<details class="req-accordion">';
        echo '<summary class="' . $badgeClass . '">';
        echo '<span class="req-badge-icon">' . $badgeIcon . '</span>';
        echo '<span>' . $badgeText . '</span>';
        echo '<span class="req-badge-arrow">›</span>';
        echo '</summary>';
        echo '<div class="checks">';
        foreach ($results as $result) {
            $icon  = $result['ok'] ? '✓' : ($result['critical'] ? '✗' : '⚠');
            $class = $result['ok'] ? 'check-ok' : ($result['critical'] ? 'check-fail' : 'check-warn');
            echo '<div class="check-row ' . $class . '">';
            echo '<span class="check-icon">' . $icon . '</span>';
            echo '<span class="check-label">' . Security::escape($result['label']) . '</span>';
            echo '<span class="check-detail">' . Security::escape($result['detail']) . '</span>';
            echo '</div>';
        }
        echo '</div>';
        echo '</details>';

        echo '</div>';
    });
}

function renderDb(): void
{
    $errors   = $_SESSION['installer']['errors'] ?? [];
    $form     = $_SESSION['installer']['form'] ?? [];
    $saved    = $_SESSION['installer']['db'] ?? [];
    $csrf     = Security::getCsrfToken();
    unset($_SESSION['installer']['errors'], $_SESSION['installer']['form']);

    $defaults = [
        'host' => $saved['host'] ?? ($form['host'] ?? (getenv('DB_HOST') ?: 'localhost')),
        'port' => $saved['port'] ?? ($form['port'] ?? (getenv('DB_PORT') ?: '3306')),
        'name' => $saved['name'] ?? ($form['name'] ?? (getenv('DB_NAME') ?: '')),
        'user' => $saved['user'] ?? ($form['user'] ?? (getenv('DB_USER') ?: '')),
    ];

    $csrfEsc = Security::escape($csrf);

    renderLayout('Database', 1, function () use ($errors, $defaults, $csrfEsc): void {
        echo '<div class="step-img-wrap"><div class="step-img-circle"><img src="/setup/docs/db.png" alt="" class="step-img"></div></div>';
        echo '<div class="card-body">';
        echo '<h2 class="step-title" style="text-align:center;">Database Configuration</h2>';
        echo '<p class="step-desc" style="text-align:center;">Enter the MySQL credentials provided by your hosting provider.</p>';

        renderErrors($errors);

        echo '<form method="POST" action="?step=1">';
        echo '<input type="hidden" name="_csrf" value="' . $csrfEsc . '">';

        renderField('db_host', 'Database Host', (string)$defaults['host'], 'localhost', 'text');
        renderField('db_port', 'Port',          (string)$defaults['port'], '3306', 'number');
        renderField('db_name', 'Database Name', (string)$defaults['name'], 'my_database', 'text');
        renderField('db_user', 'Username',      (string)$defaults['user'], 'db_user', 'text');

        echo '<div class="field">';
        echo '<label for="db_password">Password</label>';
        echo '<input type="password" id="db_password" name="db_password" autocomplete="new-password">';
        echo '</div>';

        echo '<div class="form-actions" style="margin-top:.5rem;">';
        echo '<button type="button" class="btn btn-secondary" id="test-btn" data-no-loader onclick="testConnection()">Test Connection</button>';
        echo '<span id="test-result"></span>';
        echo '</div>';

        echo '<div class="form-actions form-actions--between" style="margin-top:1.5rem;">';
        echo '<a href="?step=0" class="btn btn-ghost">← Back</a>';
        echo '<button type="submit" class="btn btn-primary">Continue</button>';
        echo '</div>';
        echo '</form>';
        echo '</div>';

        echo <<<JS
        <script>
        async function testConnection() {
            const btn = document.getElementById('test-btn');
            const res = document.getElementById('test-result');
            btn.disabled = true;
            res.textContent = 'Testing…';
            res.className = 'test-pending';
            try {
                const r = await fetch('?action=test-db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': '{$csrfEsc}' },
                    body: JSON.stringify({
                        host:     document.getElementById('db_host').value,
                        port:     parseInt(document.getElementById('db_port').value, 10),
                        name:     document.getElementById('db_name').value,
                        user:     document.getElementById('db_user').value,
                        password: document.getElementById('db_password').value,
                    }),
                });
                const j = await r.json();
                res.textContent = j.ok ? '✓ Connection successful' : '✗ ' + j.error;
                res.className   = j.ok ? 'test-ok' : 'test-fail';
            } catch (e) {
                res.textContent = '✗ ' + e.message;
                res.className   = 'test-fail';
            } finally {
                btn.disabled = false;
            }
        }
        </script>
        JS;
    });
}

function renderAdmin(): void
{
    $errors = $_SESSION['installer']['errors'] ?? [];
    $form   = $_SESSION['installer']['form'] ?? [];
    $admin  = $_SESSION['installer']['admin'] ?? [];
    $csrf   = Security::getCsrfToken();
    unset($_SESSION['installer']['errors'], $_SESSION['installer']['form']);

    renderLayout('Admin Account', 2, function () use ($errors, $form, $admin, $csrf): void {
        echo '<div class="step-img-wrap"><div class="step-img-circle"><img src="/setup/docs/user.png" alt="" class="step-img"></div></div>';
        echo '<div class="card-body">';
        echo '<h2 class="step-title" style="text-align:center;">Admin Account</h2>';
        echo '<p class="step-desc" style="text-align:center;">Create the administrator account for your blog.</p>';

        renderErrors($errors);

        echo '<form method="POST" action="?step=2">';
        echo '<input type="hidden" name="_csrf" value="' . Security::escape($csrf) . '">';

        renderField('admin_email', 'Email Address', $form['admin_email'] ?? $admin['email'] ?? '', 'admin@example.com', 'email');

        echo '<div class="field">';
        echo '<label for="admin_password">Password <span class="hint">(minimum 8 characters)</span></label>';
        echo '<input type="password" id="admin_password" name="admin_password" autocomplete="new-password" required minlength="8">';
        echo '</div>';

        echo '<div class="field">';
        echo '<label for="admin_confirm">Confirm Password</label>';
        echo '<input type="password" id="admin_confirm" name="admin_confirm" autocomplete="new-password" required minlength="8">';
        echo '</div>';

        echo '<div class="form-actions form-actions--between" style="margin-top:1.5rem;">';
        echo '<a href="?step=1" class="btn btn-ghost">← Back</a>';
        echo '<button type="submit" class="btn btn-primary">Continue</button>';
        echo '</div>';
        echo '</form>';
        echo '</div>';
    });
}

function renderSettings(): void
{
    $errors        = $_SESSION['installer']['errors'] ?? [];
    $form          = $_SESSION['installer']['form'] ?? $_SESSION['installer']['blog'] ?? [];
    $csrf          = Security::getCsrfToken();
    $selectedTheme = $form['theme'] ?? 'default';
    unset($_SESSION['installer']['errors'], $_SESSION['installer']['form']);

    $selectedLocale = $form['locale'] ?? detectInstallerLocale();

    $themes = [
        // White cards on gray-100 background, dark-gray primary button
        'default' => ['label' => 'Default', 'accent' => '#111827', 'accentHover' => '#374151', 'bg' => '#ffffff', 'surface' => '#f3f4f6', 'text' => '#111827', 'muted' => '#6b7280', 'border' => '#e5e7eb'],
        // Pure black & white, sharp edges, no rounded corners
        'minimal' => ['label' => 'Minimal', 'accent' => '#000000', 'accentHover' => '#222222', 'bg' => '#ffffff', 'surface' => '#f5f5f5', 'text' => '#000000', 'muted' => '#666666', 'border' => '#000000'],
        // Zinc-950 background, zinc-900 surface, indigo-600 accent
        'dark'    => ['label' => 'Dark',    'accent' => '#4f46e5', 'accentHover' => '#4338ca', 'bg' => '#09090b', 'surface' => '#18181b', 'text' => '#fafafa', 'muted' => '#a1a1aa', 'border' => '#27272a'],
    ];

    renderLayout('Blog Settings', 3, function () use ($errors, $form, $csrf, $themes, $selectedTheme, $selectedLocale): void {
        echo '<div class="step-img-wrap"><div class="step-img-circle"><img src="/setup/docs/settings.png" alt="" class="step-img"></div></div>';
        echo '<div class="card-body">';
        echo '<h2 class="step-title" style="text-align:center;">Blog Settings</h2>';
        echo '<p class="step-desc" style="text-align:center;">Personalize your blog. You can change these settings later.</p>';

        renderErrors($errors);

        echo '<form method="POST" action="?step=3">';
        echo '<input type="hidden" name="_csrf" value="' . Security::escape($csrf) . '">';

        renderField('blog_name', 'Blog Name', $form['name'] ?? '', 'My Blog', 'text');

        echo '<div class="field">';
        echo '<label for="blog_description">Description <span class="hint">(optional)</span></label>';
        echo '<textarea id="blog_description" name="blog_description" rows="3" placeholder="A short description of your blog...">' . Security::escape($form['description'] ?? '') . '</textarea>';
        echo '</div>';

        echo '<div class="field">';
        echo '<label>Installer Theme <span class="hint">(dashboard style)</span></label> ';
        echo '<div class="theme-grid">';
        foreach ($themes as $value => $theme) {
            $checked   = $value === $selectedTheme ? ' checked' : '';
            $cardClass = 'theme-card' . ($value === $selectedTheme ? ' selected' : '');
            $data      = htmlspecialchars(json_encode($theme, JSON_THROW_ON_ERROR), ENT_QUOTES, 'UTF-8');
            echo '<label class="' . $cardClass . '" data-theme="' . $data . '">';
            echo '<input type="radio" name="blog_theme" value="' . Security::escape($value) . '"' . $checked . ' onchange="applyTheme(this.closest(\'.theme-card\'))">';
            echo '<span class="theme-name">' . Security::escape($theme['label']) . '</span>';
            echo '</label>';
        }
        echo '</div>';
        echo '</div>';

        echo '<div class="field">';
        echo '<label for="app_locale">' . t('settings.language') . ' <span class="hint">(' . t('settings.language_hint') . ')</span></label>';
        echo '<select id="app_locale" name="app_locale" style="width:100%;padding:.5rem .75rem;border:1px solid var(--border);border-radius:var(--radius);font-size:.9rem;color:var(--text);background:var(--bg);font-family:inherit;">';
        $localeOptions = ['en' => 'English', 'es' => 'Español', 'ja' => '日本語'];
        foreach ($localeOptions as $value => $label) {
            $sel = $value === $selectedLocale ? ' selected' : '';
            echo '<option value="' . Security::escape($value) . '"' . $sel . '>' . Security::escape($label) . '</option>';
        }
        echo '</select>';
        echo '</div>';

        echo '<div class="form-actions form-actions--between" style="margin-top:1.5rem;">';
        echo '<a href="?step=2" class="btn btn-ghost">' . t('back') . '</a>';
        echo '<button type="submit" class="btn btn-primary">' . t('continue') . '</button>';
        echo '</div>';
        echo '</form>';
        echo '</div>';

        echo <<<'JS'
        <script>
        function applyTheme(card) {
            // Reset all cards to default state
            document.querySelectorAll('.theme-card').forEach(c => {
                c.classList.remove('selected');
                c.style.removeProperty('background');
                c.style.removeProperty('color');
                c.style.removeProperty('border-color');
            });
            // Apply selected state: fill card with theme accent color
            card.classList.add('selected');
            const t = JSON.parse(card.dataset.theme);
            card.style.background   = t.accent;
            card.style.color        = t.bg;
            card.style.borderColor  = t.accent;
            // Update installer CSS vars
            const s = document.documentElement.style;
            s.setProperty('--accent',       t.accent);
            s.setProperty('--accent-hover', t.accentHover);
            s.setProperty('--bg',           t.bg);
            s.setProperty('--surface',      t.surface);
            s.setProperty('--text',         t.text);
            s.setProperty('--muted',        t.muted);
            s.setProperty('--border',       t.border);
        }
        (function () {
            const saved = document.querySelector('.theme-card.selected');
            if (saved) applyTheme(saved);
        })();
        </script>
        JS;
    });
}

function renderReview(): void
{
    if (($_SESSION['installer']['step'] ?? -1) < 3) {
        redirect('?step=0');
    }

    $db    = $_SESSION['installer']['db']    ?? [];
    $admin = $_SESSION['installer']['admin'] ?? [];
    $blog  = $_SESSION['installer']['blog']  ?? [];
    $csrf  = Security::getCsrfToken();
    $csrfEsc = Security::escape($csrf);

    renderLayout('Review', 4, function () use ($db, $admin, $blog, $csrfEsc): void {
        echo '<div class="card-body">';
        echo '<h2 class="step-title">Ready to Install</h2>';
        echo '<p class="step-desc">Review your settings, then click <strong>Install Corexpress</strong>.</p>';

        echo '<div class="review-section">';
        echo '<h3 class="review-heading">Database</h3>';
        echo '<dl class="review-list">';
        echo '<div class="review-row"><dt>Host</dt><dd>' . Security::escape($db['host'] ?? '') . ':' . (int)($db['port'] ?? 3306) . '</dd></div>';
        echo '<div class="review-row"><dt>Database</dt><dd>' . Security::escape($db['name'] ?? '') . '</dd></div>';
        echo '<div class="review-row"><dt>User</dt><dd>' . Security::escape($db['user'] ?? '') . '</dd></div>';
        echo '</dl></div>';

        echo '<div class="review-section">';
        echo '<h3 class="review-heading">Admin Account</h3>';
        echo '<dl class="review-list">';
        echo '<div class="review-row"><dt>Email</dt><dd>' . Security::escape($admin['email'] ?? '') . '</dd></div>';
        echo '<div class="review-row"><dt>Password</dt><dd>••••••••</dd></div>';
        echo '</dl></div>';

        echo '<div class="review-section">';
        echo '<h3 class="review-heading">Blog</h3>';
        echo '<dl class="review-list">';
        echo '<div class="review-row"><dt>Name</dt><dd>' . Security::escape($blog['name'] ?? '') . '</dd></div>';
        if (!empty($blog['description'])) {
            echo '<div class="review-row"><dt>Description</dt><dd>' . Security::escape($blog['description']) . '</dd></div>';
        }
        echo '<div class="review-row"><dt>Theme</dt><dd>' . Security::escape(ucfirst($blog['theme'] ?? 'default')) . '</dd></div>';
        echo '</dl></div>';

        echo '<div class="form-actions form-actions--between" style="margin-top:1.5rem;">';
        echo '<a href="?step=3" class="btn btn-ghost">← Back</a>';
        echo '<button type="button" class="btn btn-primary" id="install-btn" data-no-loader onclick="startInstall()">Install Corexpress</button>';
        echo '</div>';

        // ── Install overlay (loading → success) ────────────────────────────
        echo '<div id="install-overlay" class="install-overlay" aria-hidden="true">';
        echo '<div class="install-overlay-inner" id="overlay-inner">';
        echo '<div class="overlay-spinner"><img src="/setup/docs/corexpress.png" alt="Corexpress" class="overlay-logo" id="overlay-logo"></div>';
        echo '<p class="overlay-msg" id="overlay-msg">Working on your blog…</p>';
        echo '<p class="overlay-sub" id="overlay-sub">This may take a few seconds.</p>';
        echo '</div>';
        echo '</div>';
        echo '</div>';

        echo <<<JS
        <script>
        async function startInstall() {
            const btn     = document.getElementById('install-btn');
            const overlay = document.getElementById('install-overlay');
            btn.disabled  = true;
            overlay.classList.add('visible');
            overlay.setAttribute('aria-hidden', 'false');

            try {
                const r = await fetch('?action=install', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': '{$csrfEsc}' },
                    body:    '{}',
                });
                const j = await r.json();

                if (j.ok) {
                    document.getElementById('overlay-logo').classList.add('done');
                    document.getElementById('overlay-msg').textContent = 'All done! Corexpress is installed.';
                    document.getElementById('overlay-sub').textContent = 'Sign in to continue with your blog setup.';
                    document.getElementById('overlay-inner').insertAdjacentHTML(
                        'beforeend',
                        '<div class="overlay-check">✓</div>' +
                        '<a href="/cx-admin/login" class="btn btn-primary btn-large" style="margin-top:1.5rem;">Go to Admin Setup →</a>'
                    );
                } else {
                    overlay.classList.remove('visible');
                    btn.disabled = false;
                    alert('Installation failed: ' + j.error);
                }
            } catch (e) {
                overlay.classList.remove('visible');
                btn.disabled = false;
                alert('Request failed: ' + e.message);
            }
        }
        </script>
        JS;
    });
}

function renderAlreadyInstalled(): void
{
    renderLayout('Already Installed', -1, function (): void {
        echo '<div class="card-body" style="text-align:center;">';
        echo '<div class="status-icon status-icon--error">!</div>';
        echo '<h2 class="step-title">Already Installed</h2>';
        echo '<p class="step-desc">Corexpress is already configured on this server.</p>';
        echo '<div class="alert alert-info" style="text-align:left;">To reinstall, remove <code>config.php</code> from the app root and return to this page.</div>';
        echo '<div style="margin-top:1.5rem;">';
        echo '<a href="/cx-admin/login" class="btn btn-primary">Go to Admin →</a>';
        echo '</div>';
        echo '</div>';
    });
}

function renderError(string $title, string $message): void
{
    renderLayout($title, -1, function () use ($title, $message): void {
        echo '<div class="card-body" style="text-align:center;">';
        echo '<div class="status-icon status-icon--error">✗</div>';
        echo '<h2 class="step-title">' . Security::escape($title) . '</h2>';
        echo '<div class="alert alert-error" style="text-align:left;">' . $message . '</div>';
        echo '<div style="margin-top:1.5rem;">';
        echo '<a href="?step=0" class="btn btn-ghost">← Start Over</a>';
        echo '</div>';
        echo '</div>';
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

function renderLayout(string $pageTitle, int $currentStep, callable $body): void
{
    $stepLabels   = ['Database', 'Admin', 'Settings'];
    $showProgress = $currentStep >= 1 && $currentStep <= 4;
    $esc = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    ?>
<!DOCTYPE html>
<html lang="<?= htmlspecialchars(detectInstallerLocale(), ENT_QUOTES, 'UTF-8') ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corexpress Installer — <?= $esc($pageTitle) ?></title>
    <link rel="icon" type="image/png" href="/setup/docs/corexpress.png">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg:           #ffffff;
            --surface:      #f9fafb;
            --border:       #e5e7eb;
            --text:         #111827;
            --muted:        #6b7280;
            --accent:       #000000;
            --accent-hover: #222222;
            --success:      #059669;
            --error:        #dc2626;
            --radius:       8px;
            --shadow:       0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--surface);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem 1rem 3rem;
            font-size: 15px;
            line-height: 1.5;
            transition: background .25s, color .25s;
        }

        /* ── Page loader bar ── */
        .page-loader {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: var(--accent);
            z-index: 200;
            animation: loader-grow 1.5s ease forwards;
        }
        .page-loader.active { display: block; }
        @keyframes loader-grow { from { width: 0 } to { width: 80% } }

        /* ── Header ── */
        .header { text-align: center; margin-bottom: 2rem; }
        .header-logo { height: 40px; width: auto; display: block; margin: 0 auto; }
        .tagline { font-size: .8rem; color: var(--muted); margin-top: .4rem; letter-spacing: .05em; text-transform: uppercase; }

        /* ── Progress bar ── */
        .progress {
            display: flex;
            width: 100%;
            max-width: 540px;
            margin-bottom: 2rem;
        }
        .progress-step {
            display: flex; flex-direction: column; align-items: center;
            flex: 1; position: relative;
        }
        .progress-step:not(:last-child)::after {
            content: ''; position: absolute; top: 14px; left: 50%;
            width: 100%; height: 2px; background: var(--border); z-index: 0;
        }
        .progress-step.done::after { background: var(--accent); }
        .progress-dot {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid var(--border); background: var(--bg);
            display: flex; align-items: center; justify-content: center;
            font-size: .75rem; font-weight: 600; color: var(--muted);
            position: relative; z-index: 1;
            transition: background .2s, border-color .2s, color .2s;
        }
        .progress-step.done .progress-dot   { background: var(--accent); border-color: var(--accent); color: var(--bg); }
        .progress-step.active .progress-dot { border-color: var(--accent); color: var(--accent); }
        .progress-label { font-size: .7rem; color: var(--muted); margin-top: .35rem; text-align: center; }
        .progress-step.active .progress-label { color: var(--accent); font-weight: 600; }
        .progress-step.done   .progress-label { color: var(--text); }

        /* ── Card ── */
        .card {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            width: 100%;
            max-width: 540px;
            overflow: hidden;
            transition: background .25s, border-color .25s;
        }

        .card-body { padding: 2rem 2.5rem; }

        /* ── Step header images ── */
        .step-img-wrap {
            width: 100%; padding: 2rem 0 1.25rem;
            background: var(--surface); border-bottom: 1px solid var(--border);
            display: flex; justify-content: center; align-items: center;
        }
        .step-img-circle {
            width: 96px; height: 96px; border-radius: 50%;
            overflow: hidden; border: 2px solid var(--border);
            background: var(--bg); flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,.08);
        }
        .step-img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }

        /* ── Welcome ── */
        .welcome-body { padding: 2.5rem 2.5rem; }
        .welcome-hero { text-align: center; margin-bottom: 2rem; }
        .welcome-title { font-size: 1.6rem; font-weight: 700; letter-spacing: -.02em; margin-bottom: .5rem; }
        .brand-name    { display: inline-flex; align-items: center; white-space: nowrap; }
        .brand-chevron { font-size: 1.2em; font-weight: 900; }
        .welcome-sub { color: var(--muted); font-size: 1rem; }
        .welcome-form { text-align: center; margin-top: 2rem; margin-bottom: 1.25rem; }

        /* ── Requirements accordion ── */
        .req-accordion { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .req-accordion summary { list-style: none; cursor: pointer; user-select: none; }
        .req-accordion summary::-webkit-details-marker { display: none; }
        .req-badge {
            display: flex; align-items: center; gap: .6rem;
            padding: .75rem 1rem; font-size: .875rem; font-weight: 500;
        }
        .req-badge--ok   { background: #f0fdf4; color: #065f46; }
        .req-badge--warn { background: #fffbeb; color: #92400e; }
        .req-badge-icon  { font-size: 1rem; }
        .req-badge-arrow { margin-left: auto; transition: transform .2s; font-size: 1.1rem; }
        details[open] .req-badge-arrow { transform: rotate(90deg); }
        .checks {
            display: flex; flex-direction: column; gap: .4rem;
            padding: .75rem; border-top: 1px solid var(--border);
        }

        /* ── Requirement rows ── */
        .check-row {
            display: grid; grid-template-columns: 18px 1fr auto; align-items: center;
            gap: .4rem .6rem; padding: .45rem .6rem;
            border-radius: calc(var(--radius) - 2px); border: 1px solid var(--border); font-size: .8rem;
        }
        .check-ok   { background: #f0fdf4; border-color: #bbf7d0; }
        .check-fail { background: #fef2f2; border-color: #fecaca; }
        .check-warn { background: #fffbeb; border-color: #fde68a; }
        .check-icon { font-size: .85rem; font-weight: 700; text-align: center; }
        .check-ok   .check-icon { color: var(--success); }
        .check-fail .check-icon { color: var(--error); }
        .check-warn .check-icon { color: #d97706; }
        .check-label  { font-weight: 500; }
        .check-detail { color: var(--muted); text-align: right; }

        /* ── Typography ── */
        .step-title { font-size: 1.2rem; font-weight: 700; letter-spacing: -.01em; margin-bottom: .4rem; }
        .step-desc  { color: var(--muted); font-size: .9rem; margin-bottom: 1.5rem; }

        /* ── Form fields ── */
        .field { margin-bottom: 1.1rem; }
        .field label { display: block; font-size: .875rem; font-weight: 500; margin-bottom: .35rem; }
        .hint { font-weight: 400; color: var(--muted); }
        .field input[type="text"],
        .field input[type="email"],
        .field input[type="password"],
        .field input[type="number"],
        .field textarea {
            width: 100%; padding: .5rem .75rem;
            border: 1px solid var(--border); border-radius: var(--radius);
            font-size: .9rem; color: var(--text); background: var(--bg);
            transition: border-color .15s, box-shadow .15s; font-family: inherit;
        }
        .field input:focus, .field textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
        }
        .field textarea { resize: vertical; }

        /* ── Buttons ── */
        .btn {
            display: inline-flex; align-items: center; justify-content: center;
            padding: .55rem 1.3rem; border-radius: var(--radius);
            font-size: .9rem; font-weight: 500; cursor: pointer;
            border: 1px solid transparent; text-decoration: none;
            transition: background .15s, color .15s, border-color .15s; font-family: inherit;
        }
        .btn:disabled { opacity: .5; cursor: not-allowed; }
        .btn-primary   { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .btn-primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
        .btn-secondary { background: var(--bg); border-color: var(--border); color: var(--text); }
        .btn-secondary:hover:not(:disabled) { background: var(--surface); }
        .btn-ghost     { background: transparent; color: var(--muted); }
        .btn-ghost:hover:not(:disabled) { color: var(--text); }
        .btn-large { padding: .75rem 2rem; font-size: 1rem; }

        .form-actions { display: flex; align-items: center; gap: .75rem; margin-top: .75rem; }
        .form-actions--between { justify-content: space-between; }

        /* ── Test connection ── */
        #test-result { font-size: .875rem; font-weight: 500; }
        .test-ok      { color: var(--success); }
        .test-fail    { color: var(--error); }
        .test-pending { color: var(--muted); }

        /* ── Alerts ── */
        .alert { padding: .7rem 1rem; border-radius: var(--radius); font-size: .875rem; margin-bottom: 1.1rem; }
        .alert ul { padding-left: 1.25rem; margin-top: .25rem; }
        .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .alert-info  { background: #f0fdf4; border: 1px solid #bbf7d0; color: #065f46; }
        .alert code  { background: rgba(0,0,0,.07); padding: .1em .3em; border-radius: 4px; font-size: .85em; }

        /* ── Theme grid ── */
        .theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; }
        .theme-card {
            display: flex; flex-direction: column; align-items: center; gap: .5rem;
            padding: .9rem .75rem; border: 2px solid var(--border); border-radius: var(--radius);
            cursor: pointer; transition: background .2s, color .2s, border-color .2s;
            text-align: center;
        }
        .theme-card input[type="radio"] { position: absolute; opacity: 0; pointer-events: none; }
        .theme-swatch {
            width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
            border: 3px solid rgba(0,0,0,.12);
            box-shadow: 0 1px 4px rgba(0,0,0,.2), inset 0 1px 2px rgba(255,255,255,.25);
        }
        .theme-name { font-size: .8rem; font-weight: 600; }

        /* ── Review ── */
        .review-section { margin-bottom: 1.25rem; }
        .review-heading { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: .5rem; }
        .review-list { display: flex; flex-direction: column; gap: .2rem; }
        .review-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; font-size: .875rem; padding: .3rem .5rem; border-radius: 4px; }
        .review-row:nth-child(odd) { background: var(--surface); }
        .review-row dt { color: var(--muted); font-weight: 500; white-space: nowrap; }
        .review-row dd { text-align: right; word-break: break-all; }

        /* ── Status icons (already installed / error) ── */
        .status-icon { font-size: 2.5rem; margin-bottom: .75rem; }
        .status-icon--error { color: var(--error); }

        /* ── Install overlay ── */
        .install-overlay {
            display: none; position: fixed; inset: 0;
            background: var(--bg); z-index: 100;
            align-items: center; justify-content: center;
        }
        .install-overlay.visible { display: flex; }
        .install-overlay-inner {
            display: flex; flex-direction: column; align-items: center;
            gap: 1rem; text-align: center; padding: 2rem; max-width: 360px;
        }
        .overlay-spinner { width: 80px; height: 80px; }
        .overlay-logo {
            width: 80px; height: 80px; object-fit: contain;
            animation: spin 1.5s linear infinite;
        }
        .overlay-logo.done { animation: none; opacity: .4; }
        .overlay-msg   { font-size: 1.2rem; font-weight: 600; }
        .overlay-sub   { color: var(--muted); font-size: .9rem; }
        .overlay-check { font-size: 3rem; color: var(--success); line-height: 1; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Step submit spinner ── */
        .btn-spinner {
            width: 34px; height: 34px; border-radius: 50%;
            border: 3px solid var(--border);
            border-top-color: var(--accent);
            animation: spin .65s linear infinite;
            flex-shrink: 0;
        }

        /* ── Footer ── */
        .footer { margin-top: 2rem; font-size: .78rem; color: var(--muted); text-align: center; }
    </style>
</head>
<body>

<div class="page-loader" id="page-loader"></div>

<header class="header">
    <img src="/setup/docs/corexpress.png" alt="Corexpress" class="header-logo">
    <div class="tagline">Web Installer</div>
</header>

<?php if ($showProgress): ?>
<nav class="progress" aria-label="Installation steps">
    <?php foreach ($stepLabels as $i => $label):
        $n     = $i + 1;
        $class = $n < $currentStep ? 'done' : ($n === $currentStep ? 'active' : '');
        $dot   = $n < $currentStep ? '✓' : (string)$n;
    ?>
    <div class="progress-step <?= $class ?>" aria-current="<?= $n === $currentStep ? 'step' : 'false' ?>">
        <div class="progress-dot"><?= $dot ?></div>
        <div class="progress-label"><?= $esc($label) ?></div>
    </div>
    <?php endforeach; ?>
</nav>
<?php endif; ?>

<main class="card">
    <?php $body(); ?>
</main>

<footer class="footer">
    Corexpress — Open source blog platform for any shared hosting provider
</footer>

<script>
(function () {
    // ── Page transition loader ────────────────────────────────────────────────
    const loader = document.getElementById('page-loader');
    document.addEventListener('click', function (e) {
        const a = e.target.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) return;
        if (loader) loader.classList.add('active');
    });

    // ── Submit spinner — disable + hide Continue btn, show spinner ────────────
    document.addEventListener('submit', function (e) {
        if (loader) loader.classList.add('active');
        const form = e.target;
        const btn  = form.querySelector('button[type="submit"]');
        if (!btn) return;
        // Disable prevents double-submission if user clicks again before redirect
        btn.disabled = true;
        btn.style.display = 'none';
        const spinner = document.createElement('div');
        spinner.className = 'btn-spinner';
        btn.parentNode.insertBefore(spinner, btn.nextSibling);
    });
})();
</script>

</body>
</html>
    <?php
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function renderField(string $id, string $label, string $value, string $placeholder, string $type): void
{
    $esc = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    echo '<div class="field">';
    echo '<label for="' . $esc($id) . '">' . $esc($label) . '</label>';
    echo '<input type="' . $esc($type) . '" id="' . $esc($id) . '" name="' . $esc($id) . '"';
    echo ' value="' . $esc($value) . '" placeholder="' . $esc($placeholder) . '"';
    if ($type === 'email')  echo ' autocomplete="email"';
    if ($type === 'number') echo ' min="1" max="65535"';
    echo '>';
    echo '</div>';
}

function renderErrors(array $errors): void
{
    if (empty($errors)) {
        return;
    }
    echo '<div class="alert alert-error"><strong>' . t('errors.fix_following') . '</strong><ul>';
    foreach ($errors as $error) {
        echo '<li>' . Security::escape($error) . '</li>';
    }
    echo '</ul></div>';
}

function advanceStep(int $completedStep): void
{
    // Do NOT call session_regenerate_id(true) here — it deletes the old session
    // file immediately, which causes any concurrent request (double-click, browser
    // prefetch, stale tab) still carrying the old cookie to get an empty session
    // with no CSRF token, resulting in a false "Invalid CSRF token" error.
    // The rotating CSRF token (regenerated on every page render) is sufficient
    // protection for a single-admin, self-destructing installer.
    if (($current = $_SESSION['installer']['step'] ?? -1) < $completedStep) {
        $_SESSION['installer']['step'] = $completedStep;
    }
}

function redirect(string $url): never
{
    // Write the session to disk BEFORE sending the Location header so the
    // next request always finds the updated session (CSRF token, step counter).
    session_write_close();
    header('Location: ' . $url);
    exit;
}

function detectDomain(): string
{
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $scheme . '://' . $host;
}

function writeConfig(array $db, array $blog, string $sessionKey, string $domain): void
{
    $lines = [
        '<?php',
        '// config.php — generated by the Corexpress installer. Do not edit manually.',
        'return [',
        "    'db' => [",
        "        'host'     => " . var_export($db['host'],     true) . ',',
        "        'port'     => " . (int)$db['port']                  . ',',
        "        'name'     => " . var_export($db['name'],     true) . ',',
        "        'user'     => " . var_export($db['user'],     true) . ',',
        "        'password' => " . var_export($db['password'], true) . ',',
        '    ],',
        "    'app' => [",
        "        'domain'      => " . var_export($domain,     true) . ',',
        "        'session_key' => " . var_export($sessionKey, true) . ',',
        '    ],',
        "    'blog' => [",
        "        'name'        => " . var_export($blog['name'],        true) . ',',
        "        'description' => " . var_export($blog['description'], true) . ',',
        "        'theme'       => " . var_export($blog['theme'],       true) . ',',
        '    ],',
        '];',
        '',
    ];

    if (file_put_contents(CONFIG_PATH, implode("\n", $lines)) === false) {
        throw new \RuntimeException(
            'Could not write config.php to ' . CONFIG_PATH . '. Check file permissions.'
        );
    }
}
