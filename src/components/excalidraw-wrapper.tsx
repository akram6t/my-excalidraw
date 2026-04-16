"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";

// ── Lazy-load Excalidraw entirely at runtime (no SSR, no static import) ──
type ExcalidrawModule = React.ComponentType<Record<string, unknown>>;

interface ExcalidrawWrapperProps {
  /** Full excalidraw scene object: { elements, appState, files } */
  initialData?: Record<string, unknown> | null;
  whiteboardId: string | null;
  onChange: (elements: unknown, appState: unknown, files: unknown) => void;
}

export default function ExcalidrawWrapper({
  initialData,
  whiteboardId,
  onChange,
}: ExcalidrawWrapperProps) {
  const [ExcalidrawComponent, setExcalidrawComponent] =
    useState<ExcalidrawModule | null>(null);
  const excalidrawAPIRef = useRef<unknown>(null);
  const { resolvedTheme } = useTheme();

  // Load Excalidraw purely on client
  useEffect(() => {
    import("@excalidraw/excalidraw")
      .then((mod) => {
        setExcalidrawComponent(() => mod.Excalidraw as unknown as ExcalidrawModule);
      })
      .catch((err) => console.error("Failed to load Excalidraw:", err));
  }, []);

  const handleChange = useCallback(
    (elements: unknown, appState: unknown, files: unknown) => {
      onChange(elements, appState, files);
    },
    [onChange]
  );

  if (!ExcalidrawComponent) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading whiteboard…</p>
        </div>
      </div>
    );
  }

  const Excalidraw = ExcalidrawComponent;

  return (
    <Excalidraw
      key={whiteboardId || "default"}
      initialData={initialData ?? undefined}
      onChange={handleChange}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      excalidrawAPI={(api: unknown) => {
        excalidrawAPIRef.current = api;
      }}
    />
  );
}
