"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, BinaryFileData } from "@excalidraw/excalidraw/types";
import { useTheme } from "next-themes";
import { useEffect, useRef, useCallback } from "react";
import "@excalidraw/excalidraw/index.css";

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
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const { resolvedTheme } = useTheme();

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

  // Expose API ref to parent via window (or could use a callback prop)
  useEffect(() => {
    return () => {
      excalidrawAPIRef.current = null;
    };
  }, []);

  return (
    <Excalidraw
      key={whiteboardId || "default"}
      initialData={initialData || undefined}
      onChange={handleChange}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      excalidrawAPI={(api) => {
        excalidrawAPIRef.current = api;
      }}
    />
  );
}
