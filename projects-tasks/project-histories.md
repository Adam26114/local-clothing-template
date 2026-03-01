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
