'use client';

import { useAppStore } from '@/store/app-store';
import ProjectsGrid from '@/components/projects-grid';
import WhiteboardEditor from '@/components/whiteboard-editor';

export default function Home() {
  const view = useAppStore((s) => s.view);

  if (view === 'editor') {
    return <WhiteboardEditor />;
  }

  return <ProjectsGrid />;
}
