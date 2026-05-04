import { BRAND, DEFAULT_SHIPPING_FEE } from '@/lib/constants';
import {
  Category,
  InventoryAuditLog,
  Order,
  Product,
  StoreSettings,
  User,
} from '@/lib/types';
import { isProductVisible } from '@/lib/utils/product-visibility';

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
    _id: 'cat-shirts',
    name: 'Shirts',
    slug: 'shirts',
    parentId: 'cat-men',
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'cat-pants',
    name: 'Pants',
    slug: 'pants',
    parentId: 'cat-men',
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const users: User[] = [
  {
    _id: 'user-admin',
    email: 'zweaungnaing.info@gmail.com',
    name: 'Admin User',
    phone: '+95973159230',
    role: 'admin',
    betterAuthId: 'admin',
    isActive: true,
    createdAt: now,
  },
];

const productBase = {
  createdAt: now,
  updatedAt: now,
};

export const products: Product[] = [
  {
    _id: 'prod-1',
    name: 'Classic White Shirt',
    slug: 'classic-white-shirt',
    description: 'A timeless white cotton shirt, perfect for any occasion.',
    categoryId: 'cat-shirts',
    basePrice: 25000,
    salePrice: 19999,
    isFeatured: true,
    status: 'published',
    isPublished: true,
    colorVariants: [
      {
        id: 'var-white',
        colorName: 'White',
        colorHex: '#FFFFFF',
        images: ['/placeholder-shirt.jpg'],
        selectedSizes: ['S', 'M', 'L', 'XL'],
        stock: { S: 10, M: 15, L: 8, XL: 5 },
      },
    ],
    ...productBase,
  },
  {
    _id: 'prod-2',
    name: 'Navy Blue Pants',
    slug: 'navy-blue-pants',
    description: 'Comfortable navy blue pants for work or casual wear.',
    categoryId: 'cat-pants',
    basePrice: 35000,
    isFeatured: false,
    status: 'published',
    isPublished: true,
    colorVariants: [
      {
        id: 'var-navy',
        colorName: 'Navy',
        colorHex: '#000080',
        images: ['/placeholder-pants.jpg'],
        selectedSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        stock: { S: 5, M: 12, L: 10, XL: 7, XXL: 3 },
      },
    ],
    ...productBase,
  },
  {
    _id: 'prod-3',
    name: 'Floral Dress',
    slug: 'floral-dress',
    description: 'Beautiful floral print dress for women.',
    categoryId: 'cat-women',
    basePrice: 45000,
    salePrice: 35000,
    isFeatured: true,
    status: 'published',
    isPublished: true,
    colorVariants: [
      {
        id: 'var-floral-pink',
        colorName: 'Floral Pink',
        colorHex: '#FFC0CB',
        images: ['/placeholder-dress.jpg'],
        selectedSizes: ['S', 'M', 'L'],
        stock: { S: 6, M: 8, L: 4 },
      },
    ],
    ...productBase,
  },
  {
    _id: 'prod-4',
    name: 'Relaxed Linen Shirt',
    slug: 'relaxed-linen-shirt',
    description: 'Light and comfortable linen shirt.',
    categoryId: 'cat-shirts',
    basePrice: 35000,
    isFeatured: false,
    status: 'published',
    isPublished: true,
    colorVariants: [
      {
        id: 'var-linen-beige',
        colorName: 'Linen Beige',
        colorHex: '#F5F5DC',
        images: ['/placeholder-linen.jpg'],
        selectedSizes: ['S', 'M', 'L', 'XL'],
        stock: { S: 8, M: 12, L: 10, XL: 6 },
      },
    ],
    ...productBase,
  },
];

export const orders: Order[] = [
  {
    _id: 'order-1',
    orderNumber: 'ORD-2026-0001',
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+959900000001',
      address: 'Yangon',
    },
    items: [
      {
        productId: 'prod-1',
        colorVariantId: 'var-white',
        name: 'Classic White Shirt',
        size: 'M',
        color: 'White',
        quantity: 2,
        price: 19999,
      },
    ],
    subtotal: 39998,
    shippingFee: 2500,
    total: 42498,
    deliveryMethod: 'shipping',
    paymentMethod: 'cod',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  },
];

export const storeSettings: StoreSettings = {
  _id: 'settings-1',
  heroTitle: 'Welcome to Khit',
  heroSubtitle: 'Quality Fashion for Everyone',
  heroCtaLabel: 'Shop Now',
  heroCtaLink: '/men',
  saleBannerEnabled: true,
  saleBannerText: 'Up to 50% Off Sale',
  saleBannerLink: '/sale',
  contactEmail: BRAND.contactEmail,
  contactPhone: BRAND.contactPhone,
  pickupAddress: BRAND.pickupAddress,
  pickupHours: BRAND.pickupHours,
  featuredProductIds: ['prod-1', 'prod-3'],
  updatedAt: now,
};

export const inventoryAuditLogs: InventoryAuditLog[] = [];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((item) => item.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((item) => item.isFeatured && isProductVisible(item));
}

export function getProductsByCategory(categorySlug: string): Product[] {
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) return [];

  if (categorySlug === 'sale') {
    return products.filter((item) => isProductVisible(item) && (item.salePrice ?? 0) < (item.basePrice ?? 0));
  }

  const categoryIds = [category._id];
  const childCategories = categories.filter((item) => item.parentId === category._id);
  childCategories.forEach((child) => categoryIds.push(child._id));

  return products.filter(
    (item) => isProductVisible(item) && categoryIds.includes(item.categoryId)
  );
}