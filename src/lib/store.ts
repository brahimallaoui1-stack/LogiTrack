"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, Expense } from './types';
import { produce } from 'immer';

interface AppState {
  isInitialized: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
