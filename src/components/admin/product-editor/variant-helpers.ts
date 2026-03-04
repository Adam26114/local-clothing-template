import type { ColorVariant, SizeKey, VariantMeasurement } from '@/lib/types';

export const SIZE_OPTIONS: SizeKey[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const MEASUREMENT_FIELDS = [
  'shoulder',
  'chest',
  'sleeve',
  'waist',
  'length',
] as const satisfies ReadonlyArray<keyof VariantMeasurement>;

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number];

const SIZE_LABELS: Record<SizeKey, string> = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
};

export const DEFAULT_COLOR_HEX = '#000000';
export const DEFAULT_VARIANT_ID = 'variant-initial';

function createVariantId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `variant-${crypto.randomUUID()}`;
  }

  return `variant-${Math.random().toString(36).slice(2, 10)}`;
}

export function createFallbackVariant(id?: string): ColorVariant {
  return {
    id: id ?? createVariantId(),
    colorName: 'Black',
    colorHex: DEFAULT_COLOR_HEX,
    images: [],
    selectedSizes: ['M'],
    stock: { M: 1 },
  };
}

export function getSizeDisplayName(size: SizeKey) {
  return SIZE_LABELS[size];
}

export function normalizeColorHex(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return DEFAULT_COLOR_HEX;

  const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  const normalized = withHash.slice(0, 7);

  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : DEFAULT_COLOR_HEX;
}

export function normalizeVariantImages(images: string[]) {
  const deduped = new Set<string>();

  for (const value of images) {
    const normalized = value.trim();
    if (!normalized) continue;
    deduped.add(normalized);
  }

  return Array.from(deduped);
}

export function orderSizes(sizes: SizeKey[]) {
  const selected = new Set(sizes);
  return SIZE_OPTIONS.filter((size) => selected.has(size));
}

export function sanitizeMeasurements(
  measurements: ColorVariant['measurements'],
  selectedSizes: SizeKey[]
): Partial<Record<SizeKey, VariantMeasurement>> | undefined {
  if (!measurements) return undefined;

  const result: Partial<Record<SizeKey, VariantMeasurement>> = {};

  for (const size of selectedSizes) {
    const value = measurements[size];
    if (!value) continue;

    const next: VariantMeasurement = {};
    for (const field of MEASUREMENT_FIELDS) {
      const raw = value[field];
      if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) continue;
      next[field] = Math.round(raw * 10) / 10;
    }

    if (Object.keys(next).length > 0) {
      result[size] = next;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function sanitizeVariantForPersist(variant: ColorVariant): ColorVariant {
  const selectedSizes = orderSizes(Array.from(new Set(variant.selectedSizes)));
  const stock: Partial<Record<SizeKey, number>> = {};

  for (const size of selectedSizes) {
    const raw = Number(variant.stock[size] ?? 0);
    stock[size] = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }

  return {
    ...variant,
    colorName: variant.colorName.trim() || 'Unnamed',
    colorHex: normalizeColorHex(variant.colorHex),
    images: normalizeVariantImages(variant.images),
    selectedSizes,
    stock,
    measurements: sanitizeMeasurements(variant.measurements, selectedSizes),
  };
}
