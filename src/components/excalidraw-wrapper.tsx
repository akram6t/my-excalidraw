'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExcalidrawImperativeAPI, BinaryFileData } from '@excalidraw/excalidraw/types';
import { useTheme } from 'next-themes';
import '@excalidraw/excalidraw/index.css';

interface ExcalidrawWrapperProps {
  initialData?: Record<string, unknown> | null;
  whiteboardId: string | null;
  onChange: (data: {
    elements: unknown;
    appState: Record<string, unknown>;
    files: Record<string, BinaryFileData>;
  }) => void;
}

export default function ExcalidrawWrapper({
  initialData,
  whiteboardId,
  onChange,
}: ExcalidrawWrapperProps) {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const { resolvedTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import Excalidraw to avoid SSR issues
    import('@excalidraw/excalidraw').then((mod) => {
      setExcalidrawComponent(() => mod.Excalidraw);
      setIsLoaded(true);
    });
  }, []);

  // Upload binary files to cloud storage when they're added
  const uploadBinaryFile = useCallback(
    async (fileId: string, fileData: BinaryFileData) => {
      if (!whiteboardId || !fileData.data || typeof fileData.data === 'string') return;

      try {
        const blob = new Blob([fileData.data], { type: fileData.mimeType || 'application/octet-stream' });
        const formData = new FormData();
        formData.append('boardId', whiteboardId);
        formData.append('fileId', fileId);
        formData.append('mimeType', fileData.mimeType || 'application/octet-stream');
        formData.append('file', blob, `${fileId}`);

        const res = await fetch('/api/storage/upload-file', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          // Return a reference with the cloud URL instead of raw binary
          return result.url;
        }
      } catch (error) {
        console.error('Failed to upload binary file to cloud:', error);
      }
      return null;
    },
    [whiteboardId]
  );

  const handleChange = useCallback(
    (elements: unknown, appState: unknown, files: unknown) => {
      onChange({
        elements,
        appState: appState as Record<string, unknown>,
        files: files as Record<string, BinaryFileData>,
      });
    },
    [onChange]
  );

  if (!ExcalidrawComponent || !isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Excalidraw
      key={whiteboardId || 'default'}
      initialData={initialData || undefined}
      onChange={handleChange}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      excalidrawAPI={(api) => {
        excalidrawAPIRef.current = api;
      }}
    />
  );
}
