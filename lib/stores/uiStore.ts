// ============================================
// UI STORE - Global UI state
// ============================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  /** Escritorio/tablet (lg+): menú lateral contraído a solo íconos. Se recuerda por dispositivo. */
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      closeSidebar: () => set({ sidebarOpen: false }),

      openSidebar: () => set({ sidebarOpen: true }),

      sidebarCollapsed: false,

      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "agendy-ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
