"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useTheme } from "next-themes";
// Static CSS import — safe here because this component is only loaded client-side
// via dynamic() with ssr:false in excalidraw.tsx
import "@excalidraw/excalidraw/index.css";

// ── Lazy-load Excalidraw entirely at runtime (no SSR, no static import) ──
type ExcalidrawModule = React.ComponentType<Record<string, unknown>>;

interface ExcalidrawWrapperProps {
  /** Full excalidraw scene object: { elements, appState, files } */
  initialData?: Record<string, unknown> | null;
  whiteboardId: string | null;
  onChange: (elements: unknown, appState: unknown, files: unknown) => void;
}

/**
 * Sanitize scene data to ensure all fields match Excalidraw's expected types.
 * JSON.stringify/parse can turn arrays into objects, empty arrays into nulls, etc.
 */
function sanitizeSceneData(
  raw: Record<string, unknown> | null | undefined
): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const data = { ...raw };

  // elements must be an array
  if (!Array.isArray(data.elements)) {
    data.elements = Array.isArray(data.elements) ? data.elements : [];
  }

  // appState — strip all fields that are objects/maps or arrays and can break
  // after JSON.stringify/parse. Excalidraw will re-initialize them with defaults.
  if (data.appState && typeof data.appState === "object") {
    const appState = { ...(data.appState as Record<string, unknown>) };

    // These are Record<id, boolean> maps — must be objects, NOT null/arrays
    for (const mapField of [
      "selectedElementIds",
      "selectedGroupIds",
      "bindingElementIds",
    ] as const) {
      const val = appState[mapField];
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        // Remove entirely — Excalidraw initializes fresh
        delete appState[mapField];
      }
    }

    // collaborators must be an array
    if (!Array.isArray(appState.collaborators)) {
      delete appState.collaborators;
    }

    // editingGroupId and pendingImageElementId are strings, keep if string
    for (const strField of ["editingGroupId", "pendingImageElementId"] as const) {
      if (typeof appState[strField] !== "string") {
        delete appState[strField];
      }
    }

    data.appState = appState;
  }

  // files must be an object (or null)
  if (data.files && typeof data.files !== "object") {
    data.files = {};
  }

  return data;
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

  // Sanitize data once — memoized so it doesn't change on re-renders
  const safeInitialData = useMemo(
    () => sanitizeSceneData(initialData),
    [initialData]
  );

  if (!ExcalidrawComponent) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading whiteboard…</p>
        </div>
      </div>
    );
  }

  const Excalidraw = ExcalidrawComponent;

  return (
    <div
      className="excalidraw-wrapper"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Excalidraw
        key={whiteboardId || "default"}
        initialData={safeInitialData}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        excalidrawAPI={(api: unknown) => {
          excalidrawAPIRef.current = api;
        }}
      />
    </div>
  );
}
