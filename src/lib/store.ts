
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, City, Manager, MissionType, Expense, ExpenseStatus, Invoice } from './types';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface AppState {
  isHydrated: boolean;
  setHydrated: (isHydrated: boolean) => void;
}

export const useAppStore = create<AppState>()(
    (set) => ({
      isHydrated: false,
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
);

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  updateExpenseStatus: (taskId: string, newStatus: ExpenseStatus, processedDate?: string) => void;
  updateExpensesStatusByProcessedDate: (processedDate: string, newStatus: ExpenseStatus) => void;
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
       updateExpenseStatus: (taskId, newStatus) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId && task.expenses) {
              const updatedExpenses = task.expenses.map(exp => ({ ...exp, status: newStatus, processedDate: new Date().toISOString() }));
              return { ...task, expenses: updatedExpenses };
            }
            return task;
          }),
        })),
        updateExpensesStatusByProcessedDate: (processedDate, newStatus) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (!task.expenses) return task;
            
            const hasTargetExpense = task.expenses.some(exp => exp.processedDate?.startsWith(processedDate));

            if (hasTargetExpense) {
                const updatedExpenses = task.expenses.map(exp => {
                    if (exp.processedDate?.startsWith(processedDate)) {
                        return { ...exp, status: newStatus };
                    }
                    return exp;
                });
                return { ...task, expenses: updatedExpenses };
            }
            return task;
          }),
        })),
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
            useAppStore.setState({ isHydrated: true });
        }
      }
    }
  )
);

// Store for Cities
interface CityState {
  cities: City[];
  isLoading: boolean;
  fetchCities: () => Promise<void>;
  addCity: (city: Omit<City, 'id'>) => Promise<void>;
  updateCity: (city: City) => Promise<void>;
  deleteCity: (id: string) => Promise<void>;
}

export const useCityStore = create<CityState>()(
  (set, get) => ({
    cities: [],
    isLoading: true,
    fetchCities: async () => {
      try {
        set({ isLoading: true });
        const querySnapshot = await getDocs(collection(db, "cities"));
        const cities = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as City))
            .sort((a, b) => a.name.localeCompare(b.name));
        set({ cities, isLoading: false });
      } catch (error) {
        console.error("Error fetching cities: ", error);
        set({ isLoading: false });
      }
    },
    addCity: async (city) => {
      try {
        const docRef = await addDoc(collection(db, "cities"), city);
        const newCity = { ...city, id: docRef.id };
        const sortedCities = [...get().cities, newCity].sort((a, b) => a.name.localeCompare(b.name));
        set({ cities: sortedCities });
      } catch (error) {
        console.error("Error adding city: ", error);
      }
    },
    updateCity: async (updatedCity) => {
       try {
        const cityRef = doc(db, "cities", updatedCity.id);
        await updateDoc(cityRef, { name: updatedCity.name });
        const cities = get().cities.map((city) =>
          city.id === updatedCity.id ? updatedCity : city
        );
        const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));
        set({ cities: sortedCities });
      } catch (error) {
        console.error("Error updating city: ", error);
      }
    },
    deleteCity: async (id) => {
       try {
        await deleteDoc(doc(db, "cities", id));
        set({ cities: get().cities.filter((city) => city.id !== id) });
      } catch (error) {
        console.error("Error deleting city: ", error);
      }
    },
  })
);

// Store for Managers
interface ManagerState {
  managers: Manager[];
  addManager: (manager: Omit<Manager, 'id'>) => void;
  updateManager: (manager: Manager) => void;
  deleteManager: (id: string) => void;
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
       updateManager: (updatedManager) => {
        const managers = get().managers.map((manager) =>
          manager.id === updatedManager.id ? updatedManager : manager
        );
        const sortedManagers = [...managers].sort((a, b) => a.name.localeCompare(b.name));
        set({ managers: sortedManagers });
      },
      deleteManager: (id) => {
        set({ managers: get().managers.filter((manager) => manager.id !== id) });
      },
    }),
    {
      name: 'manager-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          useAppStore.setState({ isHydrated: true });
        }
      },
    }
  )
);

// Store for Mission Types
interface MissionTypeState {
  missionTypes: MissionType[];
  addMissionType: (missionType: Omit<MissionType, 'id'>) => void;
  updateMissionType: (missionType: MissionType) => void;
  deleteMissionType: (id: string) => void;
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
      updateMissionType: (updatedType) => {
        const missionTypes = get().missionTypes.map((type) =>
          type.id === updatedType.id ? updatedType : type
        );
        const sortedMissionTypes = [...missionTypes].sort((a, b) => a.name.localeCompare(b.name));
        set({ missionTypes: sortedMissionTypes });
      },
      deleteMissionType: (id) => {
        set({ missionTypes: get().missionTypes.filter((type) => type.id !== id) });
      },
    }),
    {
      name: 'mission-type-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          useAppStore.setState({ isHydrated: true });
        }
      },
    }
  )
);

// Store for Invoicing
interface FacturationState {
    invoices: Record<string, Invoice>;
    updateInvoice: (id: string, receivedAmount: number, totalDue: number) => void;
}

export const useFacturationStore = create<FacturationState>()(
    persist(
        (set, get) => ({
            invoices: {},
            updateInvoice: (id, receivedAmount, totalDue) => {
                const invoices = get().invoices;
                
                const existingInvoice = invoices[id] || { id, receivedAmount: 0 };
                const newReceivedAmount = existingInvoice.receivedAmount + receivedAmount;

                set({
                    invoices: {
                        ...invoices,
                        [id]: { ...existingInvoice, receivedAmount: newReceivedAmount }
                    }
                });
                
                if (newReceivedAmount >= totalDue) {
                    useTaskStore.getState().updateExpensesStatusByProcessedDate(id, 'Payé');
                }
            }
        }),
        {
            name: 'facturation-storage',
            storage: createJSONStorage(() => localStorage),
             onRehydrateStorage: () => (state) => {
              if (state) {
                useAppStore.setState({ isHydrated: true });
              }
            },
        }
    )
);