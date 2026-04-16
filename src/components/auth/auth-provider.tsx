'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore, type AuthUser } from '@/store/app-store';

function AuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { setUser, isAuthenticated } = useAppStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const authUser: AuthUser = {
        id: (session.user as Record<string, unknown>).id as string,
        name: session.user.name || '',
        email: session.user.email || '',
      };
      setUser(authUser);
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status, setUser, isAuthenticated]);

  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync>{children}</AuthSync>
    </SessionProvider>
  );
}
