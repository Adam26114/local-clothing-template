import type {
  Category,
  InventoryAuditLog,
  Order,
  Product,
  SizeKey,
  StoreSettings,
  User,
} from '@/lib/types';

export type ProductUpsertInput = Omit<Product, '_id' | 'createdAt' | 'updatedAt'>;
export type CategoryUpsertInput = {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
};

export type InventoryRow = {
  productId: string;
  productName: string;
  variantId: string;
  colorName: string;
  size: SizeKey;
  stock: number;
  isPublished: boolean;
};

export type UpdateStockInput = {
  productId: string;
  variantId: string;
  size: SizeKey;
  newValue: number;
  changedBy: string;
};

export type RevenueRange = '90d' | '30d' | '7d';

export type RevenueSeriesPoint = {
  date: string;
  revenue: number;
  orderCount: number;
};

export type DashboardKpi = {
  totalRevenueMmk: number;
  pendingOrders: number;
  activeProducts: number;
  activeAccounts: number;
};

export interface ProductRepository {
  list(options?: { publishedOnly?: boolean }): Promise<Product[]>;
  listFeatured(): Promise<Product[]>;
  listByCategorySlug(categorySlug: string): Promise<Product[]>;
  listBySubcategorySlugs(categorySlug: string, subcategorySlug: string): Promise<Product[]>;
  listRelatedBySlug(slug: string, limit?: number): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  getBySlug(slug: string, options?: { publishedOnly?: boolean }): Promise<Product | undefined>;
  create(input: ProductUpsertInput): Promise<Product>;
  update(id: string, input: ProductUpsertInput): Promise<Product>;
  softDelete(id: string): Promise<void>;
  duplicate(id: string): Promise<Product>;
  toggleBulkStatus(ids: string[], isPublished: boolean): Promise<number>;
}

export interface CategoryRepository {
  list(options?: { activeOnly?: boolean }): Promise<Category[]>;
  getById(id: string): Promise<Category | undefined>;
  create(input: CategoryUpsertInput): Promise<Category>;
  update(id: string, input: CategoryUpsertInput): Promise<Category>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<StoreSettings>;
}

export interface InventoryRepository {
  listFlattened(): Promise<InventoryRow[]>;
  updateStock(input: UpdateStockInput): Promise<{ row: InventoryRow; log: InventoryAuditLog }>;
  listAuditLogs(input: {
    productId?: string;
    variantId?: string;
    size?: SizeKey;
    limit?: number;
  }): Promise<InventoryAuditLog[]>;
}

export interface OrdersRepository {
  list(): Promise<Order[]>;
  getById(id: string): Promise<Order | undefined>;
}

export interface UsersRepository {
  list(): Promise<User[]>;
  getById(id: string): Promise<User | undefined>;
}

export interface DashboardRepository {
  getKpis(): Promise<DashboardKpi>;
  getRevenueSeries(range: RevenueRange): Promise<RevenueSeriesPoint[]>;
}

export type DataRepositories = {
  products: ProductRepository;
  categories: CategoryRepository;
  settings: SettingsRepository;
  inventory: InventoryRepository;
  orders: OrdersRepository;
  users: UsersRepository;
  dashboard: DashboardRepository;
};
