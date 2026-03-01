'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { getServerDataRepositories } from '@/lib/data/repositories';
import type { InventoryRow, UpdateStockInput } from '@/lib/data/repositories/types';
import type { InventoryAuditLog, SizeKey } from '@/lib/types';

type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

function revalidateInventorySurfaces() {
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/');
}

export async function updateInventoryStockAction(input: {
  productId: string;
  variantId: string;
  size: SizeKey;
  newValue: number;
}): Promise<ActionResult<{ row: InventoryRow; log: InventoryAuditLog }>> {
  try {
    const session = await getSession();
    const changedBy = session.email ?? 'system@khit.local';

    const payload: UpdateStockInput = {
      ...input,
      changedBy,
    };

    const { repositories } = getServerDataRepositories();
    const result = await repositories.inventory.updateStock(payload);
    revalidateInventorySurfaces();

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to update stock.',
    };
  }
}

export async function listInventoryAuditLogsAction(input: {
  productId?: string;
  variantId?: string;
  size?: SizeKey;
  limit?: number;
}): Promise<ActionResult<InventoryAuditLog[]>> {
  try {
    const { repositories } = getServerDataRepositories();
    const logs = await repositories.inventory.listAuditLogs(input);

    return {
      ok: true,
      data: logs,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load inventory logs.',
    };
  }
}
