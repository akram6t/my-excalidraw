'use client';

import { ThemeProvider } from '@/lib/theme-context';
import AuthProvider from '@/components/auth/auth-provider';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
