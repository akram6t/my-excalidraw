# Whiteboard Studio - Worklog

---
Task ID: 1
Agent: Main Agent
Task: Integrate Excalidraw API into Next.js app with project management and whiteboard editing

Work Log:
- Read Excalidraw API documentation from official docs
- Explored current project structure (Next.js 16, Tailwind CSS 4, shadcn/ui)
- Installed @excalidraw/excalidraw and next-themes packages
- Designed Prisma schema with Project and Whiteboard models
- Created API routes for projects CRUD (/api/projects)
- Created API routes for whiteboards CRUD (/api/whiteboards)
- Created Zustand store for client-side state management (app-store.ts)
- Built ProjectsGrid component with create/edit/delete dialogs
- Built Excalidraw wrapper with dynamic import (ssr: false)
- Built WhiteboardEditor with collapsible sidebar and theme support
- Added ThemeProvider (next-themes) with multi-theme support
- Wired everything in page.tsx and layout.tsx

Stage Summary:
- Full whiteboard studio application created with:
  - Projects grid at / (home view)
  - Full-screen whiteboard editor with collapsible sidebar
  - Multi-board support per project (each board has individual whiteboard)
  - Auto-save whiteboard data on change (debounced 500ms)
  - Multi-theme support (light/dark) synced with Excalidraw
  - CRUD operations for projects and whiteboards
  - Responsive design using shadcn/ui components

---
Task ID: 2
Agent: Main Agent
Task: Integrate Tigris cloud storage for whiteboard data persistence

Work Log:
- Installed @aws-sdk/client-s3 for S3-compatible Tigris storage
- Created lib/tigris.ts utility with upload/download/delete functions
- Created API routes: /api/storage/upload-scene, /api/storage/download-scene, /api/storage/upload-file
- Updated whiteboard API to save scene data to cloud (with DB fallback)
- Updated whiteboard API to load from cloud first (fallback to DB)
- Updated Excalidraw wrapper to handle binary file uploads to cloud
- Updated whiteboard editor with cloud sync status indicators
- Configured Tigris credentials in .env
- Added graceful fallback: if cloud storage fails, data saves to local DB
- Verified lint passes and app compiles with no errors

Stage Summary:
- Cloud storage integration with graceful fallback:
  - Whiteboard scene data saved to Tigris at scenes/{boardId}/scene.json
  - Binary files (images) uploaded to files/{boardId}/{fileId}
  - Cloud sync status indicator (Cloud icon) in editor top bar
  - If Tigris write access denied, automatically falls back to local SQLite DB
  - Public read URL: https://my-excalidraw.t3.tigrisfiles.io
  - Note: Current credentials appear to be read-only; write requires updated Tigris ACL

---
Task ID: 3
Agent: Main Agent
Task: Fix CanvasRenderingContext2D.setTransform: Canvas exceeds max size error

Work Log:
- Analyzed the root cause: Excalidraw canvas internally tries to match container size, but absolute-positioned containers in sandboxed iframe can compute to extremely large dimensions
- Identified missing Excalidraw CSS import (correct path: @excalidraw/excalidraw/index.css)
- Rewrote whiteboard-editor.tsx layout from absolute positioning to flexbox column layout for reliable dimension calculation
- Added CSS constraints in globals.css: canvas max-width/max-height capped at 8192px, wrapper with overflow:hidden, min-width/min-height:0 for flex children
- Added html/body height/width/overflow constraints to prevent unbounded viewport in sandboxed iframe
- Fixed loading states to use flex layout instead of absolute positioning
- Removed unnecessary wrapper div in page.tsx
- Verified lint passes cleanly

Stage Summary:
- Fixed canvas overflow error with multi-layered approach:
  1. Flexbox layout (replaces absolute positioning) for predictable dimension calculation
  2. CSS canvas guards: max 8192px on all canvas elements inside .excalidraw-wrapper
  3. overflow:hidden on html/body prevents viewport overflow in sandboxed environments
  4. min-h-0 on flex children prevents flex minimum size inflation
  5. Static CSS import for Excalidraw styles ensures proper layout from the start
