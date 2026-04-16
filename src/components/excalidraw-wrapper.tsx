"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useTheme } from "next-themes";
// Static CSS import — safe here because this component is only loaded client-side
// via dynamic() with ssr:false in excalidraw.tsx
import "@excalidraw/excalidraw/index.css";

// ── Lazy-load Excalidraw entirely at runtime (no SSR, no static import) ──
type ExcalidrawModule = React.ComponentType<Record<string, unknown>>;

// Minimal type for the excalidrawAPI — only what we need
interface ExcalidrawImperativeAPI {
  updateLibrary: (opts: {
    libraryItems: Array<Record<string, unknown>>;
    merge?: boolean;
    defaultStatus?: string;
    openLibraryMenu?: boolean;
  }) => Promise<void>;
}

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

// ── Library loading with module-level cache ──
let librariesCache: Array<Record<string, unknown>> | null = null;
let librariesLoading: Promise<Array<Record<string, unknown>> | null> | null = null;

function fetchLibraries(): Promise<Array<Record<string, unknown>> | null> {
  if (librariesCache) return Promise.resolve(librariesCache);
  if (librariesLoading) return librariesLoading;

  librariesLoading = fetch("/api/libraries")
    .then((res) => {
      if (!res.ok) return null;
      return res.json();
    })
    .then((data) => {
      if (data?.items && Array.isArray(data.items)) {
        librariesCache = data.items;
        return data.items;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      librariesLoading = null;
    });

  return librariesLoading;
}

export default function ExcalidrawWrapper({
  initialData,
  whiteboardId,
  onChange,
}: ExcalidrawWrapperProps) {
  const [ExcalidrawComponent, setExcalidrawComponent] =
    useState<ExcalidrawModule | null>(null);
  const apiReadyRef = useRef(false);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
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

  // Load and inject libraries once Excalidraw API is ready
  useEffect(() => {
    if (!apiReadyRef.current || !apiRef.current) return;

    const inject = (items: Array<Record<string, unknown>>) => {
      if (!apiRef.current || items.length === 0) return;
      apiRef.current
        .updateLibrary({
          libraryItems: items,
          merge: true,
          defaultStatus: "published",
        })
        .then(() => console.log(`Loaded ${items.length} library items`))
        .catch((err: unknown) => console.warn("Library load failed:", err));
    };

    if (librariesCache) {
      inject(librariesCache);
      return;
    }

    fetchLibraries().then((items) => {
      if (items) inject(items);
    });
  }, [!!apiReadyRef.current]);

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
          apiRef.current = api as ExcalidrawImperativeAPI;
          apiReadyRef.current = true;
        }}
      />
    </div>
  );
}
