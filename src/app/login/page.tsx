'use client';

import { useEffect } from 'react';
import LoginForm from '@/components/auth/login-form';
import SignupForm from '@/components/auth/signup-form';
import ForgotPasswordForm from '@/components/auth/forgot-password-form';
import ResetPasswordForm from '@/components/auth/reset-password-form';
import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { isAuthenticated, authView } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/projects');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  switch (authView) {
    case 'signup':
      return <SignupForm />;
    case 'forgot-password':
      return <ForgotPasswordForm />;
    case 'reset-password':
      return <ResetPasswordForm />;
    case 'login':
    default:
      return <LoginForm />;
  }
}
