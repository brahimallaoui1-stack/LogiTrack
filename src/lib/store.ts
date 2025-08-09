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
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (task) => {
        const newTask = { ...task, id: `task-${Date.now()}` };
        set({ tasks: [newTask, ...get().tasks] });
      },
      updateTask: (updatedTask) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),
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
      cities: [],
      addCity: (city) => {
        const newCity = { ...city, id: `city-${Date.now()}` };
        const sortedCities = [...get().cities, newCity].sort((a, b) => a.name.localeCompare(b.name));
        set({ cities: sortedCities });
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
      managers: [],
      addManager: (manager) => {
        const newManager = { ...manager, id: `manager-${Date.now()}` };
        const sortedManagers = [...get().managers, newManager].sort((a, b) => a.name.localeCompare(b.name));
        set({ managers: sortedManagers });
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
      missionTypes: [],
      addMissionType: (missionType) => {
        const newMissionType = { ...missionType, id: `type-${Date.now()}` };
        const sortedMissionTypes = [...get().missionTypes, newMissionType].sort((a, b) => a.name.localeCompare(b.name));
        set({ missionTypes: sortedMissionTypes });
      },
    }),
    {
      name: 'mission-type-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
