'use client';

import dynamic from 'next/dynamic';

const ExcalidrawWrapper = dynamic(
  () => import('./excalidraw-wrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
        </div>
      </div>
    ),
  }
);

export default ExcalidrawWrapper;
