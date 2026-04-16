'use client';

import { ThemeProvider } from './theme-provider';
import AuthProvider from '@/components/auth/auth-provider';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
