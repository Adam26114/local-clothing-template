import { ORDER_STATUSES, ROLE_VALUES } from '@/lib/constants';

export type Role = (typeof ROLE_VALUES)[number];
export type DeliveryMethod = 'shipping' | 'pickup';
export type PaymentMethod = 'cod';
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type SizeKey = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type VariantMeasurement = {
  shoulder?: number;
  chest?: number;
  sleeve?: number;
  waist?: number;
  length?: number;
};

export type ColorVariant = {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  selectedSizes: SizeKey[];
  stock: Partial<Record<SizeKey, number>>;
  measurements?: Partial<Record<SizeKey, VariantMeasurement>>;
};

export type User = {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  betterAuthId: string;
  isActive: boolean;
  createdAt: number;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Product = {
  _id: string;
  sku?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice?: number;
  salePrice?: number;
  isFeatured: boolean;
  isPublished: boolean;
  colorVariants: ColorVariant[];
  createdAt: number;
  updatedAt: number;
};

export type CartItem = {
  _id: string;
  userId?: string;
  productId: string;
  colorVariantId: string;
  size: SizeKey;
  quantity: number;
  addedAt: number;
  updatedAt: number;
};

export type WishlistItem = {
  _id: string;
  userId?: string;
  productId: string;
  colorVariantId?: string;
  size?: SizeKey;
  addedAt: number;
};

export type OrderItem = {
  productId: string;
  colorVariantId: string;
  name: string;
  size: SizeKey;
  color: string;
  quantity: number;
  price: number;
};

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
  address?: string;
};

export type Order = {
  _id: string;
  orderNumber: string;
  customerId?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type StoreSettings = {
  _id: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  heroCtaLabel?: string;
  heroCtaLink?: string;
  saleBannerEnabled?: boolean;
  saleBannerText?: string;
  saleBannerLink?: string;
  announcementBar?: string;
  contactEmail?: string;
  contactPhone?: string;
  pickupAddress?: string;
  pickupHours?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
  featuredProductIds?: string[];
  updatedAt: number;
};

export type InventoryAuditLog = {
  _id: string;
  productId: string;
  variantId: string;
  size: SizeKey;
  oldValue: number;
  newValue: number;
  changedBy: string;
  changedAt: number;
};
