import type { ProductUpsertInput } from '@/lib/data/repositories/types';
import { normalizeSlug } from '@/lib/utils/slug';
import { deriveProductStatus } from '@/lib/utils/product-visibility';
import type { ColorVariant, Product, ProductStatus, SizeKey, VariantMeasurement } from '@/lib/types';

import {
  DEFAULT_VARIANT_ID,
  orderSizes,
  sanitizeVariantForPersist,
} from './variant-helpers';

export function hasAnyMeasurements(variant: ColorVariant) {
  const measurements = variant.measurements;
  if (!measurements) return false;

  return Object.values(measurements).some((sizeMeasurements) => {
    if (!sizeMeasurements) return false;
    return Object.values(sizeMeasurements).some((value) => typeof value === 'number' && value > 0);
  });
}

export function cloneMeasurements(
  source: Partial<Record<SizeKey, VariantMeasurement>> | undefined,
  sizeFilter: SizeKey[]
): Partial<Record<SizeKey, VariantMeasurement>> | undefined {
  if (!source) return undefined;

  const result: Partial<Record<SizeKey, VariantMeasurement>> = {};

  for (const size of sizeFilter) {
    const row = source[size];
    if (!row) continue;

    const nextRow: VariantMeasurement = {};
    for (const [field, value] of Object.entries(row)) {
      if (typeof value !== 'number' || value <= 0) continue;
      nextRow[field as keyof VariantMeasurement] = value;
    }

    if (Object.keys(nextRow).length > 0) {
      result[size] = nextRow;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function formatDateTimeLocal(value?: number) {
  if (!value) return '';

  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function parseDateTimeLocal(value: string) {
  if (!value) return undefined;

  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return undefined;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return undefined;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

export function prepareVariantForEditor(variant: ColorVariant): ColorVariant {
  const selectedSizes = orderSizes(
    variant.selectedSizes.length > 0 ? variant.selectedSizes : (Object.keys(variant.stock) as SizeKey[])
  );

  const withRequiredSize = selectedSizes.length > 0 ? selectedSizes : (['M'] as SizeKey[]);

  return sanitizeVariantForPersist({
    ...variant,
    id: variant.id || DEFAULT_VARIANT_ID,
    selectedSizes: withRequiredSize,
    stock:
      selectedSizes.length > 0
        ? variant.stock
        : {
            ...variant.stock,
            M: variant.stock.M ?? 0,
          },
  });
}

function normalizeProductName(name: string, slug: string, fallback: string) {
  return name.trim() || slug.trim() || fallback;
}

export function buildProductUpsertInput(
  product: Product,
  options?: {
    forcePublish?: boolean;
  }
): ProductUpsertInput {
  const sanitizedVariants = product.colorVariants.map((variant) =>
    sanitizeVariantForPersist(variant)
  );
  const status: ProductStatus = options?.forcePublish ? 'published' : deriveProductStatus(product);
  const publishAt = status === 'scheduled' ? product.publishAt : undefined;

  return {
    sku: (product.sku ?? '').trim() || undefined,
    name: product.name.trim(),
    slug: normalizeSlug(normalizeProductName(product.name, product.slug, 'product')),
    description: product.description.trim(),
    categoryId: product.categoryId,
    basePrice: Number(product.basePrice) || 0,
    salePrice: product.salePrice && product.salePrice > 0 ? Number(product.salePrice) : undefined,
    isFeatured: product.isFeatured,
    status,
    publishAt,
    isPublished: Boolean(
      status === 'published' || (status === 'scheduled' && publishAt && publishAt <= Date.now())
    ),
    colorVariants: sanitizedVariants,
  };
}

export function serializeProductUpsertInput(product: Product, options?: { forcePublish?: boolean }) {
  return JSON.stringify(buildProductUpsertInput(product, options));
}
