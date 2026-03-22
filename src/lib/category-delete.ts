type CategoryTreeItem = {
  _id: string;
  parentId?: string;
};

type ProductCategoryRef = {
  categoryId: string;
};

export function collectCategoryDeleteIds(categories: CategoryTreeItem[], rootId: string): Set<string> {
  const ids = new Set<string>();
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (ids.has(current)) continue;
    ids.add(current);

    for (const category of categories) {
      if (category.parentId === current) {
        queue.push(category._id);
      }
    }
  }

  return ids;
}

export function hasLinkedProductsInCategoryTree(
  categories: CategoryTreeItem[],
  products: ProductCategoryRef[],
  rootId: string
): boolean {
  const ids = collectCategoryDeleteIds(categories, rootId);
  return products.some((product) => ids.has(product.categoryId));
}
