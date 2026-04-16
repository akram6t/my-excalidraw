'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import WhiteboardEditor from '@/components/whiteboard-editor';

export default function ProjectPage() {
  const { isAuthenticated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return <WhiteboardEditor />;
}
