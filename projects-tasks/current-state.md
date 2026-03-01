# Current State

## Snapshot

- Date: February 28, 2026
- Time: 02:00 AM (local)
- Project: Khit Myanmar E-commerce
- Current implementation stage: Stage 2 (Better Auth + Convex Adapter) completed

## Completed

- Added dual-mode data source architecture (`mock|convex`) with server-side selection and fallback behavior.
- Added repository boundary for:
  - products
  - inventory
  - settings
  - categories
- Implemented adapters:
  - mock adapter
  - convex adapter
- Added Stage 1 Convex functions:
  - `categories.list`
  - `products.byId`
  - `products.duplicate`
  - `products.toggleBulkStatus`
  - `inventory.listFlattened`
  - `inventory.updateStockWithAudit`
  - `inventory.listAuditLogs`
- Migrated admin modules to repository-driven flows:
  - Products table, bulk toggle, duplicate, soft delete
  - Product editor create/update persistence
  - Inventory table flattened rows + inline stock update + stock logs panel
- Migrated storefront catalog reads to repository-driven data:
  - `/`
  - `/:category`
  - `/:category/:subcategory`
  - `/products/:slug`
- Added Convex bootstrap artifact:
  - `convex.json`
- Added Convex codegen script:
  - `convex:codegen`
- Implemented Better Auth Stage 2:
  - Custom Convex adapter (`src/lib/auth/better-auth/convex-adapter.ts`)
  - Better Auth instance config (`src/lib/auth/better-auth/index.ts`)
  - Functional Next.js auth handler at `/api/auth/[...all]`
  - Convex auth persistence tables:
    - `authUsers`
    - `authSessions`
    - `authAccounts`
    - `authVerificationTokens`
  - Convex auth adapter CRUD functions (`convex/auth.ts`)
  - Role sync service and superadmin bootstrap via `SUPERADMIN_EMAILS`
  - Middleware and admin layout guards migrated off `khit_*` cookie shim
  - Store auth actions migrated to Better Auth sign-in/sign-up and controlled forgot-password mode

## In Progress / Pending

- Stage 3 migrations (orders/users/settings/cart/checkout/account pages still partly mock-backed).
- Password reset provider wiring (email delivery) if reset is enabled in production.
- Cleanup/refactor of generic Convex auth adapter functions for higher-scale query efficiency.

## Quality Checks

- `typecheck`: passed
- `test`: passed
- `build`: passed
- `format:check`: passed
- `lint`: passes with one warning (TanStack `useReactTable` React Compiler compatibility warning)

## Risks / Notes

- Convex codegen cannot run until `CONVEX_DEPLOYMENT` is configured.
- Current remaining mock-data imports are outside migrated Stage 1 scope (account/cart/checkout and some admin modules not yet migrated).
- Better Auth requires valid `NEXT_PUBLIC_CONVEX_URL`; auth flows will fail without Convex connectivity.
- No default admin password exists; allowlisted admin email must be registered first.
