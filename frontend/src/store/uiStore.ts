import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  shareModalOpen: boolean;
  shareModalInvoiceId: string | null;
  toasts: Toast[];
  openShareModal: (id: string) => void;
  closeShareModal: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  shareModalOpen: false,
  shareModalInvoiceId: null,
  toasts: [],
  openShareModal: (id) => set({ shareModalOpen: true, shareModalInvoiceId: id }),
  closeShareModal: () => set({ shareModalOpen: false, shareModalInvoiceId: null }),
  addToast: (message, type = 'success') => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
