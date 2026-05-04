import { BRAND } from '@/lib/constants';
import { collectCategoryDeleteIds, hasLinkedProductsInCategoryTree } from '@/lib/utils/category-delete';
import { normalizeSortOrder } from '@/lib/data/validation';
import {
  categories as seedCategories,
  inventoryAuditLogs as seedInventoryAuditLogs,
  orders as seedOrders,
  products as seedProducts,
  storeSettings as seedStoreSettings,
  users as seedUsers,
} from '@/lib/data/mock-data';
import type {
  Category,
  InventoryAuditLog,
  Order,
  Product,
  SizeKey,
  StoreSettings,
  User,
  VariantMeasurement,
} from '@/lib/types';

import type {
  CategoryUpsertInput,
  CategoryRepository,
  DashboardRepository,
  DataRepositories,
  InventoryRepository,
  OrdersRepository,
  ProductRepository,
  UpdateStockInput,
  RevenueRange,
  RevenueSeriesPoint,
  InventoryRow,
  SettingsRepository,
  UsersRepository,
} from '@/lib/data/repositories/types';
import {
  deriveProductStatus,
  isProductVisible,
  normalizeProductStatus,
} from '@/lib/utils/product-visibility';
import { normalizeSlug } from '@/lib/utils/slug';

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const state: {
  categories: Category[];
  products: Product[];
  users: User[];
  orders: Order[];
  storeSettings: StoreSettings;
  inventoryAuditLogs: InventoryAuditLog[];
} = {
  categories: deepClone(seedCategories),
  products: deepClone(seedProducts),
  users: deepClone(seedUsers),
  orders: deepClone(seedOrders),
  storeSettings: deepClone(seedStoreSettings),
  inventoryAuditLogs: deepClone(seedInventoryAuditLogs),
};

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function ensureUniqueSlug(base: string, currentId?: string): string {
  const clean = normalizeSlug(base) || `product-${randomSuffix()}`;
  let candidate = clean;
  let index = 1;

  while (
    state.products.some((product) => product.slug === candidate && product._id !== currentId)
  ) {
    candidate = `${clean}-${index}`;
    index += 1;
  }

  return candidate;
}

function ensureUniqueCategorySlug(base: string, currentId?: string): string {
  const clean = normalizeSlug(base) || `category-${randomSuffix()}`;
  let candidate = clean;
  let index = 1;

  while (state.categories.some((category) => category.slug === candidate && category._id !== currentId)) {
    candidate = `${clean}-${index}`;
    index += 1;
  }

  return candidate;
}

function categoryDescendantIds(rootId: string): Set<string> {
  const descendants = collectCategoryDeleteIds(state.categories, rootId);
  descendants.delete(rootId);
  return descendants;
}

function normalizeCategoryInput(input: CategoryUpsertInput): CategoryUpsertInput & { name: string } {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Category name is required.');
  }

  return {
    name,
    slug: input.slug?.trim() || name,
    description: input.description?.trim() || undefined,
    parentId: input.parentId || undefined,
    sortOrder: normalizeSortOrder(input.sortOrder),
    isActive: input.isActive,
  };
}

function normalizeVariantMeasurements(
  measurements: Product['colorVariants'][number]['measurements']
): Partial<Record<SizeKey, VariantMeasurement>> | undefined {
  if (!measurements) return undefined;
  return measurements;
}

function categoryChildrenIds(parentId: string): string[] {
  return state.categories.filter((item) => item.parentId === parentId).map((item) => item._id);
}

function publishedProducts(): Product[] {
  return state.products.filter((item) => isProductVisible(item));
}

function filterByCategorySlug(categorySlug: string, products: Product[]): Product[] {
  if (categorySlug === 'sale') {
    return products.filter((item) => {
      const base = item.basePrice ?? 0;
      const sale = item.salePrice ?? 0;
      return sale > 0 && sale < base;
    });
  }

  if (categorySlug === 'new') {
    const newCategory = state.categories.find((item) => item.slug === 'new' && !item.parentId);
    if (!newCategory) {
      return products;
    }
    return products.filter((item) => item.categoryId === newCategory._id);
  }

  const category = state.categories.find((item) => item.slug === categorySlug && !item.parentId);
  if (!category) {
    return products;
  }

  const childIds = categoryChildrenIds(category._id);
  if (childIds.length === 0) {
    return products.filter((item) => item.categoryId === category._id);
  }

  return products.filter((item) => childIds.includes(item.categoryId));
}

