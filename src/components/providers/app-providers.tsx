'use client';

import { ThemeProvider } from 'next-themes';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/components/store/cart-context';

/**
 * Wraps application content with theme, tooltip, and cart providers and adds a toaster.
 *
 * @param children - The React node(s) to be wrapped by the provider hierarchy.
 * @returns A React element containing the provider hierarchy that wraps `children` and renders a toaster. 
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <CartProvider>
          {children}
          <Toaster richColors position="top-right" />
        </CartProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
