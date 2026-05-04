# Refactor Plan

## Status Legend
- [ ] TODO
- [x] DONE
- [~] IN PROGRESS

## Audit Summary

### Current State
- Codebase is already well-organized after previous refactoring passes
- Server-action helpers, slug normalization, and product-editor utilities have been extracted
- Folder structure is clean: `src/app/`, `src/components/admin/`, `src/components/store/`, `src/components/ui/`, `src/components/shared/`, `src/lib/`

### Duplication Findings

| Pattern | Locations | Count |
|---------|----------|-------|
| sortOrder normalization (`Number.isFinite() ? Math.max(0, Math.floor()) : 0`) | mock.ts:113, category-editor.tsx:114, category-editor.tsx:193 | 3 |

### Risks
- Local Bun/Node execution unavailable in current environment - cannot run verification commands
- Existing tests depend on specific helper functions - must update carefully

## Refactor Tasks

### Task 1: Extract Shared sortOrder Helper
- [ ] Extract `normalizeSortOrder()` helper into `src/lib/data/validation.ts`
- [ ] Update `mock.ts` import and usage
- [ ] Update `category-editor.tsx` import and usage

### Task 2: Update Task List and History
- [ ] Mark verification as blocked in task-to-do-list.md
- [ ] Append history entry in HISTORY.md

## Verification
- Cannot run `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`, `bun run format:check` in current environment
- Code changes follow existing patterns and naming conventions