'use server';

import { revalidatePath } from 'next/cache';

import { getServerDataRepositories } from '@/lib/data/repositories';
import type { CategoryUpsertInput } from '@/lib/data/repositories/types';
import { runServerAction, type ActionResult } from '@/lib/utils/server-action';
import type { Category } from '@/lib/types';

function revalidateCategorySurfaces() {
  revalidatePath('/admin/categories');
  revalidatePath('/admin/categories/new');
  revalidatePath('/admin/products');
  revalidatePath('/admin/products/new');
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function createCategoryAction(
  input: CategoryUpsertInput
): Promise<ActionResult<Category>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    const created = await repositories.categories.create(input);
    revalidateCategorySurfaces();
    return created;
  }, 'Failed to create category.');
}

export async function updateCategoryAction(
  id: string,
  input: CategoryUpsertInput
): Promise<ActionResult<Category>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    const updated = await repositories.categories.update(id, input);
    revalidateCategorySurfaces();
    return updated;
  }, 'Failed to update category.');
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    await repositories.categories.delete(id);
    revalidateCategorySurfaces();
    return { id };
  }, 'Failed to delete category.');
}

export async function deactivateCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    await repositories.categories.deactivate(id);
    revalidateCategorySurfaces();
    return { id };
  }, 'Failed to deactivate category.');
}

export async function reactivateCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    await repositories.categories.reactivate(id);
    revalidateCategorySurfaces();
    return { id };
  }, 'Failed to reactivate category.');
}

export async function activateCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  return reactivateCategoryAction(id);
}
