'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, type Project, type Whiteboard } from '@/store/app-store';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { BinaryFileData } from '@excalidraw/excalidraw/types';
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
  Cloud,
  CloudOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const ExcalidrawWrapper = dynamic(() => import('./excalidraw'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
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

  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [whiteboardData, setWhiteboardData] = useState<Record<string, unknown> | null>(null);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [renameBoardOpen, setRenameBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Whiteboard | null>(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingFileUploadsRef = useRef<Set<string>>(new Set());

  // Fetch whiteboards list when project changes
  useEffect(() => {
    if (currentProject) {
      setWhiteboards(currentProject.whiteboards || []);
      if (currentProject.whiteboards?.length > 0 && !currentWhiteboardId) {
        setCurrentWhiteboardId(currentProject.whiteboards[0].id);
      }
    }
  }, [currentProject, currentWhiteboardId, setCurrentWhiteboardId]);

  // Upload binary files to cloud storage
  const uploadFilesToCloud = useCallback(
    async (files: Record<string, BinaryFileData>, boardId: string) => {
      if (!boardId) return files;

      const uploadedFiles = { ...files };

      for (const [fileId, fileData] of Object.entries(files)) {
        // Skip if already uploaded or if data is a string URL
        if (!fileData.data || typeof fileData.data === 'string') continue;
        if (pendingFileUploadsRef.current.has(fileId)) continue;

        pendingFileUploadsRef.current.add(fileId);

        try {
          const blob = new Blob([fileData.data], {
            type: fileData.mimeType || 'application/octet-stream',
          });

          const formData = new FormData();
          formData.append('boardId', boardId);
          formData.append('fileId', fileId);
          formData.append('mimeType', fileData.mimeType || 'application/octet-stream');
          formData.append('file', blob, fileId);

          const res = await fetch('/api/storage/upload-file', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const result = await res.json();
            // Keep the file data as-is for rendering, but mark as uploaded
            // The cloud URL is stored for reference
            uploadedFiles[fileId] = {
              ...fileData,
              uploadedCloudUrl: result.url,
            } as BinaryFileData;
          }
        } catch (error) {
          console.error(`Failed to upload file ${fileId}:`, error);
        }
      }

      pendingFileUploadsRef.current.clear();
      return uploadedFiles;
    },
    []
  );

  // Fetch whiteboard data when the current board changes
  useEffect(() => {
    if (currentWhiteboardId) {
      setWhiteboardData(null);
      fetch(`/api/whiteboards?id=${currentWhiteboardId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            setWhiteboardData(data.data);
          } else {
            setWhiteboardData(null);
          }
        })
        .catch(() => {
          setWhiteboardData(null);
        });
    }
  }, [currentWhiteboardId]);

  // Auto-save whiteboard data on change — saves to cloud storage
  const handleExcalidrawChange = useCallback(
    async ({
      elements,
      appState,
      files,
    }: {
      elements: unknown;
      appState: Record<string, unknown>;
      files: Record<string, BinaryFileData>;
    }) => {
      if (!currentWhiteboardId) return;

      // Debounce saving
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        setCloudStatus('saving');

        try {
          // Upload any new binary files to cloud
          const processedFiles = await uploadFilesToCloud(files, currentWhiteboardId);

          // Build data to save — strip large binary data from the JSON payload
          // Binary files are already uploaded to cloud storage separately
          const serializableFiles: Record<string, unknown> = {};
          for (const [fileId, fileData] of Object.entries(processedFiles)) {
            serializableFiles[fileId] = {
              id: fileId,
              mimeType: fileData.mimeType,
              created: fileData.created,
              lastRetrieved: fileData.lastRetrieved,
              // Don't include the raw ArrayBuffer in DB — it's in cloud storage
              dataURL: fileData.dataURL || null,
              isUploaded: !!fileData.uploadedCloudUrl,
              cloudUrl: (fileData as Record<string, unknown>).uploadedCloudUrl || null,
            };
          }

          const dataToSave = {
            type: 'excalidraw',
            version: 2,
            source: 'whiteboard-studio',
            elements,
            appState: {
              ...appState,
              scrollX: undefined,
              scrollY: undefined,
            },
            files: serializableFiles,
          };

          // Save to cloud storage (via whiteboard API which handles both DB + cloud)
          const res = await fetch('/api/whiteboards', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: currentWhiteboardId,
              data: JSON.stringify(dataToSave),
            }),
          });

          if (res.ok) {
            setCloudStatus('saved');
            setTimeout(() => setCloudStatus('idle'), 2000);
          } else {
            setCloudStatus('error');
            setTimeout(() => setCloudStatus('idle'), 3000);
          }
        } catch {
          setCloudStatus('error');
          setTimeout(() => setCloudStatus('idle'), 3000);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [currentWhiteboardId, uploadFilesToCloud]
  );

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
        toast.success('Board created!');
        setCreateBoardOpen(false);
        setBoardTitle('');
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
        toast.success('Board renamed!');
        setRenameBoardOpen(false);
      } else {
        toast.error('Failed to rename board');
      }
    } catch {
      toast.error('Failed to rename board');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!selectedBoard) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/whiteboards?id=${selectedBoard.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = whiteboards.filter((w) => w.id !== selectedBoard.id);
        setWhiteboards(remaining);
        if (currentWhiteboardId === selectedBoard.id) {
          setCurrentWhiteboardId(remaining.length > 0 ? remaining[0].id : null);
        }
        toast.success('Board deleted!');
        setDeleteBoardOpen(false);
      } else {
        toast.error('Failed to delete board');
      }
    } catch {
      toast.error('Failed to delete board');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setView('projects');
    setSidebarOpen(true);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getCloudStatusIcon = () => {
    switch (cloudStatus) {
      case 'saving':
        return <Cloud className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />;
      case 'saved':
        return <Cloud className="h-3.5 w-3.5 text-green-500" />;
      case 'error':
        return <CloudOff className="h-3.5 w-3.5 text-destructive" />;
      default:
        return <Cloud className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getCloudStatusText = () => {
    switch (cloudStatus) {
      case 'saving':
        return 'Syncing to cloud...';
      case 'saved':
        return 'Saved to cloud';
      case 'error':
        return 'Cloud sync failed';
      default:
        return '';
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative h-screen w-screen overflow-hidden bg-background">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background/90 px-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Projects</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleSidebar}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: currentProject?.color || '#6366f1' }}
              />
              <span className="text-sm font-medium truncate max-w-[200px]">
                {currentProject?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saving && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {getCloudStatusIcon()}
                <span>{getCloudStatusText()}</span>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`absolute top-12 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          <div
            className={`h-full border-r border-border bg-card transition-opacity duration-200 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex h-12 items-center justify-between px-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Boards</span>
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {whiteboards.length}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setBoardTitle('');
                      setCreateBoardOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Board</TooltipContent>
              </Tooltip>
            </div>
            <Separator />
            <ScrollArea className="h-[calc(100%-49px)]">
              <div className="p-2 space-y-0.5">
                {whiteboards.map((board) => (
                  <div
                    key={board.id}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      currentWhiteboardId === board.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-foreground'
                    }`}
                    onClick={() => setCurrentWhiteboardId(board.id)}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate flex-1">{board.title}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
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
        </div>

        {/* Whiteboard area */}
        <div
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
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a board to start drawing
                </p>
                <Button
                  className="mt-4 gap-2"
                  onClick={() => {
                    setBoardTitle('');
                    setCreateBoardOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Board
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Create Board Dialog */}
        <Dialog open={createBoardOpen} onOpenChange={setCreateBoardOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>Add a new whiteboard to your project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Input
                placeholder="Board title"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateBoardOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBoard} disabled={submitting || !boardTitle.trim()}>
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Board Dialog */}
        <Dialog open={renameBoardOpen} onOpenChange={setRenameBoardOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename Board</DialogTitle>
              <DialogDescription>Enter a new name for this board.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Input
                placeholder="Board title"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameBoard()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameBoardOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameBoard} disabled={submitting || !boardTitle.trim()}>
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Board Dialog */}
        <AlertDialog open={deleteBoardOpen} onOpenChange={setDeleteBoardOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Board</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{selectedBoard?.title}&rdquo;? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBoard}
                disabled={submitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
