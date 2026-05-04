'use server';

import { revalidatePath } from 'next/cache';

import { getServerDataRepositories } from '@/lib/data/repositories';
import type { ProductUpsertInput } from '@/lib/data/repositories/types';
import { runServerAction, type ActionResult } from '@/lib/utils/server-action';
import type { Product } from '@/lib/types';

function revalidateProductSurfaces() {
  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/');
}

export async function createProductAction(
  input: ProductUpsertInput
): Promise<ActionResult<Product>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    const created = await repositories.products.create(input);
    revalidateProductSurfaces();
    return created;
  }, 'Failed to create product.');
}

export async function updateProductAction(
  id: string,
  input: ProductUpsertInput
): Promise<ActionResult<Product>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    const updated = await repositories.products.update(id, input);
    revalidateProductSurfaces();
    return updated;
  }, 'Failed to update product.');
}

export async function softDeleteProductAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    await repositories.products.softDelete(id);
    revalidateProductSurfaces();
    return { id };
  }, 'Failed to soft delete product.');
}

export async function duplicateProductAction(id: string): Promise<ActionResult<Product>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    const duplicated = await repositories.products.duplicate(id);
    revalidateProductSurfaces();
    return duplicated;
  }, 'Failed to duplicate product.');
}

export async function toggleBulkProductStatusAction(
  ids: string[],
  isPublished: boolean
): Promise<ActionResult<{ updatedCount: number }>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    const updatedCount = await repositories.products.toggleBulkStatus(ids, isPublished);
    revalidateProductSurfaces();
    return { updatedCount };
  }, 'Failed to update product statuses.');
}
