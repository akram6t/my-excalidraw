"use client";

import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(() => import("./excalidraw-wrapper"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  ),
});

export default ExcalidrawWrapper;
