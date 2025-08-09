"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, City, Manager, MissionType } from './types';

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
  addTask: (task: Omit<Task, 'id'>) => void;
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
      addTask: (task) => {
        const newTask = { ...task, id: `task-${Date.now()}` };
        set({ tasks: [newTask, ...get().tasks] });
      }
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Store for Cities
interface CityState {
  cities: City[];
  addCity: (city: Omit<City, 'id'>) => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      cities: [
        { id: 'city-1', name: 'Paris' },
        { id: 'city-2', name: 'Lyon' },
        { id: 'city-3', name: 'Marseille' },
        { id: 'city-4', name: 'Lille' },
      ],
      addCity: (city) => {
        const newCity = { ...city, id: `city-${Date.now()}` };
        set({ cities: [...get().cities, newCity] });
      },
    }),
    {
      name: 'city-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Store for Managers
interface ManagerState {
  managers: Manager[];
  addManager: (manager: Omit<Manager, 'id'>) => void;
}

export const useManagerStore = create<ManagerState>()(
  persist(
    (set, get) => ({
      managers: [
        { id: 'manager-1', name: 'Jean Dupont' },
        { id: 'manager-2', name: 'Marie Curie' },
      ],
      addManager: (manager) => {
        const newManager = { ...manager, id: `manager-${Date.now()}` };
        set({ managers: [...get().managers, newManager] });
      },
    }),
    {
      name: 'manager-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Store for Mission Types
interface MissionTypeState {
  missionTypes: MissionType[];
  addMissionType: (missionType: Omit<MissionType, 'id'>) => void;
}

export const useMissionTypeStore = create<MissionTypeState>()(
  persist(
    (set, get) => ({
      missionTypes: [
        { id: 'type-1', name: 'Réparation' },
        { id: 'type-2', name: 'Installation' },
        { id: 'type-3', name: 'Entretien' },
      ],
      addMissionType: (missionType) => {
        const newMissionType = { ...missionType, id: `type-${Date.now()}` };
        set({ missionTypes: [...get().missionTypes, newMissionType] });
      },
    }),
    {
      name: 'mission-type-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
