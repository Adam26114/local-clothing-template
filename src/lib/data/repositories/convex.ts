import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

import { BRAND } from '@/lib/constants';
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
  ProductUpsertInput,
  RevenueRange,
  RevenueSeriesPoint,
  UpdateStockInput,
  InventoryRow,
  SettingsRepository,
  UsersRepository,
} from '@/lib/data/repositories/types';

type UnknownRecord = Record<string, unknown>;

let client: ConvexHttpClient | null = null;

function getConvexClient() {
  if (client) {
    return client;
  }

  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is required when using convex data source.');
  }

  client = new ConvexHttpClient(deploymentUrl);
  return client;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function toMeasurementMap(
  value: unknown
): Partial<Record<SizeKey, VariantMeasurement>> | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const result: Partial<Record<SizeKey, VariantMeasurement>> = {};

  for (const [key, measurement] of Object.entries(value)) {
    if (!measurement || typeof measurement !== 'object') continue;
    result[key as SizeKey] = {
      shoulder: toNumberOrUndefined((measurement as UnknownRecord).shoulder),
      chest: toNumberOrUndefined((measurement as UnknownRecord).chest),
      sleeve: toNumberOrUndefined((measurement as UnknownRecord).sleeve),
      waist: toNumberOrUndefined((measurement as UnknownRecord).waist),
      length: toNumberOrUndefined((measurement as UnknownRecord).length),
    };
  }

  return Object.keys(result).length ? result : undefined;
}

function toStockRecord(value: unknown): Partial<Record<SizeKey, number>> {
  if (!value || typeof value !== 'object') return {};

  const result: Partial<Record<SizeKey, number>> = {};
  for (const [key, amount] of Object.entries(value)) {
    if (typeof amount === 'number') {
      result[key as SizeKey] = amount;
    }
  }

  return result;
}

function toCategory(input: UnknownRecord): Category {
  return {
    _id: String(input._id),
    name: String(input.name ?? ''),
    slug: String(input.slug ?? ''),
    description: toStringOrUndefined(input.description),
    parentId: toStringOrUndefined(input.parentId),
    sortOrder: Number(input.sortOrder ?? 0),
    isActive: toBoolean(input.isActive),
    createdAt: Number(input.createdAt ?? 0),
    updatedAt: Number(input.updatedAt ?? 0),
  };
}

function toProduct(input: UnknownRecord): Product {
  const colorVariantsRaw = Array.isArray(input.colorVariants) ? input.colorVariants : [];

  return {
    _id: String(input._id),
    sku: toStringOrUndefined(input.sku),
    name: String(input.name ?? ''),
    slug: String(input.slug ?? ''),
    description: String(input.description ?? ''),
    categoryId: String(input.categoryId ?? ''),
    basePrice: toNumberOrUndefined(input.basePrice),
    salePrice: toNumberOrUndefined(input.salePrice),
    isFeatured: toBoolean(input.isFeatured),
    isPublished: toBoolean(input.isPublished),
    colorVariants: colorVariantsRaw
      .filter((entry): entry is UnknownRecord => Boolean(entry) && typeof entry === 'object')
      .map((variant) => ({
        id: String(variant.id ?? ''),
        colorName: String(variant.colorName ?? ''),
        colorHex: String(variant.colorHex ?? '#000000'),
        images: toStringArray(variant.images),
        selectedSizes: toStringArray(variant.selectedSizes) as SizeKey[],
        stock: toStockRecord(variant.stock),
        measurements: toMeasurementMap(variant.measurements),
      })),
    createdAt: Number(input.createdAt ?? 0),
    updatedAt: Number(input.updatedAt ?? 0),
  };
}

function toStoreSettings(input: UnknownRecord | null | undefined): StoreSettings {
  return {
    _id: String(input?._id ?? 'store-settings'),
    heroTitle: toStringOrUndefined(input?.heroTitle),
    heroSubtitle: toStringOrUndefined(input?.heroSubtitle),
    heroImageUrl: toStringOrUndefined(input?.heroImageUrl),
    heroCtaLabel: toStringOrUndefined(input?.heroCtaLabel),
    heroCtaLink: toStringOrUndefined(input?.heroCtaLink),
    saleBannerEnabled:
      typeof input?.saleBannerEnabled === 'boolean' ? input.saleBannerEnabled : undefined,
    saleBannerText: toStringOrUndefined(input?.saleBannerText),
    saleBannerLink: toStringOrUndefined(input?.saleBannerLink),
    announcementBar: toStringOrUndefined(input?.announcementBar),
    contactEmail: toStringOrUndefined(input?.contactEmail) ?? BRAND.contactEmail,
    contactPhone: toStringOrUndefined(input?.contactPhone) ?? BRAND.contactPhone,
    pickupAddress: toStringOrUndefined(input?.pickupAddress) ?? BRAND.pickupAddress,
    pickupHours: toStringOrUndefined(input?.pickupHours) ?? BRAND.pickupHours,
    socialInstagram: toStringOrUndefined(input?.socialInstagram),
    socialFacebook: toStringOrUndefined(input?.socialFacebook),
    socialTiktok: toStringOrUndefined(input?.socialTiktok),
    featuredProductIds: Array.isArray(input?.featuredProductIds)
      ? input?.featuredProductIds.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    updatedAt: Number(input?.updatedAt ?? Date.now()),
  };
}

