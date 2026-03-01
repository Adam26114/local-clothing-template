# Task To-Do List

## Stage 2: Better Auth + Convex Adapter

- [ ] Extend Convex schema for Better Auth persistence tables (accounts, sessions, verification tokens, auth identity links).
- [ ] Implement custom Better Auth adapter against Convex query/mutation methods.
- [ ] Wire real auth handlers in `src/app/api/auth/[...all]/route.ts`.
- [ ] Replace cookie-shim login/register actions with Better Auth flows.
- [ ] Implement superadmin bootstrap via `SUPERADMIN_EMAILS` during first identity sync.
- [ ] Replace middleware/admin guard checks to Better Auth session verification.
- [ ] Remove legacy shim session logic after compatibility window.

Acceptance criteria:

- [ ] Login/register works through Better Auth endpoints.
- [ ] Admin role is synced and enforced from domain user role.
- [ ] Non-admin blocked from `/admin/*`; admin allowed.
- [ ] Cookie-shim auth code removed.

## Stage 3: Remaining Storefront/Checkout/Auth Areas

- [ ] Migrate cart-related product lookups from direct `mock-data` to repository-driven source.
- [ ] Migrate checkout settings/product reads to repository-driven source.
- [ ] Migrate account orders pages to backend-driven reads.
- [ ] Migrate admin modules still using mock data:
  - orders
  - users
  - settings
  - dashboard KPIs

Acceptance criteria:

- [ ] No direct `mock-data` import in runtime app paths (except intentionally retained test fixtures).
- [ ] Core storefront/account/admin paths load from selected data source without runtime errors.

## Operational / Release Tasks

- [ ] Configure Convex deployment env (`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`) in dev and CI environments.
- [ ] Run Convex codegen in configured environment.
- [ ] Add/expand tests for repository selector and Stage 2 auth behavior.
- [ ] Validate Sentry events for auth and data-source fallback breadcrumbs.
- [ ] Re-run full quality gates before release:
  - `typecheck`
  - `lint`
  - `test`
  - `build`
  - `format:check`

Acceptance criteria:

- [ ] CI blocks merge on failures.
- [ ] Production-like env passes end-to-end auth + order/admin journeys.

## Done

- [x] Stage 1: repository + dual-mode adapter architecture implemented.
- [x] Stage 1: admin Products module migrated to repository-backed reads/writes.
- [x] Stage 1: admin Inventory module migrated with stock mutation + audit logs.
- [x] Stage 1: storefront catalog reads (home/PLP/PDP) migrated to repository-backed source.
- [x] Stage 1: fallback notice behavior added for unavailable Convex mode.
