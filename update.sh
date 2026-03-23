#!/usr/bin/env bash
# Corexpress — SSH update script
#
# Usage (from your installation root):
#   bash update.sh
#   bash update.sh --force   # re-apply even if already on the latest version
#
# What it does:
#   1. Reads the current version from the VERSION file
#   2. Fetches the latest release from GitHub
#   3. Compares versions and asks for confirmation
#   4. Backs up config.php and uploaded images
#   5. Downloads and extracts the new release
#   6. Restores config.php and images
#   7. Runs database migrations

set -euo pipefail

REPO="momo-suse/corexpress"
RELEASE_API="https://api.github.com/repos/${REPO}/releases/latest"
ARCHIVE="corexpress-update.zip"

# -- Colors --
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✓${RESET} $*"; }
info() { echo -e "${CYAN}→${RESET} $*"; }
warn() { echo -e "${YELLOW}!${RESET} $*"; }
fail() { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

# -- Banner --
echo ""
echo -e "${BOLD}  Corexpress Updater${RESET}"
echo -e "  ${CYAN}https://github.com/${REPO}${RESET}"
echo ""

# ── 1. Validate installation directory ────────────────────────────────────────
INSTALL_DIR="$(pwd)"

if [ ! -f "${INSTALL_DIR}/VERSION" ]; then
    fail "VERSION file not found. Run this script from your Corexpress installation root."
fi

if [ ! -f "${INSTALL_DIR}/packages/app/config.php" ]; then
    fail "config.php not found. This does not look like a Corexpress installation."
fi

# ── 2. Read current version ───────────────────────────────────────────────────
CURRENT_VERSION=$(tr -d '[:space:]' < "${INSTALL_DIR}/VERSION")
info "Current version: ${BOLD}${CURRENT_VERSION}${RESET}"

# ── 3. Check requirements ─────────────────────────────────────────────────────
command -v php   >/dev/null 2>&1 || fail "PHP CLI is not available."
command -v unzip >/dev/null 2>&1 || fail "'unzip' is not available."

if command -v curl >/dev/null 2>&1; then
    DOWNLOADER="curl"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOADER="wget"
else
    fail "Neither 'curl' nor 'wget' is available."
fi

# ── 4. Fetch latest release from GitHub API (single request) ─────────────────
info "Fetching latest release from GitHub..."

if [ "$DOWNLOADER" = "curl" ]; then
    API_RESPONSE=$(curl -fsSL "$RELEASE_API")
else
    API_RESPONSE=$(wget -qO- "$RELEASE_API")
fi

LATEST_TAG=$(echo "$API_RESPONSE" | grep '"tag_name"' | cut -d'"' -f4)
DOWNLOAD_URL=$(echo "$API_RESPONSE" | grep '"browser_download_url"' | grep '\.zip' | cut -d'"' -f4)

[ -z "$LATEST_TAG"    ] && fail "Could not fetch the latest release. Check your internet connection."
[ -z "$DOWNLOAD_URL"  ] && fail "Could not find a ZIP asset in the latest release."

# Strip leading 'v' from tag to compare with VERSION file content
LATEST_VERSION="${LATEST_TAG#v}"

ok "Latest release: ${BOLD}${LATEST_TAG}${RESET}"

# ── 5. Version comparison ─────────────────────────────────────────────────────
if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
    warn "You are already running version ${CURRENT_VERSION}."
    if [[ "${1:-}" != "--force" ]]; then
        echo ""
        echo -e "  Use ${CYAN}bash update.sh --force${RESET} to re-apply anyway."
        echo ""
        exit 0
    fi
    warn "Continuing because --force was specified."
fi

# ── 6. Confirm ────────────────────────────────────────────────────────────────
echo ""
echo -e "  This will update ${BOLD}${CURRENT_VERSION}${RESET} → ${BOLD}${LATEST_VERSION}${RESET}"
echo -e "  ${YELLOW}Your posts, comments, and settings will not be affected.${RESET}"
echo ""
echo -n "  Continue? [y/N] "
read -r CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Update cancelled."
    exit 0
fi
echo ""

# ── 7. Safety trap: restore backup if anything fails ─────────────────────────
TMPDIR_BACKUP=""

cleanup() {
    local exit_code=$?
    if [ -d "${TMPDIR_BACKUP}" ]; then
        warn "Update did not complete cleanly (exit code: ${exit_code})."
        warn "Your config.php backup is at: ${TMPDIR_BACKUP}/config.php"
        warn "Restore manually: cp \"${TMPDIR_BACKUP}/config.php\" \"${INSTALL_DIR}/packages/app/config.php\""
        if [ -d "${TMPDIR_BACKUP}/img" ]; then
            warn "Image backup at: ${TMPDIR_BACKUP}/img/"
        fi
    fi
    # Remove the partially-downloaded archive if it exists
    [ -f "${INSTALL_DIR}/${ARCHIVE}" ] && rm -f "${INSTALL_DIR}/${ARCHIVE}"
}
trap cleanup EXIT

# ── 8. Preserve config.php and uploaded images ────────────────────────────────
TMPDIR_BACKUP=$(mktemp -d /tmp/corexpress-update-XXXXXX)
info "Backing up config.php and images..."

cp "${INSTALL_DIR}/packages/app/config.php" "${TMPDIR_BACKUP}/config.php"

if [ -d "${INSTALL_DIR}/packages/app/public/img" ]; then
    cp -r "${INSTALL_DIR}/packages/app/public/img" "${TMPDIR_BACKUP}/img"
fi

ok "Backup stored in ${TMPDIR_BACKUP}"

# ── 9. Download new release ZIP ───────────────────────────────────────────────
info "Downloading ${LATEST_TAG}..."

if [ "$DOWNLOADER" = "curl" ]; then
    curl -fsSL -o "${INSTALL_DIR}/${ARCHIVE}" "$DOWNLOAD_URL"
else
    wget -q -O "${INSTALL_DIR}/${ARCHIVE}" "$DOWNLOAD_URL"
fi

ok "Downloaded ${ARCHIVE}"

# ── 10. Sanity check: verify this looks like a Corexpress release ─────────────
if ! unzip -l "${INSTALL_DIR}/${ARCHIVE}" | grep -q "packages/app/"; then
    rm -f "${INSTALL_DIR}/${ARCHIVE}"
    fail "The downloaded ZIP does not look like a valid Corexpress release."
fi

# ── 11. Extract ZIP (overwrite existing files) ────────────────────────────────
info "Extracting files..."
cd "${INSTALL_DIR}"
unzip -q -o "${ARCHIVE}"
rm -f "${ARCHIVE}"
ok "Files extracted."

# ── 12. Restore config.php and uploaded images ────────────────────────────────
info "Restoring config.php and images..."

cp "${TMPDIR_BACKUP}/config.php" "${INSTALL_DIR}/packages/app/config.php"

if [ -d "${TMPDIR_BACKUP}/img" ]; then
    mkdir -p "${INSTALL_DIR}/packages/app/public/img"
    cp -r "${TMPDIR_BACKUP}/img/." "${INSTALL_DIR}/packages/app/public/img/"
fi

# Clean backup directory (disables the trap warning on clean exit)
rm -rf "${TMPDIR_BACKUP}"
TMPDIR_BACKUP=""

ok "config.php and images restored."

# ── 13. Run database migrations ───────────────────────────────────────────────
info "Running database migrations..."
php "${INSTALL_DIR}/packages/installer/migrate.php"

# ── 14. Success ───────────────────────────────────────────────────────────────
DOMAIN=$(pwd | grep -oP 'domains/\K[^/]+' 2>/dev/null || true)
if [ -z "$DOMAIN" ]; then
    DOMAIN="yourdomain.com"
fi

echo ""
echo -e "${GREEN}${BOLD}  Corexpress updated to ${LATEST_VERSION} successfully!${RESET}"
echo ""
echo -e "  Visit ${CYAN}https://${DOMAIN}/cx-admin${RESET} to verify."
echo ""
