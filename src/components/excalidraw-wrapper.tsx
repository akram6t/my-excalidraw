'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useTheme } from 'next-themes';
import '@excalidraw/excalidraw/index.css';

interface ExcalidrawWrapperProps {
  initialData?: string | null;
  whiteboardId: string | null;
  onChange: (elements: unknown, appState: unknown, files: unknown) => void;
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

  // Parse initial data
  const parsedData = initialData ? (() => {
    try {
      return JSON.parse(initialData);
    } catch {
      return null;
    }
  })() : null;

  const handleChange = useCallback(
    (elements: unknown, appState: unknown, files: unknown) => {
      onChange(elements, appState, files);
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

  const Excalidraw = ExcalidrawComponent as React.ComponentType<{
    initialData?: unknown;
    onChange?: (elements: unknown, appState: unknown, files: unknown) => void;
    theme?: 'light' | 'dark';
    excalidrawAPI?: (api: ExcalidrawImperativeAPI) => void;
    key?: string;
    UIOptions?: {
      canvasActions?: {
        loadScene?: boolean;
        export?: boolean;
        saveToActiveFile?: boolean;
        theme?: boolean;
        changeViewBackgroundColor?: boolean;
        clearCanvas?: boolean;
      };
    };
    viewModeEnabled?: boolean;
  }>;

  return (
    <Excalidraw
      key={whiteboardId || 'default'}
      initialData={parsedData}
      onChange={handleChange}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      excalidrawAPI={(api) => {
        excalidrawAPIRef.current = api;
      }}
      UIOptions={{
        canvasActions: {
          loadScene: true,
          export: true,
          theme: false,
          changeViewBackgroundColor: true,
          clearCanvas: true,
        },
      }}
    />
  );
}
