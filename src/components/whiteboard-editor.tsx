'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, type Whiteboard } from '@/store/app-store';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  LayoutGrid,
  Sun,
  Moon,
  Layers,
  Save,
  Upload,
  CloudOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Dynamic import with ssr:false
const ExcalidrawWrapper = dynamic(() => import('./excalidraw'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading whiteboard…</p>
      </div>
    </div>
  ),
});

// ── localStorage helpers ──
const LS_PREFIX = 'wb_scene_';
function lsKey(boardId: string) {
  return LS_PREFIX + boardId;
}
function saveToLS(boardId: string, data: Record<string, unknown>) {
  try {
    localStorage.setItem(lsKey(boardId), JSON.stringify(data));
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}
function loadFromLS(boardId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(lsKey(boardId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

export default function WhiteboardEditor() {
  const {
    currentProject,
    currentWhiteboardId,
    setCurrentWhiteboardId,
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    setView,
  } = useAppStore();

  const { theme, setTheme } = useTheme();

  // ── Local state ──
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [whiteboardData, setWhiteboardData] = useState<Record<string, unknown> | null>(null);
  const [isReady, setIsReady] = useState(false); // true once we have data to show
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [renameBoardOpen, setRenameBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Whiteboard | null>(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isUploadingRef = useRef(false);

  // ── Initialize whiteboards list ONCE when project changes (NOT on whiteboardId change) ──
  useEffect(() => {
    if (currentProject) {
      const boards = currentProject.whiteboards || [];
      setWhiteboards(boards);
      // Auto-select first board if none selected
      if (boards.length > 0 && !currentWhiteboardId) {
        setCurrentWhiteboardId(boards[0].id);
      }
    }
  }, [currentProject]);

  // ── Load scene data when board ID changes ──
  // Priority: localStorage first (instant) → server fallback
  useEffect(() => {
    if (!currentWhiteboardId) {
      setWhiteboardData(null);
      setIsReady(false);
      setHasUnsaved(false);
      return;
    }

    let cancelled = false;
    setHasUnsaved(false);

    async function loadBoard() {
      // 1. Try localStorage first for instant restore
      const localData = loadFromLS(currentWhiteboardId);
      if (localData && !cancelled) {
        setWhiteboardData(localData);
        setIsReady(true);
      }

      // 2. Then fetch from server as the source of truth
      try {
        const res = await fetch(`/api/whiteboards?id=${currentWhiteboardId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();

        if (!cancelled) {
          const serverData = json.data || null;
          // Only overwrite if server has data and localStorage was empty
          if (serverData && !localData) {
            setWhiteboardData(serverData);
            setIsReady(true);
          } else if (!serverData && !localData) {
            // New empty board — set to empty so Excalidraw renders
            setWhiteboardData({});
            setIsReady(true);
          } else {
            // We already set from localStorage, just ensure ready
            if (!isReady) setIsReady(true);
          }
        }
      } catch (err) {
        console.error('Failed to load board from server:', err);
        // If localStorage had data we're fine; otherwise show empty
        if (!cancelled && !localData) {
          setWhiteboardData({});
          setIsReady(true);
        }
      }
    }

    loadBoard();
    return () => { cancelled = true; };
  }, [currentWhiteboardId]);

  // ── onChange: save to localStorage only (no server call) ──
  const handleExcalidrawChange = useCallback(
    (elements: unknown, appState: unknown, files: unknown) => {
      if (!currentWhiteboardId) return;

      // Save to localStorage
      saveToLS(currentWhiteboardId, { elements, appState, files });

      if (!hasUnsaved) {
        setHasUnsaved(true);
      }
    },
    [currentWhiteboardId, hasUnsaved]
  );

  // ── Manual Save: upload from localStorage to server ──
  const handleSaveToServer = useCallback(async () => {
    if (!currentWhiteboardId || isUploadingRef.current) return;

    const localData = loadFromLS(currentWhiteboardId);
    if (!localData) {
      toast.info('Nothing to save');
      return;
    }

    isUploadingRef.current = true;
    setSaveStatus('saving');

    try {
      const res = await fetch('/api/whiteboards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentWhiteboardId,
          data: JSON.stringify(localData),
        }),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setHasUnsaved(false);
        toast.success('Saved to cloud');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        toast.error('Failed to save');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      toast.error('Failed to save');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      isUploadingRef.current = false;
    }
  }, [currentWhiteboardId]);

  // ── Board CRUD ──
  const handleCreateBoard = async () => {
    if (!currentProject || !boardTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/whiteboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: boardTitle.trim(),
          projectId: currentProject.id,
        }),
      });
      if (res.ok) {
        const newBoard = await res.json();
        // Add to list and select immediately
        setWhiteboards((prev) => [...prev, newBoard]);
        setCurrentWhiteboardId(newBoard.id);
        setCreateBoardOpen(false);
        setBoardTitle('');
        toast.success('Board created');
      } else {
        toast.error('Failed to create board');
      }
    } catch {
      toast.error('Failed to create board');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenameBoard = async () => {
    if (!selectedBoard || !boardTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/whiteboards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBoard.id, title: boardTitle.trim() }),
      });
      if (res.ok) {
        setWhiteboards((prev) =>
          prev.map((w) => (w.id === selectedBoard.id ? { ...w, title: boardTitle.trim() } : w))
        );
        setRenameBoardOpen(false);
        toast.success('Board renamed');
      } else {
        toast.error('Failed to rename');
      }
    } catch {
      toast.error('Failed to rename');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!selectedBoard) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/whiteboards?id=${selectedBoard.id}`, { method: 'DELETE' });
      if (res.ok) {
        // Clean up localStorage
        try { localStorage.removeItem(lsKey(selectedBoard.id)); } catch {}

        const remaining = whiteboards.filter((w) => w.id !== selectedBoard.id);
        setWhiteboards(remaining);
        if (currentWhiteboardId === selectedBoard.id) {
          setCurrentWhiteboardId(remaining.length > 0 ? remaining[0].id : null);
        }
        setDeleteBoardOpen(false);
        toast.success('Board deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setView('projects');
    setSidebarOpen(true);
  };

  const toggleThemeMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Root: flex column, fills viewport exactly */}
      <div
        className="flex flex-col bg-background"
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
      >
        {/* ── Top bar ── */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur-sm z-40">
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Projects</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: currentProject?.color || '#6366f1' }}
              />
              <span className="text-sm font-medium truncate max-w-[200px]">{currentProject?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Unsaved indicator */}
            {hasUnsaved && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <CloudOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Unsaved changes</span>
              </div>
            )}

            {/* Save status */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {saveStatus === 'saving' && <Upload className="h-3.5 w-3.5 animate-pulse" />}
                {saveStatus === 'saved' && <Save className="h-3.5 w-3.5 text-green-500" />}
                {saveStatus === 'error' && <Save className="h-3.5 w-3.5 text-destructive" />}
                <span>
                  {saveStatus === 'saving' && 'Uploading…'}
                  {saveStatus === 'saved' && 'Saved'}
                  {saveStatus === 'error' && 'Failed'}
                </span>
              </div>
            )}

            {/* Save button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-3"
                  onClick={handleSaveToServer}
                  disabled={saveStatus === 'saving'}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Save</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save to cloud storage</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleThemeMode}>
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Sidebar ── */}
          <aside
            className="shrink-0 border-r border-border bg-card z-30 transition-all duration-300 ease-in-out overflow-hidden"
            style={{ width: sidebarOpen ? '16rem' : '0px' }}
          >
            <div
              className={`h-full transition-opacity duration-200 ${
                sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ width: '16rem' }}
            >
              {/* Sidebar header */}
              <div className="flex h-12 items-center justify-between px-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span>Boards</span>
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">{whiteboards.length}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setBoardTitle(''); setCreateBoardOpen(true); }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New board</TooltipContent>
                </Tooltip>
              </div>
              <Separator />

              {/* Board list */}
              <ScrollArea className="h-[calc(100%-49px)]">
                <div className="p-2 space-y-0.5">
                  {whiteboards.map((board) => (
                    <div
                      key={board.id}
                      role="button"
                      tabIndex={0}
                      className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        currentWhiteboardId === board.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent text-foreground'
                      }`}
                      onClick={() => {
                        if (currentWhiteboardId !== board.id) {
                          setCurrentWhiteboardId(board.id);
                        }
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') setCurrentWhiteboardId(board.id); }}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="text-sm truncate flex-1">{board.title}</span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${
                              currentWhiteboardId === board.id
                                ? 'hover:bg-primary-foreground/20'
                                : ''
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBoard(board);
                              setBoardTitle(board.title);
                              setRenameBoardOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBoard(board);
                              setDeleteBoardOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* ── Canvas area ── */}
          <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
            {currentWhiteboardId && isReady ? (
              <ExcalidrawWrapper
                key={currentWhiteboardId}
                initialData={whiteboardData}
                whiteboardId={currentWhiteboardId}
                onChange={handleExcalidrawChange}
              />
            ) : currentWhiteboardId ? (
              <div className="flex h-full w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                  <p className="text-sm text-muted-foreground">Loading board…</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 rounded-2xl bg-muted p-6 w-fit">
                    <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No boards yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Create a board to start drawing</p>
                  <Button
                    className="mt-4 gap-2"
                    onClick={() => { setBoardTitle(''); setCreateBoardOpen(true); }}
                  >
                    <Plus className="h-4 w-4" />
                    Create Board
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Create Board Dialog ── */}
      <Dialog open={createBoardOpen} onOpenChange={setCreateBoardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>Add a new whiteboard to this project.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Board title"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateBoardOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBoard} disabled={submitting || !boardTitle.trim()}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Board Dialog ── */}
      <Dialog open={renameBoardOpen} onOpenChange={setRenameBoardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Board</DialogTitle>
            <DialogDescription>Enter a new name for this board.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Board title"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameBoard()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameBoardOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameBoard} disabled={submitting || !boardTitle.trim()}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Board Dialog ── */}
      <AlertDialog open={deleteBoardOpen} onOpenChange={setDeleteBoardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{selectedBoard?.title}&rdquo;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
