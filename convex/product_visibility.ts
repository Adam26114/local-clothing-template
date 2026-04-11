export const PRODUCT_STATUSES = ['draft', 'pending', 'private', 'scheduled', 'published'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const statusSet = new Set<ProductStatus>(PRODUCT_STATUSES);

export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === 'string' && statusSet.has(value as ProductStatus);
}

export function normalizeProductStatus(
  value: unknown,
  fallback: ProductStatus = 'draft'
): ProductStatus {
  return isProductStatus(value) ? value : fallback;
}

export function deriveProductStatus(input: { status?: unknown; isPublished?: boolean }): ProductStatus {
  if (isProductStatus(input.status)) {
    return input.status;
  }

  return input.isPublished ? 'published' : 'draft';
}

export function isProductVisible(
  input: { status?: unknown; publishAt?: unknown; isPublished?: boolean },
  now = Date.now()
): boolean {
  const status = deriveProductStatus(input);
  if (status === 'published') {
    return true;
  }

  if (status === 'scheduled') {
    return typeof input.publishAt === 'number' && input.publishAt <= now;
  }

  return false;
}
