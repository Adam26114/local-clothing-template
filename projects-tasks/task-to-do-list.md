# Task To-Do List

## PRD-Aligned Execution Queue (Admin-First)

### 1) Project Bootstrap and Locked Tooling

- [x] Next.js App Router + Bun + TypeScript scaffold is in place.
- [x] shadcn/ui setup and baseline scripts exist.
- [x] Docker baseline files exist.
- [ ] Verify strict parity against PRD stack details (Mira preset specifics, dashboard template parity, all required scripts).

Acceptance criteria:

- [ ] `bun run dev` works locally.
- [ ] `lint`, `format:check`, `test`, `build` pass in CI and local.
- [ ] Docker dev + production builds confirmed with current codebase.

### 2) Core Folder Architecture and Route Groups

- [x] Route groups and folder structure exist (`(store)`, `(admin)`, `components/*`, `convex`, `lib`, `public`).
- [x] Primary PRD route shells exist.
- [ ] Verify all PRD routes resolve with final layout wrappers and guard behavior.

Acceptance criteria:

- [ ] Store and admin route inventory matches PRD sections 8.1 and 8.2 exactly.

### 3) Convex Setup and Schema (Embedded Variants)

- [x] Core domain schema exists for users/categories/products/cart/wishlist/orders/storeSettings/inventoryAuditLogs.
- [x] Stage 1 function coverage added for categories/products/inventory migration scope.
- [ ] Replace stubbed `convex/_generated/*` workflow with real generated artifacts after Convex env setup.
- [ ] Validate full index coverage vs PRD and add any missing indexes.

Acceptance criteria:

- [ ] Convex codegen/deploy succeeds with configured deployment.
- [ ] Schema and function typings compile without local stub compromises.

### 4) Seed Data and Store Singleton Initialization

- [ ] Seed categories for Mango-style nav (`MEN`, `WOMEN`, `NEW`, `SALE`) including child categories.
- [ ] Seed `storeSettings` singleton with locked Khit business/contact/pickup values.
- [ ] Seed representative demo products with embedded variants, stock, and media.

Acceptance criteria:

- [ ] Admin pages render meaningful seeded data on clean environment.

### 5) Better Auth Integration + Role Model (Stage 2)

- [x] Add Better Auth persistence schema support in Convex (custom adapter data model).
- [x] Implement custom Better Auth adapter on Convex queries/mutations.
- [x] Wire functional `/api/auth/[...all]` handlers.
- [x] Migrate cookie-shim login/register to Better Auth flows.
- [x] Keep superadmin allowlist behavior via `SUPERADMIN_EMAILS`.
- [x] Remove legacy shim session implementation from active code path.

Acceptance criteria:

- [x] `zweaungnaing.info@gmail.com` auto-promotes to admin on first authenticated sync.
- [x] Non-admin users are blocked from `/admin/*`.
- [x] Better Auth sessions govern admin authorization.

### 6) Admin Layout and Reusable DataTable Foundation

- [x] Admin shell and DataTable base are implemented.
- [x] Pagination, row selection, search, visibility persistence, sort/filter baseline exist.
- [ ] Complete PRD expectations: per-column filters, robust loading/empty states parity, bulk action UX polish.

Acceptance criteria:

- [ ] Shared DataTable behavior is consistently applied across admin modules.

### 7) Admin Products Module (Highest Priority)

- [x] Products listing migrated to repository-driven data with row actions.
- [x] Create/edit flow persists product data via repository actions.
- [x] Soft delete, duplicate, and bulk publish toggle implemented.
- [ ] Complete variant editor parity per PRD:
  - [ ] image upload/reorder/primary flow
  - [ ] optional measurements UX
  - [ ] richer validation/error handling

Acceptance criteria:

- [ ] Full product CRUD works with embedded variants and survives reload.

### 8) Admin Inventory Module

