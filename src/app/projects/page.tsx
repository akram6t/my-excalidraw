'use client';

import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import ProjectsGrid from '@/components/projects-grid';

export default function ProjectsPage() {
  const { isAuthenticated } = useAppStore();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push('/login');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return <ProjectsGrid />;
}
