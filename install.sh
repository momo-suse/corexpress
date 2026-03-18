#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Corexpress — One-liner installer for Hostinger shared hosting (SSH)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/USER/corexpress/main/install.sh | bash
#
# What it does:
#   1. Checks requirements (curl/wget, unzip, PHP)
#   2. Downloads the latest release ZIP from GitHub
#   3. Extracts files into the current directory
#   4. Tells the user to visit /setup to complete installation
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO="momo-suse/corexpress"
RELEASE_URL="https://api.github.com/repos/${REPO}/releases/latest"
ARCHIVE="corexpress.zip"

# ── Colors ────────────────────────────────────────────────────────────────────
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

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  Corexpress Installer${RESET}"
echo -e "  ${CYAN}https://github.com/${REPO}${RESET}"
echo ""

# ── Requirement checks ────────────────────────────────────────────────────────
info "Checking requirements..."

command -v php  >/dev/null 2>&1 || fail "PHP is not available. This installer requires a Hostinger shared hosting account."
command -v unzip >/dev/null 2>&1 || fail "'unzip' is not available. Please contact Hostinger support."

if command -v curl >/dev/null 2>&1; then
    DOWNLOADER="curl"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOADER="wget"
else
    fail "Neither 'curl' nor 'wget' is available."
fi

ok "Requirements met (PHP $(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;'), ${DOWNLOADER})"

# ── Fetch latest release tag ──────────────────────────────────────────────────
info "Fetching latest release from GitHub..."

if [ "$DOWNLOADER" = "curl" ]; then
    LATEST_TAG=$(curl -fsSL "$RELEASE_URL" | grep '"tag_name"' | cut -d'"' -f4)
    DOWNLOAD_URL=$(curl -fsSL "$RELEASE_URL" | grep '"browser_download_url"' | grep '\.zip' | cut -d'"' -f4)
else
    LATEST_TAG=$(wget -qO- "$RELEASE_URL" | grep '"tag_name"' | cut -d'"' -f4)
    DOWNLOAD_URL=$(wget -qO- "$RELEASE_URL" | grep '"browser_download_url"' | grep '\.zip' | cut -d'"' -f4)
fi

[ -z "$LATEST_TAG" ] && fail "Could not fetch the latest release. Check your internet connection."

ok "Latest release: ${LATEST_TAG}"

# ── Download ──────────────────────────────────────────────────────────────────
info "Downloading ${ARCHIVE}..."

if [ "$DOWNLOADER" = "curl" ]; then
    curl -fsSL -o "$ARCHIVE" "$DOWNLOAD_URL"
else
    wget -q -O "$ARCHIVE" "$DOWNLOAD_URL"
fi

ok "Downloaded ${ARCHIVE}"

# ── Extract ───────────────────────────────────────────────────────────────────
info "Extracting files..."
unzip -q "$ARCHIVE"
rm "$ARCHIVE"
ok "Files extracted."

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  Corexpress ${LATEST_TAG} downloaded successfully!${RESET}"
echo ""
echo -e "  Next step: open your browser and visit:"
echo -e "  ${CYAN}https://yourdomain.com/setup${RESET}"
echo ""
echo -e "  The web installer will guide you through the rest."
echo ""