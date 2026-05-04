'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { getServerDataRepositories } from '@/lib/data/repositories';
import type { InventoryRow, UpdateStockInput } from '@/lib/data/repositories/types';
import { runServerAction, type ActionResult } from '@/lib/utils/server-action';
import type { InventoryAuditLog, SizeKey } from '@/lib/types';

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
  return runServerAction(async () => {
    const session = await getSession();
    const changedBy = session.email ?? 'system@khit.local';

    const payload: UpdateStockInput = {
      ...input,
      changedBy,
    };

    const { repositories } = getServerDataRepositories();
    const result = await repositories.inventory.updateStock(payload);
    revalidateInventorySurfaces();
    return result;
  }, 'Failed to update stock.');
}

export async function listInventoryAuditLogsAction(input: {
  productId?: string;
  variantId?: string;
  size?: SizeKey;
  limit?: number;
}): Promise<ActionResult<InventoryAuditLog[]>> {
  return runServerAction(async () => {
    const { repositories } = getServerDataRepositories();
    const logs = await repositories.inventory.listAuditLogs(input);
    return logs;
  }, 'Failed to load inventory logs.');
}
