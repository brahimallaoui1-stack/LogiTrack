
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, City, Manager, MissionType, Expense, ExpenseStatus, Invoice } from './types';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, orderBy } from 'firebase/firestore';

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
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateExpenseStatus: (taskId: string, newStatus: ExpenseStatus, processedDate?: string) => Promise<void>;
  updateExpensesStatusByProcessedDate: (processedDate: string, newStatus: ExpenseStatus) => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
    (set, get) => ({
      tasks: [],
      isLoading: true,
      fetchTasks: async () => {
        if (!get().isLoading) set({ isLoading: true });
        try {
          const q = query(collection(db, "tasks"), orderBy("date", "desc"));
          const querySnapshot = await getDocs(q);
          const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
          set({ tasks, isLoading: false });
        } catch (error) {
            console.error("Error fetching tasks: ", error);
            set({ isLoading: false });
        }
      },
      addTask: async (task) => {
        try {
            const docRef = await addDoc(collection(db, "tasks"), task);
            const newTask = { ...task, id: docRef.id };
            set({ tasks: [newTask, ...get().tasks] });
        } catch (error) {
            console.error("Error adding task: ", error);
        }
      },
      updateTask: async (updatedTask) => {
        try {
            const taskRef = doc(db, "tasks", updatedTask.id);
            await updateDoc(taskRef, { ...updatedTask });
            set((state) => ({
              tasks: state.tasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
              ),
            }));
        } catch (error) {
            console.error("Error updating task: ", error);
        }
      },
      deleteTask: async (id) => {
         try {
            await deleteDoc(doc(db, "tasks", id));
            set((state) => ({
                tasks: state.tasks.filter((task) => task.id !== id),
            }));
        } catch (error) {
            console.error("Error deleting task: ", error);
        }
      },
       updateExpenseStatus: async (taskId, newStatus) => {
         const tasks = get().tasks;
         const taskToUpdate = tasks.find(t => t.id === taskId);
         if (taskToUpdate && taskToUpdate.expenses) {
            const updatedExpenses = taskToUpdate.expenses.map(exp => ({ ...exp, status: newStatus, processedDate: new Date().toISOString() }));
            const updatedTask = { ...taskToUpdate, expenses: updatedExpenses };
            
            try {
                const taskRef = doc(db, "tasks", taskId);
                await updateDoc(taskRef, { expenses: updatedExpenses });
                set({
                  tasks: tasks.map((task) =>
                    task.id === taskId ? updatedTask : task
                  ),
                });
            } catch (error) {
                console.error("Error updating expense status: ", error);
            }
         }
       },
        updateExpensesStatusByProcessedDate: async (processedDate, newStatus) => {
            const tasks = get().tasks;
            const batch = writeBatch(db);
            const tasksToUpdateLocally: Task[] = [];

            tasks.forEach((task) => {
                if (!task.expenses) return;

                const hasTargetExpense = task.expenses.some(exp => exp.processedDate?.startsWith(processedDate));

                if (hasTargetExpense) {
                    const updatedExpenses = task.expenses.map(exp => {
                        if (exp.processedDate?.startsWith(processedDate)) {
                            return { ...exp, status: newStatus };
                        }
                        return exp;
                    });
                    const updatedTask = { ...task, expenses: updatedExpenses };
                    tasksToUpdateLocally.push(updatedTask);
                    const taskRef = doc(db, "tasks", task.id);
                    batch.update(taskRef, { expenses: updatedExpenses });
                }
            });
            
            try {
                await batch.commit();
                set((state) => ({
                    tasks: state.tasks.map(task => {
                        const updatedVersion = tasksToUpdateLocally.find(t => t.id === task.id);
                        return updatedVersion || task;
                    })
                }));
            } catch (error) {
                console.error("Error updating expenses status by date: ", error);
            }
        },
    }),
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
      if (!get().isLoading) set({ isLoading: true });
      try {
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
  isLoading: boolean;
  fetchManagers: () => Promise<void>;
  addManager: (manager: Omit<Manager, 'id'>) => Promise<void>;
  updateManager: (manager: Manager) => Promise<void>;
  deleteManager: (id: string) => Promise<void>;
}

