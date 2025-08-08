"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task } from './types';

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

interface TaskState {
  tasks: Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [
        { id: 'task-1', label: 'Réparer la fuite du robinet', city: 'Paris' },
        { id: 'task-2', label: 'Installer une nouvelle chaudière', city: 'Lyon' },
        { id: 'task-3', label: 'Peindre le salon', city: 'Marseille' },
        { id: 'task-4', label: 'Monter un meuble', city: 'Paris' },
        { id: 'task-5', label: 'Changer une prise électrique', city: 'Lille' },
        { id: 'task-6', label: 'Déboucher les canalisations', city: 'Lyon' },
        { id: 'task-7', label: 'Poser du parquet', city: 'Paris' },
      ],
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
