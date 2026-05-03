import { create } from 'zustand'

export type ViewMode = 'pipeline' | 'leads' | 'tasks' | 'dashboard' | 'whatsapp' | 'ai-assistant' | 'forms'

interface CRMState {
  activeView: ViewMode
  setActiveView: (view: ViewMode) => void
  selectedLeadId: string | null
  setSelectedLeadId: (id: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  leadDrawerOpen: boolean
  setLeadDrawerOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useCRMStore = create<CRMState>((set) => ({
  activeView: 'pipeline',
  setActiveView: (view) => set({ activeView: view }),
  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  leadDrawerOpen: false,
  setLeadDrawerOpen: (open) => set({ leadDrawerOpen: open }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
