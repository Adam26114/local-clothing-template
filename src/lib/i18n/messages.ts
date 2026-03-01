export const messages = {
  en: {
    common: {
      brandName: 'Khit',
      addToCart: 'Add to Cart',
      checkout: 'Checkout',
      login: 'Log In',
      register: 'Register',
    },
    nav: {
      men: 'Men',
      women: 'Women',
      new: 'New',
      sale: 'Sale',
    },
  },
  my: {
    common: {
      brandName: 'ခေတ်',
      addToCart: 'စျေးဝယ်ခြင်းထဲ ထည့်မည်',
      checkout: 'ငွေရှင်းမည်',
      login: 'ဝင်မည်',
      register: 'စာရင်းသွင်းမည်',
    },
    nav: {
      men: 'အမျိုးသား',
      women: 'အမျိုးသမီး',
      new: 'အသစ်',
      sale: 'အရောင်းလျှော့',
    },
  },
} as const;

export type Locale = keyof typeof messages;

export function getLocale(): Locale {
  return 'en';
}