function toInventoryAuditLog(input: UnknownRecord): InventoryAuditLog {
  return {
    _id: String(input._id),
    productId: String(input.productId),
    variantId: String(input.variantId),
    size: String(input.size) as SizeKey,
    oldValue: Number(input.oldValue ?? 0),
    newValue: Number(input.newValue ?? 0),
    changedBy: String(input.changedBy ?? 'system'),
    changedAt: Number(input.changedAt ?? Date.now()),
  };
}

function toInventoryRow(input: UnknownRecord): InventoryRow {
  return {
    productId: String(input.productId),
    productName: String(input.productName),
    variantId: String(input.variantId),
    colorName: String(input.colorName),
    size: String(input.size) as SizeKey,
    stock: Number(input.stock ?? 0),
    isPublished: toBoolean(input.isPublished),
  };
}

function toOrderItem(input: UnknownRecord): Order['items'][number] {
  return {
    productId: String(input.productId ?? ''),
    colorVariantId: String(input.colorVariantId ?? ''),
    name: String(input.name ?? ''),
    size: String(input.size ?? '') as SizeKey,
    color: String(input.color ?? ''),
    quantity: Number(input.quantity ?? 0),
    price: Number(input.price ?? 0),
  };
}

function toOrder(input: UnknownRecord): Order {
  const customerInfoRaw =
    input.customerInfo && typeof input.customerInfo === 'object'
      ? (input.customerInfo as UnknownRecord)
      : {};

  return {
    _id: String(input._id ?? ''),
    orderNumber: String(input.orderNumber ?? ''),
    customerId: toStringOrUndefined(input.customerId),
    customerInfo: {
      name: String(customerInfoRaw.name ?? ''),
      email: String(customerInfoRaw.email ?? ''),
      phone: String(customerInfoRaw.phone ?? ''),
      address: toStringOrUndefined(customerInfoRaw.address),
    },
    items: Array.isArray(input.items)
      ? input.items
          .filter((item): item is UnknownRecord => Boolean(item) && typeof item === 'object')
          .map(toOrderItem)
      : [],
    subtotal: Number(input.subtotal ?? 0),
    shippingFee: Number(input.shippingFee ?? 0),
    total: Number(input.total ?? 0),
    deliveryMethod: (input.deliveryMethod === 'pickup' ? 'pickup' : 'shipping') as
      | 'shipping'
      | 'pickup',
    paymentMethod: 'cod',
    status: String(input.status ?? 'pending') as Order['status'],
    notes: toStringOrUndefined(input.notes),
    createdAt: Number(input.createdAt ?? 0),
    updatedAt: Number(input.updatedAt ?? 0),
  };
}

function toUser(input: UnknownRecord): User {
  return {
    _id: String(input._id ?? ''),
    email: String(input.email ?? ''),
    name: String(input.name ?? ''),
    phone: toStringOrUndefined(input.phone),
    role: input.role === 'admin' ? 'admin' : 'customer',
    betterAuthId: String(input.betterAuthId ?? ''),
    isActive: toBoolean(input.isActive),
    createdAt: Number(input.createdAt ?? 0),
  };
}

const refs = {
  categoriesList: makeFunctionReference<'query'>('categories:list'),
  categoryById: makeFunctionReference<'query'>('categories:byId'),
  categoryCreate: makeFunctionReference<'mutation'>('categories:create'),
  categoryUpdate: makeFunctionReference<'mutation'>('categories:update'),
  categoryDelete: makeFunctionReference<'mutation'>('categories:remove'),
  categoryDeactivate: makeFunctionReference<'mutation'>('categories:deactivate'),
  categoryReactivate: makeFunctionReference<'mutation'>('categories:reactivate'),
  settingsGet: makeFunctionReference<'query'>('settings:get'),

  productsList: makeFunctionReference<'query'>('products:list'),
  productById: makeFunctionReference<'query'>('products:byId'),
  productBySlug: makeFunctionReference<'query'>('products:bySlug'),
  productCreate: makeFunctionReference<'mutation'>('products:create'),
  productUpdate: makeFunctionReference<'mutation'>('products:update'),
  productSoftDelete: makeFunctionReference<'mutation'>('products:softDelete'),
  productDuplicate: makeFunctionReference<'mutation'>('products:duplicate'),
  productToggleBulkStatus: makeFunctionReference<'mutation'>('products:toggleBulkStatus'),

  inventoryListFlattened: makeFunctionReference<'query'>('inventory:listFlattened'),
  inventoryUpdateStock: makeFunctionReference<'mutation'>('inventory:updateStockWithAudit'),
  inventoryListAuditLogs: makeFunctionReference<'query'>('inventory:listAuditLogs'),
  ordersList: makeFunctionReference<'query'>('orders:list'),
  orderDetail: makeFunctionReference<'query'>('orders:detail'),
  usersList: makeFunctionReference<'query'>('users:list'),
};

