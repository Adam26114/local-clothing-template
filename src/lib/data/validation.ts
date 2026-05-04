export function normalizeSortOrder(value: unknown, fallback = 0): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : fallback;
}