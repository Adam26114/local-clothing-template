# Khit Myanmar E-Commerce

Admin-first e-commerce platform for a Myanmar local shirt brand, implemented with:

- Next.js 16 App Router
- Bun package manager
- Tailwind CSS + shadcn/ui
- Convex schema/function scaffolding (embedded variants model)
- Better Auth with custom Convex adapter
- Sentry config scaffolding

## Locked Business Configuration

- Brand: `Khit`
- Pickup address: `Awbar Street, Kyauk Myoung Gyi Ward, Tamwe Township, Yangon`
- Pickup hours: `Weekdays 10:00 AM - 4:00 PM`
- Contact email: `zweaungnaing.info@gmail.com`
- Contact phone: `+95973159230`
- Initial superadmin email: `zweaungnaing.info@gmail.com`

## Key Implemented Areas

- Storefront routes:
  - `/`, `/:category`, `/:category/:subcategory`, `/products/:slug`
  - `/cart`, `/checkout`, `/order-confirmation/:id`
  - `/account`, `/account/orders`, `/account/orders/:id`
  - `/auth/login`, `/auth/register`, `/auth/forgot-password`
- Admin routes:
  - `/admin`, `/admin/orders`, `/admin/orders/:id`
  - `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`
  - `/admin/inventory`, `/admin/users`, `/admin/users/:id`, `/admin/settings`
- Better Auth session middleware/admin guard + env-based superadmin bootstrap
- Reusable admin DataTable foundation with sort/filter/pagination/column visibility/row selection
- Convex schema + query/mutation scaffold using embedded variant model
- i18n dictionary scaffold (`en` and `my`) and language-toggle-ready structure

## Environment

Copy `.env.example` to `.env.local` and set values as needed.

### Data Source Mode

- `DATA_SOURCE=mock|convex` controls server-side repository selection.
- `NEXT_PUBLIC_DATA_SOURCE=mock|convex` is client-safe mode metadata.
- If `DATA_SOURCE=convex` is requested but `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` are missing, app falls back to `mock` with a visible warning banner.

### Auth Mode (Stage 2)

- Better Auth is wired at `/api/auth/[...all]` using a custom Convex adapter.
- Set these env vars for local auth:
  - `BETTER_AUTH_SECRET` (use a 32+ char random string)
  - `BETTER_AUTH_URL` (for local: `http://localhost:3000`)
  - `NEXT_PUBLIC_CONVEX_URL`
  - `SUPERADMIN_EMAILS` (comma-separated allowlist)
- Optional password reset toggle:
  - `BETTER_AUTH_PASSWORD_RESET_ENABLED=true|false`
  - when `false`, forgot-password returns a controlled disabled state.

Notes:

- There is no seeded default password.
- Create account first via `/auth/register`.
- If the email is in `SUPERADMIN_EMAILS`, first successful auth sync assigns role `admin`.

## Commands

```bash
bun install
bun run dev
bun run lint
bun run test
bun run build
bun run format
bun run format:check
bun run convex:codegen
```

`convex:codegen` requires `CONVEX_DEPLOYMENT` to be configured.

## Docker

```bash
docker-compose up
docker build -t myanmar-ecommerce:latest .
```

## CI

GitHub Actions workflow is at `.github/workflows/ci.yml` and runs:

1. `bun install --frozen-lockfile`
2. `bun run format:check`
3. `bun run lint`
4. `bun run test`
5. `bun run build`
# clothing-website-template
# local-clothing-template
