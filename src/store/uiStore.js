import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  toasts: [],
  confirm: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  pushToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { id: `${Date.now()}_${Math.random()}`, type: 'success', ...toast }],
    })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openConfirm: (confirm) => set({ confirm }),
  closeConfirm: () => set({ confirm: null }),
}));

export function toast(message, type = 'success') {
  useUiStore.getState().pushToast({ message, type });
}
