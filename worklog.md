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

---
Task ID: 4
Agent: Main Agent
Task: Fix save spam, sidebar not showing new items, and whiteboard content not persisting

Work Log:
- Identified Bug 1: handleExcalidrawChange was auto-saving to server on every debounced change (800ms) — replaced with localStorage-only saves
- Identified Bug 2: useEffect for populating whiteboards had currentWhiteboardId in dependency array — when setCurrentWhiteboardId(newBoard.id) was called after creation, the effect re-ran and reset whiteboards back to old list from currentProject.whiteboards
- Identified Bug 3: loadBoard() set whiteboardData=null first, causing Excalidraw to remount with empty data before async fetch completed — Excalidraw's initialData is only read on mount
- Rewrote whiteboard-editor.tsx with localStorage-first data strategy
- Added Save button in top bar that uploads localStorage data to server
- Added "Unsaved changes" indicator with CloudOff icon
- Added isReady flag — Excalidraw only renders once data is loaded from localStorage or server
- Load priority: localStorage (instant) → server fallback
- Removed currentWhiteboardId from sidebar population useEffect dependency array
- Cleaned up unused eslint-disable directives
- Verified lint passes cleanly, app compiles successfully

Stage Summary:
- Three bugs fixed in whiteboard-editor.tsx:
  1. Save behavior: onChange now saves to localStorage only (keyed by wb_scene_{boardId}). Explicit "Save" button in top bar uploads to server. Shows "Unsaved changes" indicator.
  2. Sidebar fix: useEffect for initializing whiteboards list now only depends on currentProject (not currentWhiteboardId), preventing the list from being overwritten after board creation.
  3. Content loading: Excalidraw only renders after data is available (isReady flag). Data loads from localStorage first for instant restore, then server data is fetched as fallback. New boards get empty scene {} immediately.

---
Task ID: 5
Agent: Main Agent
Task: Integrate Excalidraw library (.excalidrawlib) files with database storage and smooth loading

Work Log:
- Analyzed all 10 .excalidrawlib files: two formats found (older "library" format and newer "libraryItems" format)
- Added Library model to Prisma schema (id, name, data, createdAt)
- Created scripts/seed-libraries.ts to import all 10 library files into SQLite database
- All 10 libraries seeded successfully (~2.9MB total: post-it, db-eng, algorithms, cloud, awesome-icons, data-viz, stick-figures, drwnio, architecture-diagram-components, software-architecture)
- Created /api/libraries API route that converts both formats into Excalidraw LibraryItems format
- Updated excalidraw-wrapper.tsx with cached library loading using excalidrawAPI.updateLibrary()
- Libraries are loaded once into memory cache and reused across all Excalidraw instances
- Lint passes cleanly

Stage Summary:
- Full library integration pipeline:
  1. 10 excalidrawlib files stored in SQLite database via seed script (scripts/seed-libraries.ts)
  2. API endpoint /api/libraries converts both "library" and "libraryItems" formats to unified LibraryItems
  3. Client-side: libraries fetched once, cached in memory, injected via excalidrawAPI.updateLibrary({ merge: true, defaultStatus: "published" })
  4. Users can open the Excalidraw library menu to browse all loaded libraries by name
  5. To add new libraries: place .excalidrawlib file in upload/, run bun run scripts/seed-libraries.ts
---
Task ID: 1
Agent: Main Agent
Task: Replace SQLite with MongoDB and add back library feature

Work Log:
- Installed mongoose@9.4.1
- Created src/lib/mongodb.ts (connection with global caching)
- Created src/lib/models.ts (Project, Whiteboard, Library Mongoose schemas)
- Rewrote /api/projects/route.ts (GET/POST/PUT/DELETE using MongoDB)
- Rewrote /api/whiteboards/route.ts (GET/POST/PUT/DELETE using MongoDB)
- Rewrote /api/libraries/route.ts (GET/POST/DELETE using MongoDB)
- Added back library feature to excalidraw-wrapper.tsx (excalidrawAPI ref + updateLibrary)
- Updated .env with MongoDB URI and DB_NAME
- Verified MongoDB connection works and APIs return correct data

Stage Summary:
- SQLite/Prisma fully replaced with MongoDB Atlas (mongoose)
- Database: my-excalidraw on loundry-cluster MongoDB Atlas
- All CRUD APIs working with MongoDB
- Library feature restored with cached loading via /api/libraries
- Server running on port 3000, HTTP 200 confirmed

