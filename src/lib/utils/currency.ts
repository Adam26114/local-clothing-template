export function formatMmk(value: number): string {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)} ks`;
}