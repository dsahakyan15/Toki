'use client';

import { create } from 'zustand';

export type Screen = 'home' | 'listen' | 'profile';

interface NavigationState {
  activeScreen: Screen;
  swipeProgress: number;
  isSearchOpen: boolean;
  setActiveScreen: (screen: Screen) => void;
  setSwipeProgress: (progress: number) => void;
  toggleSearch: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeScreen: 'home',
  swipeProgress: 0,
  isSearchOpen: false,
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setSwipeProgress: (progress) => set({ swipeProgress: progress }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));
