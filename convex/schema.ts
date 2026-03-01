import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const sizeStock = v.record(v.string(), v.number());
const measurementRecord = v.record(
  v.string(),
  v.object({
    shoulder: v.optional(v.number()),
    chest: v.optional(v.number()),
    sleeve: v.optional(v.number()),
    waist: v.optional(v.number()),
    length: v.optional(v.number()),
  })
);

const colorVariant = v.object({
  id: v.string(),
  colorName: v.string(),
  colorHex: v.string(),
  images: v.array(v.string()),
  selectedSizes: v.array(v.string()),
  stock: sizeStock,
  measurements: v.optional(measurementRecord),
});

export default defineSchema({
  authUsers: defineTable({
    id: v.string(),
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_createdAt', ['createdAt']),

  authSessions: defineTable({
    id: v.string(),
    token: v.string(),
    userId: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_userId', ['userId'])
    .index('by_expiresAt', ['expiresAt']),

  authAccounts: defineTable({
    id: v.string(),
    accountId: v.string(),
    providerId: v.string(),
    userId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_provider_account', ['providerId', 'accountId'])
    .index('by_userId', ['userId']),

  authVerificationTokens: defineTable({
    id: v.string(),
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_value', ['value'])
    .index('by_identifier', ['identifier'])
    .index('by_expiresAt', ['expiresAt']),

  users: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal('customer'), v.literal('admin')),
    betterAuthId: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_betterAuthId', ['betterAuthId']),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_parent', ['parentId'])
    .index('by_active', ['isActive']),

  products: defineTable({
    sku: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    basePrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    isFeatured: v.boolean(),
    isPublished: v.boolean(),
    colorVariants: v.array(colorVariant),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_sku', ['sku'])
    .index('by_category', ['categoryId'])
    .index('by_featured', ['isFeatured'])
    .index('by_active', ['isPublished']),

  cartItems: defineTable({
    userId: v.id('users'),
    productId: v.id('products'),
    colorVariantId: v.string(),
    size: v.string(),
    quantity: v.number(),
    addedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_product_size', ['userId', 'productId', 'size']),

  wishlistItems: defineTable({
    userId: v.id('users'),
    productId: v.id('products'),
    colorVariantId: v.optional(v.string()),
    size: v.optional(v.string()),
    addedAt: v.number(),
  }).index('by_user', ['userId']),

  orders: defineTable({
    orderNumber: v.string(),
    customerId: v.optional(v.id('users')),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      address: v.optional(v.string()),
    }),
    items: v.array(
      v.object({
        productId: v.id('products'),
        colorVariantId: v.string(),
        name: v.string(),
        size: v.string(),
        color: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    subtotal: v.number(),
    shippingFee: v.number(),
    total: v.number(),
    deliveryMethod: v.union(v.literal('shipping'), v.literal('pickup')),
    paymentMethod: v.literal('cod'),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('processing'),
      v.literal('shipped'),
      v.literal('delivered'),
      v.literal('cancelled')
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_orderNumber', ['orderNumber'])
    .index('by_customer', ['customerId'])
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt']),

  storeSettings: defineTable({
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    heroCtaLabel: v.optional(v.string()),
    heroCtaLink: v.optional(v.string()),
    saleBannerEnabled: v.optional(v.boolean()),
    saleBannerText: v.optional(v.string()),
    saleBannerLink: v.optional(v.string()),
    announcementBar: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    pickupAddress: v.optional(v.string()),
    pickupHours: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
    socialFacebook: v.optional(v.string()),
    socialTiktok: v.optional(v.string()),
    featuredProductIds: v.optional(v.array(v.id('products'))),
    updatedAt: v.number(),
  }),

  inventoryAuditLogs: defineTable({
    productId: v.id('products'),
    variantId: v.string(),
    size: v.string(),
    oldValue: v.number(),
    newValue: v.number(),
    changedBy: v.string(),
    changedAt: v.number(),
  })
    .index('by_product', ['productId'])
    .index('by_variant', ['variantId']),
});
