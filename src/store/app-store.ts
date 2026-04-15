import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  whiteboards: Whiteboard[];
}

export interface Whiteboard {
  id: string;
  title: string;
  data: string;
  order: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

type AppView = 'projects' | 'editor';

interface AppState {
  // Navigation
  view: AppView;
  setView: (view: AppView) => void;
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  currentWhiteboardId: string | null;
  setCurrentWhiteboardId: (id: string | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  view: 'projects',
  setView: (view) => set({ view }),
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project, currentWhiteboardId: project?.whiteboards?.[0]?.id || null }),
  currentWhiteboardId: null,
  setCurrentWhiteboardId: (id) => set({ currentWhiteboardId: id }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Theme
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
