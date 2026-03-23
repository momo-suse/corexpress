# 🚀 Corexpress

**Corexpress** is an open-source personal blog platform designed specifically to run on **Hostinger (Shared Hosting)**. It provides a modern experience with selectable themes, configurable views, and a visual administration interface, all with an installation process as simple as WordPress.

---

## ✨ Key Features

- **Web Installer:** Step-by-step browser-based configuration (WordPress style).
- **Admin Dashboard:** Modern visual interface for managing posts, comments, and site settings.
- **Dual Theme System:**
  - *Dashboard Theme:* Customize the administration interface (Light, Dark, Minimal).
  - *Blog Style:* Semantic and configurable style collections for the public view.
- **Modular Components:** Show or hide blog sections (hero, profile, post list, comment form) according to your needs.
- **Built-in Security:** Protection against CSRF, rate limiting, secure passwords (Argon2id), and SQL injection prevention (PDO) by default.
- **Shared Hosting Oriented:** Does not require a Node.js environment, VPS, or root access on the production server.

---

## 📋 System Requirements

To install Corexpress, you need a hosting environment (like Hostinger) that meets the following criteria:

- **PHP:** 8.3.x (pre-installed)
- **Web Server:** Apache with `mod_rewrite` enabled
- **Database:** MySQL 8.0
- **TLS/SSL:** Managed by the hosting provider (e.g., AutoSSL, cPanel, hPanel)

### Pre-installation Requirements
1. An active shared hosting account.
2. A configured domain pointing to your hosting.
3. An empty MySQL database created from your control panel.

---

## 🚀 Installation

You have two options for installing Corexpress on your server:

### Option A: Quick SSH Installation (Recommended)
If your hosting plan includes SSH access (e.g., Business plans and above), run the following command in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/user/corexpress/main/install.sh | bash
```
The script will download the latest version, extract it, and prepare the files. Once it finishes, visit `https://yourdomain.com/setup` in your browser.

### Option B: Manual Installation
1. Download the latest `corexpress.zip` file from the [Releases](../../releases) tab on GitHub.
2. Upload and extract the ZIP file into your hosting's public directory (usually `public_html`) using FTP or your panel's File Manager.
3. Visit `https://yourdomain.com/setup` in your browser.

### Browser Setup Wizard (`/setup`)
The web installer will guide you step by step:
1. Requirements check (PHP version, Apache rewrite, write permissions).
2. Database connection.
3. Administrator account creation.
4. Blog settings (Name, description, admin dashboard theme).
5. Installation (Database table creation).

> **Note:** For security reasons, the `/setup` route will self-destruct once the installation is successful.

---

## 🛠️ Technology Stack

Corexpress is structured as a monorepo, combining modern methodologies while remaining fully compatible with traditional infrastructure:

- **Backend Architecture:** PHP 8.3 + [Slim 4 Framework](https://www.slimframework.com/) for the API.
- **Frontend Architecture:** React 19 + Vite (The UI is pre-built and deployed as static assets).
- **Database / ORM:** MySQL 8.0 managed via Eloquent ORM (Standalone).
- **Authentication:** Native PHP sessions + CSRF protecting the REST API.

---

## 💻 Development Environment

If you'd like to contribute or modify Corexpress, the development environment simulates a shared hosting setup using containers via Podman/Docker Compose.

### Developer Quick Start

```bash
# 1. Start services (Apache/PHP 8.3 + MySQL)
podman compose -f compose.dev.yml up -d

# 2. Install backend dependencies
cd packages/app
composer install

# 3. Start frontend development environment
cd ../web
npm install
npm run dev
```

> Node.js is strictly used for the development environment. Upon creating a release, the frontend code is compiled using Vite and stored in the backend's public folder (`packages/app/public/assets`).