async function listCategories() {
  const convex = getConvexClient();
  const rows = (await convex.query(refs.categoriesList, {})) as UnknownRecord[];
  return rows.map(toCategory).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function listProducts(publishedOnly?: boolean) {
  const convex = getConvexClient();
  const rows = (await convex.query(refs.productsList, { publishedOnly })) as UnknownRecord[];
  return rows.map(toProduct);
}

function filterByCategorySlug(
  categorySlug: string,
  categories: Category[],
  products: Product[]
): Product[] {
  if (categorySlug === 'sale') {
    return products.filter((item) => {
      const base = item.basePrice ?? 0;
      const sale = item.salePrice ?? 0;
      return sale > 0 && sale < base;
    });
  }

  if (categorySlug === 'new') {
    const category = categories.find((item) => item.slug === 'new' && !item.parentId);
    return category ? products.filter((item) => item.categoryId === category._id) : products;
  }

  const parent = categories.find((item) => item.slug === categorySlug && !item.parentId);
  if (!parent) return products;

  const children = categories.filter((item) => item.parentId === parent._id);
  if (children.length === 0) {
    return products.filter((item) => item.categoryId === parent._id);
  }

  const childIds = new Set(children.map((item) => item._id));
  return products.filter((item) => childIds.has(item.categoryId));
}

function createProductRepository(): ProductRepository {
  return {
    async list(options) {
      return listProducts(options?.publishedOnly);
    },

    async listFeatured() {
      const rows = await listProducts(true);
      return rows.filter((item) => item.isFeatured);
    },

    async listByCategorySlug(categorySlug) {
      const [categories, products] = await Promise.all([listCategories(), listProducts(true)]);
      return filterByCategorySlug(categorySlug, categories, products);
    },

    async listBySubcategorySlugs(categorySlug, subcategorySlug) {
      const [categories, products] = await Promise.all([listCategories(), listProducts(true)]);
      const parent = categories.find((item) => item.slug === categorySlug && !item.parentId);
      if (!parent) return [];

      const subcategory = categories.find(
        (item) => item.slug === subcategorySlug && item.parentId === parent._id
      );
      if (!subcategory) return [];

      return products.filter((item) => item.categoryId === subcategory._id);
    },

    async listRelatedBySlug(slug, limit = 4) {
      const products = await listProducts(true);
      return products.filter((item) => item.slug !== slug).slice(0, limit);
    },

    async getById(id) {
      const convex = getConvexClient();
      const row = (await convex.query(refs.productById, { id })) as UnknownRecord | null;
      return row ? toProduct(row) : undefined;
    },

    async getBySlug(slug, options) {
      const convex = getConvexClient();
      const row = (await convex.query(refs.productBySlug, {
        slug,
        publishedOnly: options?.publishedOnly ?? true,
      })) as UnknownRecord | null;
      return row ? toProduct(row) : undefined;
    },

    async create(input) {
      const convex = getConvexClient();
      const id = (await convex.mutation(
        refs.productCreate,
        input as unknown as ProductUpsertInput
      )) as string;
      const created = await this.getById(id);
      if (!created) {
        throw new Error('Failed to fetch created product.');
      }
      return created;
    },

    async update(id, input) {
      const convex = getConvexClient();
      await convex.mutation(refs.productUpdate, {
        id,
        ...input,
      });
      const updated = await this.getById(id);
      if (!updated) {
        throw new Error('Failed to fetch updated product.');
      }
      return updated;
    },

    async softDelete(id) {
      const convex = getConvexClient();
      await convex.mutation(refs.productSoftDelete, { id });
    },

    async duplicate(id) {
      const convex = getConvexClient();
      const duplicatedId = (await convex.mutation(refs.productDuplicate, { id })) as string;
      const duplicated = await this.getById(duplicatedId);
      if (!duplicated) {
        throw new Error('Failed to fetch duplicated product.');
      }
      return duplicated;
    },

    async toggleBulkStatus(ids, isPublished) {
      const convex = getConvexClient();
      const updated = (await convex.mutation(refs.productToggleBulkStatus, {
        ids,
        isPublished,
      })) as number;
      return updated;
    },
  };
}

function createCategoryRepository(): CategoryRepository {
  return {
    async list(options) {
      const categories = await listCategories();
      if (options?.activeOnly === false) {
        return categories;
      }
      return categories.filter((category) => category.isActive);
    },

    async getById(id) {
      const convex = getConvexClient();
      const row = (await convex.query(refs.categoryById, { id })) as UnknownRecord | null;
      return row ? toCategory(row) : undefined;
    },

    async create(input: CategoryUpsertInput) {
      const convex = getConvexClient();
      const createdId = (await convex.mutation(refs.categoryCreate, input)) as string;
      const category = await this.getById(createdId);
      if (!category) {
        throw new Error('Failed to fetch created category.');
      }
      return category;
    },

    async update(id, input: CategoryUpsertInput) {
      const convex = getConvexClient();
      await convex.mutation(refs.categoryUpdate, {
        id,
        ...input,
      });
      const category = await this.getById(id);
      if (!category) {
        throw new Error('Failed to fetch updated category.');
      }
      return category;
    },

    async delete(id) {
      const convex = getConvexClient();
      await convex.mutation(refs.categoryDelete, { id });
    },

    async deactivate(id) {
      const convex = getConvexClient();
      await convex.mutation(refs.categoryDeactivate, { id });
    },

    async reactivate(id) {
      const convex = getConvexClient();
      await convex.mutation(refs.categoryReactivate, { id });
    },
  };
}

function createSettingsRepository(): SettingsRepository {
  return {
    async get() {
      const convex = getConvexClient();
      const row = (await convex.query(refs.settingsGet, {})) as UnknownRecord | null;
      return toStoreSettings(row);
    },
  };
}

function createInventoryRepository(): InventoryRepository {
  return {
    async listFlattened() {
      const convex = getConvexClient();
      const rows = (await convex.query(refs.inventoryListFlattened, {})) as UnknownRecord[];
      return rows.map(toInventoryRow);
    },

    async updateStock(input: UpdateStockInput) {
      const convex = getConvexClient();
      const result = (await convex.mutation(refs.inventoryUpdateStock, input)) as {
        row: UnknownRecord;
        log: UnknownRecord | null;
      };

      return {
        row: toInventoryRow(result.row),
        log: toInventoryAuditLog(
          result.log ?? {
            _id: `${result.row.productId}-${result.row.variantId}-${result.row.size}`,
            productId: result.row.productId,
            variantId: result.row.variantId,
            size: result.row.size,
            oldValue: result.row.stock,
            newValue: result.row.stock,
            changedBy: input.changedBy,
            changedAt: Date.now(),
          }
        ),
      };
    },

    async listAuditLogs(input) {
      const convex = getConvexClient();
      const rows = (await convex.query(refs.inventoryListAuditLogs, {
        productId: input.productId,
        variantId: input.variantId,
        size: input.size,
        limit: input.limit,
      })) as UnknownRecord[];

      return rows.map(toInventoryAuditLog);
    },
  };
}

function createOrdersRepository(): OrdersRepository {
  return {
    async list() {
      const convex = getConvexClient();
      const rows = (await convex.query(refs.ordersList, {})) as UnknownRecord[];
      return rows.map(toOrder);
    },

    async getById(id) {
      const convex = getConvexClient();
      const row = (await convex.query(refs.orderDetail, {
        id,
      })) as UnknownRecord | null;
      return row ? toOrder(row) : undefined;
    },
  };
}

function createUsersRepository(): UsersRepository {
  return {
    async list() {
      const convex = getConvexClient();
      const rows = (await convex.query(refs.usersList, {})) as UnknownRecord[];
      return rows.map(toUser);
    },

    async getById(id) {
      const users = await this.list();
      return users.find((user) => user._id === id);
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

function buildRevenueSeries(orders: Order[], range: RevenueRange): RevenueSeriesPoint[] {
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

  for (const order of orders) {
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
      const [orders, products, users] = await Promise.all([
        createOrdersRepository().list(),
        createProductRepository().list({ publishedOnly: false }),
        createUsersRepository().list(),
      ]);

      return {
        totalRevenueMmk: orders
          .filter((order) => order.status !== 'cancelled')
          .reduce((sum, order) => sum + order.total, 0),
        pendingOrders: orders.filter((order) => order.status === 'pending').length,
        activeProducts: products.filter((product) => product.isPublished).length,
        activeAccounts: users.filter((user) => user.isActive).length,
      };
    },

    async getRevenueSeries(range) {
      const orders = await createOrdersRepository().list();
      return buildRevenueSeries(orders, range);
    },
  };
}

export function createConvexRepositories(): DataRepositories {
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
