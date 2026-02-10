import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ===== TypeDefinition =====

type Theme = 'light' | 'dark' | 'system'

interface PanelState {
  isOpen: boolean
  width?: number
}

interface UIState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Sidebar
  sidebarOpen: boolean
  sidebarWidth: number
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void

  // EditPanel
  nodePanel: PanelState
  configPanel: PanelState
  logPanel: PanelState
  toggleNodePanel: () => void
  toggleConfigPanel: () => void
  toggleLogPanel: () => void

  // small
  minimapVisible: boolean
  toggleMinimap: () => void

  // CanvasSettings
  canvasBackground: 'dots' | 'lines' | 'none'
  setCanvasBackground: (bg: 'dots' | 'lines' | 'none') => void

  // TipandGuide
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void

  // Modal
  modals: Record<string, boolean>
  openModal: (name: string) => void
  closeModal: (name: string) => void
}

// ===== Store =====

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => {
        set({ theme })

        // AppTheme
        if (typeof window !== 'undefined') {
          const root = document.documentElement

          if (theme === 'dark') {
            root.classList.add('dark')
          } else if (theme === 'light') {
            root.classList.remove('dark')
          } else {
            // system
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', prefersDark)
          }
        }
      },

      // Sidebar
      sidebarOpen: true,
      sidebarWidth: 256,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // EditPanel
      nodePanel: { isOpen: true, width: 240 },
      configPanel: { isOpen: true, width: 360 },
      logPanel: { isOpen: false },

      toggleNodePanel: () =>
        set((state) => ({
          nodePanel: { ...state.nodePanel, isOpen: !state.nodePanel.isOpen },
        })),

      toggleConfigPanel: () =>
        set((state) => ({
          configPanel: { ...state.configPanel, isOpen: !state.configPanel.isOpen },
        })),

      toggleLogPanel: () =>
        set((state) => ({
          logPanel: { ...state.logPanel, isOpen: !state.logPanel.isOpen },
        })),

      // small
      minimapVisible: true,
      toggleMinimap: () => set((state) => ({ minimapVisible: !state.minimapVisible })),

      // CanvasSettings
      canvasBackground: 'dots',
      setCanvasBackground: (bg) => set({ canvasBackground: bg }),

      // TipandGuide
      showWelcome: true,
      setShowWelcome: (show) => set({ showWelcome: show }),

      // Modal
      modals: {},
      openModal: (name) =>
        set((state) => ({
          modals: { ...state.modals, [name]: true },
        })),
      closeModal: (name) =>
        set((state) => ({
          modals: { ...state.modals, [name]: false },
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        nodePanel: state.nodePanel,
        configPanel: state.configPanel,
        minimapVisible: state.minimapVisible,
        canvasBackground: state.canvasBackground,
        showWelcome: state.showWelcome,
      }),
    }
  )
)
