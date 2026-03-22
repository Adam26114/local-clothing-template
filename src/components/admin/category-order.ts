import type { Category } from '@/lib/types';

export function mergeVisibleOrder(previousRows: Category[], reorderedRows: Category[]) {
  const reorderedIds = new Set(reorderedRows.map((row) => row._id));
  const queue = [...reorderedRows];

  return previousRows.map((row) => {
    if (!reorderedIds.has(row._id)) {
      return row;
    }

    const nextRow = queue.shift();
    return nextRow ?? row;
  });
}
