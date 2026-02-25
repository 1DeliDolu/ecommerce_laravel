# Ecommerce Starter (Laravel + Inertia)

This project is an ecommerce starter built with Laravel 12 and Inertia React.  
It includes storefront flows, cart/checkout, customer account pages, and an admin panel in a single codebase.

## Features

- Product listing and product detail pages with category/brand/model/price filters
- Cart and stock-aware checkout flow
- Customer area:
  - Order history
  - Address management
  - Payment method management
- Admin area:
  - Category CRUD
  - Product CRUD
  - Order listing/detail/status updates
  - Product image trash management (restore / force delete)
  - Analytics endpoints and dashboard metrics
- Authentication via Fortify:
  - Register / Login / Logout
  - Password reset
  - Email verification
  - Two-factor authentication (2FA)
- Customer tier model (bronze/silver/gold/platinum) with pricing service support

## Stack

- PHP 8.4
- Laravel 12
- Inertia.js v2 (`@inertiajs/react`)
- React 19 + TypeScript
- Tailwind CSS 4
- Laravel Fortify
- Laravel Wayfinder
- PHPUnit 11

## Requirements

- PHP 8.2+
- Composer
- Node.js 20+ and npm
- Database:
  - `sqlite` for quick local setup
  - or `mysql`

## Quick Start

### 1) Install dependencies

```bash
composer install
npm install
```

### 2) Prepare environment

```bash
cp .env.example .env
php artisan key:generate
```

### 3) Configure database

For SQLite:

```bash
touch database/database.sqlite
```

In `.env`:

```env
DB_CONNECTION=sqlite
```

If you use MySQL, configure `DB_*` values for your environment.

### 4) Set admin email(s) (optional but recommended)

In `.env`:

```env
ADMIN_EMAILS=admin@example.com
```

The seeder creates an admin user for this email:

- Email: `admin@example.com`
- Password: `password`

### 5) Run migrations and seeders

```bash
php artisan migrate:fresh --seed
```

### 6) Start the app

Single command (recommended):

```bash
composer run dev
```

This runs the following concurrently:

- `php artisan serve`
- `php artisan queue:listen`
- `php artisan pail`
- `npm run dev`

Default app URL: `http://localhost:8000`

### 7) Use MailHog for local order emails (recommended)

Run MailHog (Docker):

```bash
docker run --rm -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Set mail config in `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
```

Then clear cached config (if needed):

```bash
php artisan config:clear
```

MailHog UI: `http://localhost:8025`

Note: In the current implementation, order emails are sent when an admin updates an order status to `shipped` or `cancelled`.

## Useful Commands

```bash
# Backend + frontend production build
npm run build

# Frontend lint / type checks
npm run lint
npm run types

# PHP format/lint
composer run lint

# Tests
php artisan test --compact
php artisan test --compact tests/Feature/ShopBrowsingTest.php
```

## Main Modules and Routes

- Public:
  - `/` (welcome)
  - `/shop`
  - `/shop/{product}`
  - `/cart`
- Authenticated:
  - `/dashboard`
  - `/account/orders`
  - `/account/addresses`
  - `/account/payment-methods`
- Admin (`can:access-admin`):
  - `/admin/overview`
  - `/admin/categories`
  - `/admin/products`
  - `/admin/orders`
  - `/admin/product-images/trashed`

## Project Structure (Short)

- `app/Http/Controllers`: application controllers
- `app/Http/Requests`: Form Request validation classes
- `app/Services`: business logic, dashboard and pricing services
- `resources/js/pages`: Inertia pages
- `resources/js/components`: UI and shared components
- `resources/js/routes`: Wayfinder route functions
- `database/seeders`: starter/demo data
- `tests/Feature`: feature/integration tests

## Notes

- If frontend changes do not appear, run `npm run dev` or `npm run build`.
- Before deployment, run linting, type checks, and tests.
