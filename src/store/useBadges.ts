import { create } from 'zustand';

// Shared badge counts across screens (TabBar reads these, Dashboard writes).
interface BadgeState {
  orders: number;
  stock: number;
  setBadges: (b: Partial<Pick<BadgeState, 'orders' | 'stock'>>) => void;
  reset: () => void;
}

export const useBadges = create<BadgeState>((set) => ({
  orders: 0,
  stock: 0,
  setBadges: (b) => set((s) => ({ ...s, ...b })),
  reset: () => set({ orders: 0, stock: 0 }),
}));