function findInventoryRow(productId: string, variantId: string, size: SizeKey): InventoryRow {
  const product = state.products.find((entry) => entry._id === productId);
  if (!product) {
    throw new Error('Product not found while resolving inventory row.');
  }

  const variant = product.colorVariants.find((entry) => entry.id === variantId);
  if (!variant) {
    throw new Error('Variant not found while resolving inventory row.');
  }

  return {
    productId: product._id,
    productName: product.name,
    variantId,
    colorName: variant.colorName,
    size,
    stock: variant.stock[size] ?? 0,
    isPublished: isProductVisible(product),
  };
}

function createProductRepository(): ProductRepository {
  return {
    async list(options) {
      const items = options?.publishedOnly ? publishedProducts() : state.products;
      return deepClone(items);
    },

    async listFeatured() {
      const featured = publishedProducts().filter((item) => item.isFeatured);
      return deepClone(featured);
    },

    async listByCategorySlug(categorySlug) {
      return deepClone(filterByCategorySlug(categorySlug, publishedProducts()));
    },

    async listBySubcategorySlugs(categorySlug, subcategorySlug) {
      const parent = state.categories.find((item) => item.slug === categorySlug && !item.parentId);
      if (!parent) return [];

      const subcategory = state.categories.find(
        (item) => item.slug === subcategorySlug && item.parentId === parent._id
      );

      if (!subcategory) return [];

      return deepClone(
        publishedProducts().filter((product) => product.categoryId === subcategory._id)
      );
    },

    async listRelatedBySlug(slug, limit = 4) {
      const related = publishedProducts()
        .filter((item) => item.slug !== slug)
        .slice(0, limit);
      return deepClone(related);
    },

    async getById(id) {
      const product = state.products.find((item) => item._id === id);
      return product ? deepClone(product) : undefined;
    },

    async getBySlug(slug, options) {
      const publishedOnly = options?.publishedOnly ?? true;
      const product = state.products.find((item) => {
        if (item.slug !== slug) return false;
        if (publishedOnly) return isProductVisible(item);
        return true;
      });

      return product ? deepClone(product) : undefined;
    },

    async create(input) {
      const now = Date.now();
      const status = normalizeProductStatus(input.status, deriveProductStatus(input));
      const publishAt = status === 'scheduled' ? input.publishAt : undefined;
      if (status === 'scheduled' && typeof publishAt !== 'number') {
        throw new Error('Scheduled products require a publish date.');
      }
      const product: Product = {
        ...input,
        status,
        publishAt,
        _id: `prod-${randomSuffix()}`,
        slug: ensureUniqueSlug(input.slug || input.name),
        colorVariants: input.colorVariants.map((variant) => ({
          ...variant,
          id: variant.id || `variant-${randomSuffix()}`,
          measurements: normalizeVariantMeasurements(variant.measurements),
        })),
        createdAt: now,
        updatedAt: now,
      };

      product.isPublished = isProductVisible(product, now);

      state.products.unshift(product);
      return deepClone(product);
    },

    async update(id, input) {
      const index = state.products.findIndex((item) => item._id === id);
      if (index < 0) {
        throw new Error('Product not found.');
      }

      const existing = state.products[index];
      const status = normalizeProductStatus(input.status, deriveProductStatus(input));
      const publishAt = status === 'scheduled' ? input.publishAt : undefined;
      if (status === 'scheduled' && typeof publishAt !== 'number') {
        throw new Error('Scheduled products require a publish date.');
      }
      const updated: Product = {
        ...existing,
        ...input,
        status,
        publishAt,
        _id: id,
        slug: ensureUniqueSlug(input.slug || input.name || existing.name, id),
        colorVariants: input.colorVariants.map((variant) => ({
          ...variant,
          id: variant.id || `variant-${randomSuffix()}`,
          measurements: normalizeVariantMeasurements(variant.measurements),
        })),
        updatedAt: Date.now(),
      };

      updated.isPublished = isProductVisible(updated);

      state.products[index] = updated;
      return deepClone(updated);
    },

    async softDelete(id) {
      const product = state.products.find((item) => item._id === id);
      if (!product) return;
      product.status = 'draft';
      product.publishAt = undefined;
      product.isPublished = false;
      product.updatedAt = Date.now();
    },

    async duplicate(id) {
      const original = state.products.find((item) => item._id === id);
      if (!original) {
        throw new Error('Product not found.');
      }

      const now = Date.now();
      const duplicate: Product = {
        ...deepClone(original),
        _id: `prod-${randomSuffix()}`,
        name: `${original.name} (Copy)`,
        slug: ensureUniqueSlug(`${original.slug}-copy`),
        sku: original.sku ? `${original.sku}-COPY` : undefined,
        status: 'draft',
        publishAt: undefined,
        isPublished: false,
        colorVariants: original.colorVariants.map((variant) => ({
          ...deepClone(variant),
          id: `${variant.id}-copy-${randomSuffix()}`,
        })),
        createdAt: now,
        updatedAt: now,
      };

      state.products.unshift(duplicate);
      return deepClone(duplicate);
    },

    async toggleBulkStatus(ids, isPublished) {
      const idSet = new Set(ids);
      let updated = 0;

      for (const product of state.products) {
        if (!idSet.has(product._id)) continue;
        product.status = isPublished ? 'published' : 'draft';
        product.publishAt = undefined;
        product.isPublished = isPublished;
        product.updatedAt = Date.now();
        updated += 1;
      }

      return updated;
    },
  };
}

