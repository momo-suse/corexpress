#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
# Corexpress dev container entrypoint
# Waits for MySQL, installs Composer dependencies if needed,
# then starts Apache.
# ─────────────────────────────────────────────────────────────────────────────

# ── Wait for MySQL to be reachable (TCP check — avoids SSL client issues) ─────
echo "→ Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
until bash -c "echo > /dev/tcp/${DB_HOST}/${DB_PORT}" 2>/dev/null; do
  sleep 2
done
echo "✓ MySQL is ready."

# ── Install Composer dependencies if vendor/ is missing ───────────────────────
if [ -f "/var/www/html/packages/app/composer.json" ] && [ ! -d "/var/www/html/packages/app/vendor" ]; then
  echo "→ Installing Composer dependencies..."
  cd /var/www/html/packages/app && composer install --no-interaction --prefer-dist --optimize-autoloader
  echo "✓ Composer dependencies installed."
fi

# ── Allow www-data to write to packages/app/ (installer writes config.php) ───
# The entrypoint runs as root, so we can set permissions before Apache starts.
# This mirrors Hostinger shared hosting where the web user owns the files.
chmod o+w /var/www/html/packages/app

# ── Welcome message ───────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Corexpress — Dev Environment (Hostinger Shared Hosting Sim)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  PHP:        $(php --version | head -1)"
echo "  Apache:     $(apache2 -v 2>&1 | head -1)"
echo "  Composer:   $(composer --version 2>/dev/null | head -1)"
echo ""
echo "  DB Host:    ${DB_HOST}:${DB_PORT}"
echo "  DB Name:    ${DB_NAME}"
echo "  DB User:    ${DB_USER}"
echo ""
echo "  Blog:       http://localhost"
echo "  Installer:  http://localhost/setup"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Hand off to CMD (apache2-foreground) ──────────────────────────────────────
exec "$@"