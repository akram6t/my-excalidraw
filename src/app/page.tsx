'use client';

import { useAppStore } from '@/store/app-store';
import LoginForm from '@/components/auth/login-form';
import SignupForm from '@/components/auth/signup-form';
import ForgotPasswordForm from '@/components/auth/forgot-password-form';
import ResetPasswordForm from '@/components/auth/reset-password-form';
import ProjectsGrid from '@/components/projects-grid';
import WhiteboardEditor from '@/components/whiteboard-editor';

export default function Home() {
  const { authView, isAuthenticated, view } = useAppStore();

  // Not authenticated — show auth screens
  if (!isAuthenticated) {
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

  // Authenticated — show app
  return view === 'editor' ? <WhiteboardEditor /> : <ProjectsGrid />;
}
