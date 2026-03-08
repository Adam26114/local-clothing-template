'use server';

import { revalidatePath } from 'next/cache';

import { getServerDataRepositories } from '@/lib/data/repositories';
import type { CategoryUpsertInput } from '@/lib/data/repositories/types';
import type { Category } from '@/lib/types';

type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

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
  try {
    const { repositories } = getServerDataRepositories();
    const created = await repositories.categories.create(input);
    revalidateCategorySurfaces();

    return {
      ok: true,
      data: created,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to create category.',
    };
  }
}

export async function updateCategoryAction(
  id: string,
  input: CategoryUpsertInput
): Promise<ActionResult<Category>> {
  try {
    const { repositories } = getServerDataRepositories();
    const updated = await repositories.categories.update(id, input);
    revalidateCategorySurfaces();

    return {
      ok: true,
      data: updated,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to update category.',
    };
  }
}

export async function deactivateCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { repositories } = getServerDataRepositories();
    await repositories.categories.deactivate(id);
    revalidateCategorySurfaces();

    return {
      ok: true,
      data: { id },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate category.',
    };
  }
}

export async function reactivateCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { repositories } = getServerDataRepositories();
    await repositories.categories.reactivate(id);
    revalidateCategorySurfaces();

    return {
      ok: true,
      data: { id },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate category.',
    };
  }
}
