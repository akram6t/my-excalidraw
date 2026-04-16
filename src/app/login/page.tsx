'use client';

import LoginForm from '@/components/auth/login-form';
import SignupForm from '@/components/auth/signup-form';
import ForgotPasswordForm from '@/components/auth/forgot-password-form';
import ResetPasswordForm from '@/components/auth/reset-password-form';
import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { authView } = useAppStore();

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
