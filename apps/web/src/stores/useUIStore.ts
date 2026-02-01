import { create } from "zustand";
import { persist } from "zustand/middleware";

// ===== 类型定义 =====

type Theme = "light" | "dark" | "system";

interface PanelState {
  isOpen: boolean;
  width?: number;
}

interface UIState {
  // 主题
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // 侧边栏
  sidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  
  // 编辑器面板
  nodePanel: PanelState;
  configPanel: PanelState;
  logPanel: PanelState;
  toggleNodePanel: () => void;
  toggleConfigPanel: () => void;
  toggleLogPanel: () => void;
  
  // 小地图
  minimapVisible: boolean;
  toggleMinimap: () => void;
  
  // 画布设置
  canvasBackground: "dots" | "lines" | "none";
  setCanvasBackground: (bg: "dots" | "lines" | "none") => void;
  
  // 提示和引导
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  
  // 模态框
  modals: Record<string, boolean>;
  openModal: (name: string) => void;
  closeModal: (name: string) => void;
}

// ===== Store =====

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 主题
      theme: "system",
      setTheme: (theme) => {
        set({ theme });
        
        // 应用主题
        if (typeof window !== "undefined") {
          const root = document.documentElement;
          
          if (theme === "dark") {
            root.classList.add("dark");
          } else if (theme === "light") {
            root.classList.remove("dark");
          } else {
            // system
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.classList.toggle("dark", prefersDark);
          }
        }
      },
      
      // 侧边栏
      sidebarOpen: true,
      sidebarWidth: 256,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      
      // 编辑器面板
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
      
      // 小地图
      minimapVisible: true,
      toggleMinimap: () => set((state) => ({ minimapVisible: !state.minimapVisible })),
      
      // 画布设置
      canvasBackground: "dots",
      setCanvasBackground: (bg) => set({ canvasBackground: bg }),
      
      // 提示和引导
      showWelcome: true,
      setShowWelcome: (show) => set({ showWelcome: show }),
      
      // 模态框
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
      name: "ui-storage",
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
);