- [x] Flattened inventory view implemented.
- [x] Low-stock and out-of-stock filters implemented.
- [x] Inline stock edit persists and writes audit log.
- [x] Audit log view available from inventory row actions.

Acceptance criteria:

- [ ] Stock updates are atomic and reflected in corresponding product variant stock.

### 9) Admin Orders Module

- [ ] Migrate orders module from mock data to repository/Convex.
- [ ] Implement status lifecycle transitions:
  - `pending -> confirmed -> processing -> shipped -> delivered | cancelled`
- [ ] On cancel, restore stock atomically.
- [ ] Add CSV export for selected rows.

Acceptance criteria:

- [ ] Search/filter/status transitions function correctly and persist.

### 10) Admin Users + Storefront Controls

- [ ] Migrate users admin pages from mock data to backend source.
- [ ] Implement promote/demote/suspend with superadmin-only protection.
- [ ] Migrate `/admin/settings` to backend persistence for hero/featured/sale/announcement/contact/social.

Acceptance criteria:

- [ ] Storefront content controls are fully editable from admin and reflected on storefront.

### 11) Storefront Core Pages (Post-Admin Stability)

- [x] Home/PLP/PDP catalog reads now use repository source (mock/convex mode-aware).
- [ ] Complete UX parity with PRD requirements:
  - [ ] richer PLP filter/sort combinations
  - [ ] robust breadcrumb/category hierarchy correctness
  - [ ] related products/business rules tuning

Acceptance criteria:

- [ ] Desktop/tablet/mobile browsing journey matches PRD behavior.

### 12) Cart, Checkout, and Order Confirmation

- [ ] Migrate cart/checkout/order creation off mock data.
- [ ] Enforce delivery rules:
  - pickup => shipping fee `0`
  - shipping => fee `2500 MMK`
- [ ] COD-only payment path enforced.
- [ ] Guest checkout + optional account linkage.
- [ ] Atomic stock decrement during order creation.

Acceptance criteria:

- [ ] End-to-end purchase flow persists real order records and inventory changes.

### 13) Account Area + i18n Scaffolding

- [ ] Migrate account order pages to backend source.
- [ ] Keep English complete and Burmese dictionary scaffold maintained.
- [ ] Keep language switch behind `LANG_SWITCH_ENABLED=false` for launch.

Acceptance criteria:

- [ ] Account profile/order history/detail pages use backend data.

### 14) Observability, Quality Gates, CI/CD

- [ ] Confirm Sentry frontend + backend event capture in active environments.
- [ ] Ensure CI pipeline blocks on format/build/test failures.
- [ ] Confirm CodeRabbit is active on PRs for `develop` and `main`.

Acceptance criteria:

- [ ] Test error events visible in Sentry.
- [ ] CI reliably enforces quality gates.

### 15) Performance, Accessibility, SEO, Launch Hardening

- [ ] Image optimization and lazy loading review.
- [ ] Metadata + OG + Product schema on PDP.
- [ ] WCAG AA pass for keyboard/ARIA/contrast.
- [ ] Lighthouse mobile score target validation (`>90`) and core journey stability check.

Acceptance criteria:

- [ ] Launch checklist fully green.

## Current Focus (Immediate)

- [ ] Stage 3: Orders module migration from mock data.
- [ ] Stage 3: Users/settings admin migration from mock data.
- [ ] Stage 3: Cart/checkout/account migration from mock data.
- [ ] Seed + Convex codegen/deploy finalization with real deployment env.

## Done (Confirmed)

- [x] Stage 1: dual-mode repository architecture (`mock|convex`) implemented.
- [x] Stage 1: products + inventory backend integration completed.
- [x] Stage 1: storefront catalog reads (`/`, category, subcategory, PDP) migrated to repository layer.
- [x] Stage 1: fallback behavior and warning notice for unavailable Convex mode added.
- [x] Stage 2: Better Auth + custom Convex adapter cutover completed.
