'use server';

import { revalidatePath } from 'next/cache';

import { getServerDataRepositories } from '@/lib/data/repositories';
import type { ProductUpsertInput } from '@/lib/data/repositories/types';
import type { Product } from '@/lib/types';

type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

function revalidateProductSurfaces() {
  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/');
}

export async function createProductAction(
  input: ProductUpsertInput
): Promise<ActionResult<Product>> {
  try {
    const { repositories } = getServerDataRepositories();
    const created = await repositories.products.create(input);
    revalidateProductSurfaces();

    return {
      ok: true,
      data: created,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to create product.',
    };
  }
}

export async function updateProductAction(
  id: string,
  input: ProductUpsertInput
): Promise<ActionResult<Product>> {
  try {
    const { repositories } = getServerDataRepositories();
    const updated = await repositories.products.update(id, input);
    revalidateProductSurfaces();

    return {
      ok: true,
      data: updated,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to update product.',
    };
  }
}

export async function softDeleteProductAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { repositories } = getServerDataRepositories();
    await repositories.products.softDelete(id);
    revalidateProductSurfaces();

    return {
      ok: true,
      data: { id },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to soft delete product.',
    };
  }
}

export async function duplicateProductAction(id: string): Promise<ActionResult<Product>> {
  try {
    const { repositories } = getServerDataRepositories();
    const duplicated = await repositories.products.duplicate(id);
    revalidateProductSurfaces();

    return {
      ok: true,
      data: duplicated,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate product.',
    };
  }
}

export async function toggleBulkProductStatusAction(
  ids: string[],
  isPublished: boolean
): Promise<ActionResult<{ updatedCount: number }>> {
  try {
    const { repositories } = getServerDataRepositories();
    const updatedCount = await repositories.products.toggleBulkStatus(ids, isPublished);
    revalidateProductSurfaces();

    return {
      ok: true,
      data: { updatedCount },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to update product statuses.',
    };
  }
}
