import { PRODUCT_STATUSES, type ProductStatus } from '@/lib/types';

const statusSet = new Set<ProductStatus>(PRODUCT_STATUSES);

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  private: 'Private',
  scheduled: 'Scheduled',
  published: 'Published',
};

export const PRODUCT_STATUS_DESCRIPTIONS: Record<ProductStatus, string> = {
  draft: 'Not ready to publish.',
  pending: 'Waiting for review before publishing.',
  private: 'Only visible to site admins and editors.',
  scheduled: 'Publish automatically on a chosen date.',
  published: 'Visible to everyone.',
};

export const PRODUCT_STATUS_DOT_CLASSES: Record<ProductStatus, string> = {
  draft: 'bg-orange-400',
  pending: 'bg-amber-500',
  private: 'bg-slate-500',
  scheduled: 'bg-blue-500',
  published: 'bg-emerald-500',
};

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