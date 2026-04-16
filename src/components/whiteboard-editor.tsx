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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Dynamic import with ssr:false — the wrapper inside also lazy-loads Excalidraw
const ExcalidrawWrapper = dynamic(() => import('./excalidraw'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading whiteboard…</p>
      </div>
    </div>
  ),
});

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
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [renameBoardOpen, setRenameBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Whiteboard | null>(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // ── When project is set, populate whiteboards list ──
  useEffect(() => {
    if (currentProject) {
      const boards = currentProject.whiteboards || [];
      setWhiteboards(boards);
      // Auto-select first board if none selected
      if (boards.length > 0 && !currentWhiteboardId) {
        setCurrentWhiteboardId(boards[0].id);
      }
    }
  }, [currentProject, currentWhiteboardId, setCurrentWhiteboardId]);

  // ── Fetch scene data when board ID changes ──
  useEffect(() => {
    if (!currentWhiteboardId) {
      setWhiteboardData(null);
      return;
    }

    let cancelled = false;

    async function loadBoard() {
      setWhiteboardData(null);
      try {
        const res = await fetch(`/api/whiteboards?id=${currentWhiteboardId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (!cancelled) {
          setWhiteboardData(json.data || null);
        }
      } catch (err) {
        console.error('Failed to load board:', err);
        if (!cancelled) setWhiteboardData(null);
      }
    }

    loadBoard();
    return () => { cancelled = true; };
  }, [currentWhiteboardId]);

  // ── Save handler: receives raw Excalidraw onChange args ──
  const handleExcalidrawChange = useCallback(
    (elements: unknown, appState: unknown, files: unknown) => {
      if (!currentWhiteboardId || isSavingRef.current) return;

      // Debounce saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        isSavingRef.current = true;
        setSaveStatus('saving');

        try {
          const sceneData = {
            elements,
            appState,
            files,
          };

          const res = await fetch('/api/whiteboards', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: currentWhiteboardId,
              data: JSON.stringify(sceneData),
            }),
          });

          if (res.ok) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
          }
        } catch {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
          isSavingRef.current = false;
        }
      }, 800);
    },
    [currentWhiteboardId]
  );

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

  // ── Save status indicator ──
  const saveIndicator = () => {
    if (saveStatus === 'idle') return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {saveStatus === 'saving' && <Save className="h-3.5 w-3.5 animate-pulse" />}
        {saveStatus === 'saved' && <Save className="h-3.5 w-3.5 text-green-500" />}
        {saveStatus === 'error' && <Save className="h-3.5 w-3.5 text-destructive" />}
        <span>
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </span>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative h-screen w-screen overflow-hidden bg-background">
        {/* ── Top bar ── */}
        <header className="absolute inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur-sm">
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
            {saveIndicator()}
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

        {/* ── Sidebar ── */}
        <aside
          className={`absolute top-12 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          <div
            className={`h-full border-r border-border bg-card transition-opacity duration-200 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
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
                    onClick={() => setCurrentWhiteboardId(board.id)}
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
        <main
          className={`absolute top-12 right-0 bottom-0 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'left-64' : 'left-0'
          }`}
        >
          {currentWhiteboardId ? (
            <ExcalidrawWrapper
              key={currentWhiteboardId}
              initialData={whiteboardData}
              whiteboardId={currentWhiteboardId}
              onChange={handleExcalidrawChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
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
      </div>
    </TooltipProvider>
  );
}
