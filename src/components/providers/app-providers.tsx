'use client';

import { ThemeProvider } from 'next-themes';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/context/cart-context';

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
