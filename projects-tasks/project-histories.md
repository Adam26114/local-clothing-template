# Project Histories

## Timeline

- PRD established: `Myanmar_Ecommerce_PRD_v2.1.0.docx` adopted as source of truth.
- Bootstrap phase completed:
  - Next.js App Router scaffold
  - shadcn/ui-based UI structure
  - initial admin/storefront route shells
  - Docker and CI scaffolding
- Early backend scaffold completed:
  - Convex schema and initial function scaffolds
  - Better Auth route placeholder introduced
- Stage 1 migration completed:
  - repository + adapter architecture introduced
  - admin Products + Inventory migrated to repository/Convex pathway
  - storefront catalog routes migrated to repository/Convex pathway

## Key Decisions

- Backend integration order: admin-first priority.
- Data migration strategy: dual-mode transition (`mock|convex`) for lower risk.
- Backend source of truth: Convex for business/domain data.
- Auth strategy: Better Auth with custom Convex adapter (no secondary SQL DB added).
- Product model strategy: embedded variants inside product documents.

## PRD Alignment Notes

- Brand and locked business fields aligned to PRD inputs (Khit brand, pickup/contact defaults).
- Admin-first sequence respected by prioritizing:
  - products management
  - inventory management
- Storefront migration was limited to catalog truth paths required by Stage 1:
  - home featured/settings reads
  - PLP and PDP reads

## Milestone Notes

- Stage 1 deliverable status: complete and validated.
- Stage 2 deliverable status: pending implementation.
- Known environment constraint:
  - Convex codegen/deployment commands require configured Convex deployment env vars.

## 2026-04-12 — Task: Shared Server-Action Helper Extraction

- What changed: extracted a shared `runServerAction` helper and `ActionResult` type into `src/lib/server-action.ts`, then migrated the admin products, categories, and inventory action modules to use it.
- Files affected: `src/lib/server-action.ts`, `src/app/(admin)/admin/products/actions.ts`, `src/app/(admin)/admin/categories/actions.ts`, `src/app/(admin)/admin/inventory/actions.ts`.
- Why: remove repeated try/catch/result boilerplate and keep server-action behavior consistent across admin mutation paths.
- Verification: command-based checks could not be run in this shell because `bun` and `node` are not installed here.

## 2026-04-12 — Task: Shared Slug Helper Extraction

- What changed: extracted slug normalization into `src/lib/slug.ts` and updated the mock repository plus both admin editors to use the shared helper.
- Files affected: `src/lib/slug.ts`, `src/lib/data/repositories/mock.ts`, `src/components/admin/category-editor.tsx`, `src/components/admin/product-editor.tsx`.
- Why: remove duplicated slug parsing logic and keep naming behavior consistent across data and editor layers.
- Verification: command-based checks could not be run in this shell because `bun` and `node` are not installed here.

## 2026-04-12 — Task: Product Editor Helper Split

- What changed: moved product-editor data-shaping helpers into `src/components/admin/product-editor/product-editor-utils.ts` and kept the main editor component focused on UI and interactions.
- Files affected: `src/components/admin/product-editor/product-editor-utils.ts`, `src/components/admin/product-editor.tsx`.
- Why: reduce component complexity and make the product editor structure easier to maintain.
- Verification: command-based checks could not be run in this shell because `bun` and `node` are not installed here.

## 2026-04-12 — Task: Shared SortOrder Normalization Helper Extraction

- What changed: extracted a shared `normalizeSortOrder()` helper into `src/lib/data/validation.ts`, then updated the mock repository and category-editor to use it.
- Files affected: `src/lib/data/validation.ts`, `src/lib/data/repositories/mock.ts`, `src/components/admin/category-editor.tsx`.
- Why: remove duplicated sortOrder normalization pattern that appeared 3 times.
- Verification: command-based checks could not be run in this shell because `bun` and `node` are not installed here.

## 2026-04-12 — Task: Folder Structure Reorganization (Clean & Minimalistic)

- What changed: reorganized src/lib/ with new utils/ subfolder, moved mock-data to lib/data/, created context/ folder for React contexts.
- Files created: `src/lib/utils/`, `src/lib/storage.ts`, `src/context/cart-context.tsx`.
- Files moved: currency.ts, slug.ts, order-utils.ts, server-action.ts, product-visibility.ts, category-delete.ts, mock-data.ts, product-image-storage.ts.
- Files deleted: old files at lib root level.
- Files updated: 30+ files with new import paths across codebase.
- Why: create cleaner, minimalistic folder structure with organized utility modules.
- Verification: typecheck passes, all tests pass.

## 2026-04-12 — Task: Stage 2 Better Auth Completion

- What changed: Stage 2 Better Auth integration is now complete:
  - Convex schema extended for auth tables (authUsers, authSessions, authAccounts, authVerificationTokens)
  - Custom Convex adapter implemented in convex-adapter.ts
  - Auth handlers wired at /api/auth/[...all]/route.ts
  - Login/register/reset-password flows using Better Auth APIs
  - Superadmin bootstrap via SUPERADMIN_EMAILS during role sync
  - Middleware checks for session cookie on /admin/* routes
  - Role sync happens during login/register via syncDomainRoleFromAuthIdentity
- Files affected: Convex schema (schema.ts), better-auth/index.ts, better-auth/convex-adapter.ts, auth/actions.ts, middleware.ts, role-sync.ts
- Verification: typecheck passes, all 10 tests pass