function createCategoryRepository(): CategoryRepository {
  return {
    async list(options) {
      const rows = state.categories
        .filter((item) => (options?.activeOnly === false ? true : item.isActive))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return deepClone(rows);
    },

    async getById(id) {
      const row = state.categories.find((item) => item._id === id);
      return row ? deepClone(row) : undefined;
    },

    async create(input: CategoryUpsertInput) {
      const normalized = normalizeCategoryInput(input);
      const parent = normalized.parentId
        ? state.categories.find((item) => item._id === normalized.parentId)
        : undefined;

      if (normalized.parentId && !parent) {
        throw new Error('Selected parent category does not exist.');
      }

      if (parent && normalized.isActive && !parent.isActive) {
        throw new Error('Cannot create an active child under an inactive parent.');
      }

      const now = Date.now();
      const category: Category = {
        _id: `cat-${randomSuffix()}`,
        name: normalized.name,
        slug: ensureUniqueCategorySlug(normalized.slug || normalized.name),
        description: normalized.description,
        parentId: normalized.parentId,
        sortOrder: normalized.sortOrder,
        isActive: normalized.isActive,
        createdAt: now,
        updatedAt: now,
      };

      state.categories.push(category);
      return deepClone(category);
    },

    async update(id, input: CategoryUpsertInput) {
      const existing = state.categories.find((item) => item._id === id);
      if (!existing) {
        throw new Error('Category not found.');
      }

      const normalized = normalizeCategoryInput(input);
      if (normalized.parentId === id) {
        throw new Error('Category cannot be its own parent.');
      }

      const parent = normalized.parentId
        ? state.categories.find((item) => item._id === normalized.parentId)
        : undefined;

      if (normalized.parentId && !parent) {
        throw new Error('Selected parent category does not exist.');
      }

      const descendants = categoryDescendantIds(id);
      if (normalized.parentId && descendants.has(normalized.parentId)) {
        throw new Error('Category cannot be moved under its own descendant.');
      }

      if (parent && normalized.isActive && !parent.isActive) {
        throw new Error('Cannot set category active while parent is inactive.');
      }

      existing.name = normalized.name;
      existing.slug = ensureUniqueCategorySlug(normalized.slug || normalized.name, id);
      existing.description = normalized.description;
      existing.parentId = normalized.parentId;
      existing.sortOrder = normalized.sortOrder;
      existing.isActive = normalized.isActive;
      existing.updatedAt = Date.now();

      return deepClone(existing);
    },

    async delete(id) {
      const existing = state.categories.find((item) => item._id === id);
      if (!existing) {
        throw new Error('Category not found.');
      }

      if (hasLinkedProductsInCategoryTree(state.categories, state.products, id)) {
        throw new Error('Cannot delete a category that still has products assigned. Reassign products first.');
      }

      const ids = collectCategoryDeleteIds(state.categories, id);
      state.categories = state.categories.filter((item) => !ids.has(item._id));
    },

    async deactivate(id) {
      const existing = state.categories.find((item) => item._id === id);
      if (!existing) {
        throw new Error('Category not found.');
      }

      const now = Date.now();
      existing.isActive = false;
      existing.updatedAt = now;
      const descendants = categoryDescendantIds(id);

      for (const childId of descendants) {
        const child = state.categories.find((item) => item._id === childId);
        if (!child) continue;
        child.isActive = false;
        child.updatedAt = now;
      }
    },

    async reactivate(id) {
      const existing = state.categories.find((item) => item._id === id);
      if (!existing) {
        throw new Error('Category not found.');
      }

      if (existing.parentId) {
        const parent = state.categories.find((item) => item._id === existing.parentId);
        if (!parent || !parent.isActive) {
          throw new Error('Cannot reactivate category while parent is inactive.');
        }
      }

      existing.isActive = true;
      existing.updatedAt = Date.now();
    },
  };
}

function createSettingsRepository(): SettingsRepository {
  return {
    async get() {
      return deepClone({
        ...state.storeSettings,
        contactEmail: state.storeSettings.contactEmail ?? BRAND.contactEmail,
        contactPhone: state.storeSettings.contactPhone ?? BRAND.contactPhone,
        pickupAddress: state.storeSettings.pickupAddress ?? BRAND.pickupAddress,
        pickupHours: state.storeSettings.pickupHours ?? BRAND.pickupHours,
      });
    },
  };
}