export const useManagerStore = create<ManagerState>()(
  (set, get) => ({
    managers: [],
    isLoading: true,
     fetchManagers: async () => {
      if (!get().isLoading) set({ isLoading: true });
      try {
        const querySnapshot = await getDocs(collection(db, "managers"));
        const managers = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Manager))
            .sort((a, b) => a.name.localeCompare(b.name));
        set({ managers, isLoading: false });
      } catch (error) {
        console.error("Error fetching managers: ", error);
        set({ isLoading: false });
      }
    },
    addManager: async (manager) => {
       try {
        const docRef = await addDoc(collection(db, "managers"), manager);
        const newManager = { ...manager, id: docRef.id };
        const sortedManagers = [...get().managers, newManager].sort((a, b) => a.name.localeCompare(b.name));
        set({ managers: sortedManagers });
      } catch (error) {
        console.error("Error adding manager: ", error);
      }
    },
    updateManager: async (updatedManager) => {
      try {
        const managerRef = doc(db, "managers", updatedManager.id);
        await updateDoc(managerRef, { name: updatedManager.name });
        const managers = get().managers.map((manager) =>
          manager.id === updatedManager.id ? updatedManager : manager
        );
        const sortedManagers = [...managers].sort((a, b) => a.name.localeCompare(b.name));
        set({ managers: sortedManagers });
      } catch (error) {
        console.error("Error updating manager: ", error);
      }
    },
    deleteManager: async (id) => {
      try {
        await deleteDoc(doc(db, "managers", id));
        set({ managers: get().managers.filter((manager) => manager.id !== id) });
      } catch (error) {
        console.error("Error deleting manager: ", error);
      }
    },
  })
);

// Store for Mission Types
interface MissionTypeState {
  missionTypes: MissionType[];
  isLoading: boolean;
  fetchMissionTypes: () => Promise<void>;
  addMissionType: (missionType: Omit<MissionType, 'id'>) => Promise<void>;
  updateMissionType: (missionType: MissionType) => Promise<void>;
  deleteMissionType: (id: string) => Promise<void>;
}

export const useMissionTypeStore = create<MissionTypeState>()(
   (set, get) => ({
    missionTypes: [],
    isLoading: true,
     fetchMissionTypes: async () => {
      if (!get().isLoading) set({ isLoading: true });
      try {
        const querySnapshot = await getDocs(collection(db, "missionTypes"));
        const missionTypes = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as MissionType))
            .sort((a, b) => a.name.localeCompare(b.name));
        set({ missionTypes, isLoading: false });
      } catch (error) {
        console.error("Error fetching mission types: ", error);
        set({ isLoading: false });
      }
    },
    addMissionType: async (missionType) => {
       try {
        const docRef = await addDoc(collection(db, "missionTypes"), missionType);
        const newMissionType = { ...missionType, id: docRef.id };
        const sortedMissionTypes = [...get().missionTypes, newMissionType].sort((a, b) => a.name.localeCompare(b.name));
        set({ missionTypes: sortedMissionTypes });
      } catch (error) {
        console.error("Error adding mission type: ", error);
      }
    },
    updateMissionType: async (updatedType) => {
        try {
            const typeRef = doc(db, "missionTypes", updatedType.id);
            await updateDoc(typeRef, { name: updatedType.name });
            const missionTypes = get().missionTypes.map((type) =>
            type.id === updatedType.id ? updatedType : type
            );
            const sortedMissionTypes = [...missionTypes].sort((a, b) => a.name.localeCompare(b.name));
            set({ missionTypes: sortedMissionTypes });
        } catch (error) {
            console.error("Error updating mission type: ", error);
        }
    },
    deleteMissionType: async (id) => {
       try {
        await deleteDoc(doc(db, "missionTypes", id));
        set({ missionTypes: get().missionTypes.filter((type) => type.id !== id) });
      } catch (error) {
        console.error("Error deleting mission type: ", error);
      }
    },
  })
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
            updateInvoice: async (id, receivedAmount, totalDue) => {
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
                   await useTaskStore.getState().updateExpensesStatusByProcessedDate(id, 'Payé');
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
