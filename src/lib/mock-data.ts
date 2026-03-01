import { BRAND, DEFAULT_SHIPPING_FEE } from '@/lib/constants';
import { Category, InventoryAuditLog, Order, Product, StoreSettings, User } from '@/lib/types';

const now = Date.now();

export const categories: Category[] = [
  {
    _id: 'cat-men',
    name: 'MEN',
    slug: 'men',
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'cat-women',
    name: 'WOMEN',
    slug: 'women',
    sortOrder: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'cat-new',
    name: 'NEW',
    slug: 'new',
    sortOrder: 3,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'cat-sale',
    name: 'SALE',
    slug: 'sale',
    sortOrder: 4,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'cat-men-shirts',
    name: 'Shirts',
    slug: 'shirts',
    parentId: 'cat-men',
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'cat-women-shirts',
    name: 'Shirts',
    slug: 'shirts',
    parentId: 'cat-women',
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const products: Product[] = [
  {
    _id: 'prod-001',
    sku: 'KHT-MEN-001',
    name: 'Relaxed Linen Shirt',
    slug: 'relaxed-linen-shirt',
    description: 'A breathable linen shirt tailored for Yangon weather.',
    categoryId: 'cat-men-shirts',
    basePrice: 56000,
    salePrice: 49000,
    isFeatured: true,
    isPublished: true,
    colorVariants: [
      {
        id: 'variant-001-navy',
        colorName: 'Navy Blue',
        colorHex: '#001F3F',
        images: ['/products/linen-navy-1.jpg', '/products/linen-navy-2.jpg'],
        selectedSizes: ['S', 'M', 'L', 'XL'],
        stock: { S: 8, M: 14, L: 11, XL: 4 },
      },
      {
        id: 'variant-001-white',
        colorName: 'White',
        colorHex: '#F6F6F6',
        images: ['/products/linen-white-1.jpg', '/products/linen-white-2.jpg'],
        selectedSizes: ['S', 'M', 'L'],
        stock: { S: 7, M: 9, L: 3 },
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'prod-002',
    sku: 'KHT-WMN-001',
    name: 'Structured Cotton Shirt',
    slug: 'structured-cotton-shirt',
    description: 'Clean lines with a crisp cotton finish for daily wear.',
    categoryId: 'cat-women-shirts',
    basePrice: 52000,
    isFeatured: true,
    isPublished: true,
    colorVariants: [
      {
        id: 'variant-002-black',
        colorName: 'Black',
        colorHex: '#111111',
        images: ['/products/cotton-black-1.jpg', '/products/cotton-black-2.jpg'],
        selectedSizes: ['XS', 'S', 'M', 'L'],
        stock: { XS: 5, S: 8, M: 6, L: 2 },
      },
      {
        id: 'variant-002-sand',
        colorName: 'Sand',
        colorHex: '#D6C7A1',
        images: ['/products/cotton-sand-1.jpg', '/products/cotton-sand-2.jpg'],
        selectedSizes: ['XS', 'S', 'M', 'L'],
        stock: { XS: 2, S: 5, M: 4, L: 0 },
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'prod-003',
    sku: 'KHT-NEW-001',
    name: 'Oversized Oxford Shirt',
    slug: 'oversized-oxford-shirt',
    description: 'Modern oversized silhouette with soft oxford fabric.',
    categoryId: 'cat-new',
    basePrice: 61000,
    salePrice: 55000,
    isFeatured: true,
    isPublished: true,
    colorVariants: [
      {
        id: 'variant-003-sky',
        colorName: 'Sky Blue',
        colorHex: '#87CEEB',
        images: ['/products/oxford-sky-1.jpg', '/products/oxford-sky-2.jpg'],
        selectedSizes: ['S', 'M', 'L', 'XL'],
        stock: { S: 10, M: 13, L: 5, XL: 2 },
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

export const users: User[] = [
  {
    _id: 'user-001',
    email: 'zweaungnaing.info@gmail.com',
    name: 'Zwe Aung Naing',
    phone: '+95973159230',
    role: 'admin',
    betterAuthId: 'ba-001',
    isActive: true,
    createdAt: now,
  },
  {
    _id: 'user-002',
    email: 'customer@example.com',
    name: 'May Thu',
    phone: '+95912345678',
    role: 'customer',
    betterAuthId: 'ba-002',
    isActive: true,
    createdAt: now,
  },
];

export const orders: Order[] = [
  {
    _id: 'ord-001',
    orderNumber: 'ORD-2026-0001',
    customerId: 'user-002',
    customerInfo: {
      name: 'May Thu',
      email: 'customer@example.com',
      phone: '+95912345678',
      address: 'Yankin Township, Yangon',
    },
    items: [
      {
        productId: 'prod-001',
        colorVariantId: 'variant-001-navy',
        name: 'Relaxed Linen Shirt',
        size: 'M',
        color: 'Navy Blue',
        quantity: 1,
        price: 49000,
      },
    ],
    subtotal: 49000,
    shippingFee: DEFAULT_SHIPPING_FEE,
    total: 51500,
    deliveryMethod: 'shipping',
    paymentMethod: 'cod',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'ord-002',
    orderNumber: 'ORD-2026-0002',
    customerInfo: {
      name: 'Aung Min',
      email: 'guest@example.com',
      phone: '+95987654321',
    },
    items: [
      {
        productId: 'prod-003',
        colorVariantId: 'variant-003-sky',
        name: 'Oversized Oxford Shirt',
        size: 'L',
        color: 'Sky Blue',
        quantity: 1,
        price: 55000,
      },
    ],
    subtotal: 55000,
    shippingFee: 0,
    total: 55000,
    deliveryMethod: 'pickup',
    paymentMethod: 'cod',
    status: 'confirmed',
    notes: 'Pickup after office hours if possible',
    createdAt: now,
    updatedAt: now,
  },
];

export const storeSettings: StoreSettings = {
  _id: 'store-settings',
  heroTitle: 'Modern Local Shirts for Everyday Yangon',
  heroSubtitle: 'Minimal silhouettes. Local quality. COD available nationwide.',
  heroImageUrl: '/hero/khit-hero.jpg',
  heroCtaLabel: 'Shop New Arrivals',
  heroCtaLink: '/new',
  saleBannerEnabled: true,
  saleBannerText: 'Mid-season sale up to 20% off selected shirts',
  saleBannerLink: '/sale',
  announcementBar: 'Free store pickup for all orders in Yangon.',
  contactEmail: BRAND.contactEmail,
  contactPhone: BRAND.contactPhone,
  pickupAddress: BRAND.pickupAddress,
  pickupHours: BRAND.pickupHours,
  socialInstagram: 'https://instagram.com/khit.mm',
  socialFacebook: 'https://facebook.com/khit.mm',
  socialTiktok: 'https://tiktok.com/@khit.mm',
  featuredProductIds: ['prod-001', 'prod-002', 'prod-003'],
  updatedAt: now,
};

export const inventoryAuditLogs: InventoryAuditLog[] = [
  {
    _id: 'log-001',
    productId: 'prod-001',
    variantId: 'variant-001-navy',
    size: 'M',
    oldValue: 12,
    newValue: 14,
    changedBy: 'zweaungnaing.info@gmail.com',
    changedAt: now - 1000 * 60 * 60 * 4,
  },
  {
    _id: 'log-002',
    productId: 'prod-002',
    variantId: 'variant-002-sand',
    size: 'L',
    oldValue: 1,
    newValue: 0,
    changedBy: 'zweaungnaing.info@gmail.com',
    changedAt: now - 1000 * 60 * 80,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug && product.isPublished);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  if (categorySlug === 'new') {
    return products.filter((item) => item.categoryId === 'cat-new');
  }

  if (categorySlug === 'sale') {
    return products.filter((item) => item.salePrice && item.salePrice < (item.basePrice ?? 0));
  }

  const category = categories.find((item) => item.slug === categorySlug && !item.parentId);
  if (!category) {
    return products;
  }

  const childCategoryIds = categories
    .filter((item) => item.parentId === category._id)
    .map((item) => item._id);
  return products.filter((item) => childCategoryIds.includes(item.categoryId));
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.isFeatured && product.isPublished);
}