function createInventoryRepository(): InventoryRepository {
  return {
    async listFlattened() {
      const rows: InventoryRow[] = [];

      for (const product of state.products) {
        for (const variant of product.colorVariants) {
          for (const size of variant.selectedSizes) {
            rows.push({
              productId: product._id,
              productName: product.name,
              variantId: variant.id,
              colorName: variant.colorName,
              size,
              stock: variant.stock[size] ?? 0,
              isPublished: isProductVisible(product),
            });
          }
        }
      }

      return rows.sort((a, b) => a.productName.localeCompare(b.productName));
    },

    async updateStock(input: UpdateStockInput) {
      const product = state.products.find((entry) => entry._id === input.productId);
      if (!product) {
        throw new Error('Product not found.');
      }

      const variant = product.colorVariants.find((entry) => entry.id === input.variantId);
      if (!variant) {
        throw new Error('Variant not found.');
      }

      const oldValue = variant.stock[input.size] ?? 0;
      const newValue = Math.max(0, Math.floor(input.newValue));

      variant.stock[input.size] = newValue;
      if (!variant.selectedSizes.includes(input.size)) {
        variant.selectedSizes.push(input.size);
      }
      product.updatedAt = Date.now();

      const log: InventoryAuditLog = {
        _id: `log-${randomSuffix()}`,
        productId: product._id,
        variantId: variant.id,
        size: input.size,
        oldValue,
        newValue,
        changedBy: input.changedBy,
        changedAt: Date.now(),
      };

      state.inventoryAuditLogs.unshift(log);

      return {
        row: deepClone(findInventoryRow(product._id, variant.id, input.size)),
        log: deepClone(log),
      };
    },

    async listAuditLogs(input) {
      const logs = state.inventoryAuditLogs
        .filter((entry) => {
          if (input.productId && entry.productId !== input.productId) return false;
          if (input.variantId && entry.variantId !== input.variantId) return false;
          if (input.size && entry.size !== input.size) return false;
          return true;
        })
        .sort((a, b) => b.changedAt - a.changedAt)
        .slice(0, input.limit ?? 50);

      return deepClone(logs);
    },
  };
}

function createOrdersRepository(): OrdersRepository {
  return {
    async list() {
      return deepClone(state.orders).sort((a, b) => b.createdAt - a.createdAt);
    },

    async getById(id) {
      const row = state.orders.find((order) => order._id === id);
      return row ? deepClone(row) : undefined;
    },
  };
}

function createUsersRepository(): UsersRepository {
  return {
    async list() {
      return deepClone(state.users).sort((a, b) => b.createdAt - a.createdAt);
    },

    async getById(id) {
      const row = state.users.find((user) => user._id === id);
      return row ? deepClone(row) : undefined;
    },
  };
}

function getRangeDays(range: RevenueRange): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 90;
}

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function buildRevenueSeries(range: RevenueRange): RevenueSeriesPoint[] {
  const totalDays = getRangeDays(range);
  const today = new Date();
  const points: RevenueSeriesPoint[] = [];

  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - i);
    points.push({
      date: date.toISOString().slice(0, 10),
      revenue: 0,
      orderCount: 0,
    });
  }

  const indexByDate = new Map(points.map((point, idx) => [point.date, idx]));

  for (const order of state.orders) {
    if (order.status === 'cancelled') continue;
    const key = dayKey(order.createdAt);
    const idx = indexByDate.get(key);
    if (idx == null) continue;
    points[idx].revenue += order.total;
    points[idx].orderCount += 1;
  }

  return points;
}

function createDashboardRepository(): DashboardRepository {
  return {
    async getKpis() {
      const totalRevenueMmk = state.orders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0);
      const pendingOrders = state.orders.filter((order) => order.status === 'pending').length;
      const activeProducts = state.products.filter((product) => isProductVisible(product)).length;
      const activeAccounts = state.users.filter((user) => user.isActive).length;

      return {
        totalRevenueMmk,
        pendingOrders,
        activeProducts,
        activeAccounts,
      };
    },

    async getRevenueSeries(range) {
      return buildRevenueSeries(range);
    },
  };
}

export function createMockRepositories(): DataRepositories {
  return {
    products: createProductRepository(),
    categories: createCategoryRepository(),
    settings: createSettingsRepository(),
    inventory: createInventoryRepository(),
    orders: createOrdersRepository(),
    users: createUsersRepository(),
    dashboard: createDashboardRepository(),
  };
}
