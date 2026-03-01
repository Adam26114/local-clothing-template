export const BRAND = {
  name: 'Khit',
  pickupAddress: 'Awbar Street, Kyauk Myoung Gyi Ward, Tamwe Township, Yangon',
  pickupHours: 'Weekdays 10:00 AM - 4:00 PM',
  contactEmail: 'zweaungnaing.info@gmail.com',
  contactPhone: '+95973159230',
};

export const DEFAULT_SHIPPING_FEE = 2500;

export const NAV_CATEGORIES = ['MEN', 'WOMEN', 'NEW', 'SALE'] as const;

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export const ROLE_VALUES = ['customer', 'admin'] as const;

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
