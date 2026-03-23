# ─────────────────────────────────────────────────────────────────────────────
# Corexpress — Development Environment
# Simulates Hostinger shared hosting: PHP 8.3 + Apache + MySQL client
#
# What is pre-installed (mirrors Hostinger shared hosting):
#   - PHP 8.3 with common extensions (pdo, pdo_mysql, mbstring, json, etc.)
#   - Apache 2.4 with mod_rewrite
#   - Composer (available via SSH on most Hostinger plans)
#   - curl, wget, unzip (standard shared hosting tools)
#   - MySQL client (for CLI access — DB itself runs in a separate service)
#
# What is NOT available (unlike VPS):
#   - Node.js / npm
#   - Root access / sudo
#   - systemctl / PM2 / Nginx / certbot
#
# Usage:
#   podman compose -f compose.dev.yml up -d
#   Visit http://localhost:80
# ─────────────────────────────────────────────────────────────────────────────

FROM php:8.3-apache

LABEL description="Corexpress dev environment — Hostinger shared hosting simulation"
LABEL maintainer="corexpress"

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV APACHE_DOCUMENT_ROOT=/var/www/html

# ── System tools + build dependencies for PHP extensions ─────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    zip \
    git \
    default-mysql-client \
    libonig-dev \
    && rm -rf /var/lib/apt/lists/*

# ── PHP extensions common on Hostinger shared hosting ────────────────────────
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    mbstring \
    opcache

# ── Apache: enable mod_rewrite (required for Slim 4 routing) ─────────────────
RUN a2enmod rewrite

# ── Configure Apache DocumentRoot to packages/app/public ─────────────────────
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf \
    /etc/apache2/sites-available/default-ssl.conf

# Allow .htaccess overrides (needed for Slim 4 front-controller pattern)
RUN sed -ri -e 's!AllowOverride None!AllowOverride All!g' \
    /etc/apache2/apache2.conf

# ── Composer (available via SSH on Hostinger Business+) ───────────────────────
RUN curl -sS https://getcomposer.org/installer \
    | php -- --install-dir=/usr/local/bin --filename=composer

# ── Working directory (maps to packages/app/ via volume) ─────────────────────
WORKDIR /var/www/html

# ── PHP configuration ─────────────────────────────────────────────────────────
RUN echo "error_reporting = E_ALL" >> /usr/local/etc/php/php.ini && \
    echo "display_errors = On" >> /usr/local/etc/php/php.ini && \
    echo "log_errors = On" >> /usr/local/etc/php/php.ini && \
    echo "date.timezone = UTC" >> /usr/local/etc/php/php.ini && \
    echo "upload_max_filesize = 20M" >> /usr/local/etc/php/php.ini && \
    echo "post_max_size = 22M" >> /usr/local/etc/php/php.ini && \
    echo "memory_limit = 128M" >> /usr/local/etc/php/php.ini

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
