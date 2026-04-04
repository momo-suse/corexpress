# Corexpress

[![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/) [![Slim](https://img.shields.io/badge/Slim-4-74a045?style=for-the-badge&logo=slim&logoColor=white)](https://www.slimframework.com/) [![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![Apache](https://img.shields.io/badge/Apache-Shared_Hosting-D22128?style=for-the-badge&logo=apache&logoColor=white)](https://httpd.apache.org/)


## Overview

Corexpress is a monorepo for a personal blog platform designed for Hostinger-style shared hosting.
It combines:

- a PHP 8.3 + Slim 4 backend API
- a React 19 + Vite frontend
- a web installer under `/setup`
- an admin panel under `/cx-admin`
- a public blog with configurable layouts and sections

The production target is shared hosting with Apache + MySQL. Node.js is used for local frontend development and build time, not as a runtime dependency on the production server.

## What Exists Today

### Installer

- Browser-based setup flow available at `/setup`
- Admin setup flow available at `/cx-admin/setup`
- Installer source lives in `packages/installer`
- Optional SSH bootstrap via `install.sh`

### Admin Area

Current admin sections in the repo:

- Dashboard
- Blog
- Comments
- Styles
- Subscribers
- Resources
- Settings
- Setup
- Login / reset password

### Public Site

Current public routes in the repo:

- `/` blog home
- `/post/:slug` single post view
- `/about`
- subscriber flow pages for welcome, unsubscribe, and error states

### Product Capabilities Present in Code

- Post CRUD
- Post translations
- Comment moderation
- Blog settings management
- Admin theme switching
- Blog style collections
- Subscriber management and Google subscriber auth flow
- Image upload, replacement, deletion, usage tracking, and download from admin
- In-app update check/apply endpoints
- CSRF-protected admin mutations
- Session-based authentication

## Monorepo Structure

```text
.
├── packages/
│   ├── app/         # PHP backend API, public assets, tests
│   ├── installer/   # Web installer and migrations
│   └── web/         # React admin + public frontend
├── compose.dev.yml  # Local shared-hosting simulation
├── Dockerfile
├── install.sh       # SSH installer for release ZIPs
├── update.sh
└── VERSION
```

## Tech Stack

### Backend

- PHP 8.3
- Slim 4
- Eloquent ORM (`illuminate/database`)
- PHPUnit for backend tests

### Frontend

- React 19
- Vite 6
- TypeScript
- React Router 7
- TanStack Query
- Zustand
- Tailwind CSS
- Radix UI primitives
- Tiptap editor
- Vitest for frontend tests

### Infrastructure Target

- Apache
- MySQL 8.0
- Hostinger-style shared hosting

## Requirements

### Production / Shared Hosting

- PHP 8.3
- MySQL 8.0
- Apache with rewrite support
- ability to upload the release package or use SSH

### Local Development

- Node.js 20+
- npm 10+
- Composer
- Docker or Podman

## Installation

### Option A: SSH Installer

```bash
curl -fsSL https://raw.githubusercontent.com/momo-suse/corexpress/main/install.sh | bash
```

What the script does:

1. Checks for PHP, unzip, and curl/wget.
2. Downloads the latest GitHub release ZIP.
3. Extracts the files into the current directory.
4. Tells you to complete setup in the browser.

Then open:

```text
https://your-domain.com/setup
```

### Option B: Manual Release Install

1. Download the latest release ZIP from GitHub Releases.
2. Upload it to your hosting directory.
3. Extract the archive.
4. Open `/setup` in the browser.

## Local Development

Corexpress includes a local environment that simulates shared hosting with Apache + PHP + MySQL.

### Start with Podman

```bash
npm run podman:up
```

### Start with Docker

```bash
npm run docker:up
```

The app is exposed at:

```text
http://localhost:8080
```

### Install Dependencies

Backend:

```bash
cd packages/app
composer install
```

Frontend:

```bash
cd packages/web
npm install
```

### Frontend Development

From the repo root:

```bash
npm run frontend:dev
```

Or directly:

```bash
cd packages/web
npm run dev
```

### Frontend Build

From the repo root:

```bash
npm run frontend:build
```

Or directly:

```bash
cd packages/web
npm run build
```

## Testing

### Frontend

```bash
npm run test:web
```

or:

```bash
cd packages/web
npm run test
```

### Backend

Directly with Composer:

```bash
cd packages/app
composer test
```

Container helpers also exist in the root `package.json`:

```bash
npm run test:php
npm run test:php:coverage
npm run test:php:podman
```

## Important Notes

- Production does not require Node.js as a runtime dependency.
- The installer is part of the repo in `packages/installer`; it is not just documentation.
- The admin and public site are served from the same project, but they are separate route areas.
- The current repo includes an image resources manager in the admin panel.
- The current repo includes update endpoints and scripts, so updating is part of the product surface.

## Useful Paths

- `packages/app/src/Routes/api.php` — backend API routes
- `packages/web/src/App.tsx` — frontend routes
- `packages/installer` — installer source
- `compose.dev.yml` — local development stack
- `install.sh` — release installer

