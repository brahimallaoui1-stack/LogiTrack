
"use client";

import { create } from 'zustand';
import type { Task, City, Manager, MissionType, Expense, ExpenseStatus, Invoice, User, ClientBalance } from './types';
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, orderBy, getDoc, setDoc, increment } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { format } from 'date-fns';

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

// --- AUTH STORE ---
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  init: () => () => void;
  signUp: (email: string, pass: string) => Promise<boolean>;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    error: null,
    init: () => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                set({ user: { uid: user.uid, email: user.email }, isLoading: false, error: null });
            } else {
                set({ user: null, isLoading: false, error: null });
            }
        });
        return unsubscribe;
    },
    signUp: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            set({ user: { uid: userCredential.user.uid, email: userCredential.user.email }, isLoading: false, error: null });
            return true;
        } catch (error: any) {
            set({ error: "L'adresse e-mail est peut-être déjà utilisée.", isLoading: false });
            return false;
        }
    },
    signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            set({ user: { uid: userCredential.user.uid, email: userCredential.user.email }, isLoading: false, error: null });
            return true;
        } catch (error: any) {
             set({ error: "Email ou mot de passe incorrect.", isLoading: false });
             return false;
        }
    },
    signOut: async () => {
        await signOut(auth);
        set({ user: null, error: null });
    },
}));


interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  processMissionExpenses: (taskIds: string[]) => Promise<void>;
  confirmExpenseBatch: (
    batchId: string,
    batchData: { approvedAmount: number; advance: number; accountantFees: number }
  ) => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
    (set, get) => ({
      tasks: [],
      isLoading: true,
      fetchTasks: async () => {
        if (!get().isLoading) set({ isLoading: true });
        const user = useAuthStore.getState().user;
        if (!user) {
            set({ tasks: [], isLoading: false });
            return;
        }
        try {
          const q = query(collection(db, `users/${user.uid}/tasks`));
          const querySnapshot = await getDocs(q);
          const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
          set({ tasks, isLoading: false });
        } catch (error) {
            console.error("Error fetching tasks: ", error);
            set({ isLoading: false });
        }
      },
      addTask: async (task) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        try {
            const docRef = await addDoc(collection(db, `users/${user.uid}/tasks`), task);
            const newTask = { ...task, id: docRef.id };
            set({ tasks: [newTask, ...get().tasks] });
        } catch (error) {
            console.error("Error adding task: ", error);
        }
      },
      updateTask: async (updatedTask) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        try {
            const taskRef = doc(db, `users/${user.uid}/tasks`, updatedTask.id);
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
        const user = useAuthStore.getState().user;
        if (!user) return;
         try {
            await deleteDoc(doc(db, `users/${user.uid}/tasks`, id));
            set((state) => ({
                tasks: state.tasks.filter((task) => task.id !== id),
            }));
        } catch (error) {
            console.error("Error deleting task: ", error);
        }
      },
       processMissionExpenses: async (taskIds: string[]) => {
         const user = useAuthStore.getState().user;
         if (!user) return;

         const tasksToUpdate = get().tasks.filter(t => taskIds.includes(t.id));
         if (tasksToUpdate.length === 0) return;

         const activeBatchRef = doc(db, `users/${user.uid}/state/activeBatch`);
         const activeBatchSnap = await getDoc(activeBatchRef);
         
         let batchId: string;
         const processedDate = new Date().toISOString();

         if (activeBatchSnap.exists() && activeBatchSnap.data().batchId) {
            batchId = activeBatchSnap.data().batchId;
         } else {
            batchId = `batch-${Date.now()}`;
            await setDoc(activeBatchRef, { batchId });
         }

         const batch = writeBatch(db);
         const updatedTasksLocally: Task[] = [];

         tasksToUpdate.forEach(task => {
            const updatedExpenses = task.expenses?.map(exp => {
                if (exp.status === 'Sans compte') {
                    return {
                        ...exp,
                        status: 'Comptabilisé' as ExpenseStatus,
                        batchId,
                        processedDate,
                    }
                }
                return exp;
            });

            if (updatedExpenses) {
                const updatedTask = { ...task, expenses: updatedExpenses };
                const taskRef = doc(db, `users/${user.uid}/tasks`, task.id);
                batch.update(taskRef, { expenses: updatedExpenses });
                updatedTasksLocally.push(updatedTask);
            }
         });
         
         try {
             await batch.commit();
             set(state => ({
                 tasks: state.tasks.map(t => {
                    const updatedVersion = updatedTasksLocally.find(ut => ut.id === t.id);
                    return updatedVersion || t;
                 })
             }));
         } catch (error) {
             console.error("Error processing mission expenses: ", error);
         }
       },
       confirmExpenseBatch: async (batchId, batchData) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const batch = writeBatch(db);
        const tasks = get().tasks;
        let tasksToUpdateLocally: Task[] = [];

        tasks.forEach(task => {
            if (!task.expenses) return;

            let hasChanged = false;
            const updatedExpenses = task.expenses.map(exp => {
                if (exp.batchId === batchId && exp.status === 'Comptabilisé') {
                    hasChanged = true;
                    return {
                        ...exp,
                        status: 'Confirmé' as ExpenseStatus,
                        approvedAmount: batchData.approvedAmount,
                        advance: batchData.advance,
                        accountantFees: batchData.accountantFees,
                    };
                }
                return exp;
            });

            if (hasChanged) {
                const taskRef = doc(db, `users/${user.uid}/tasks`, task.id);
                batch.update(taskRef, { expenses: updatedExpenses });
                tasksToUpdateLocally.push({ ...task, expenses: updatedExpenses });
            }
        });
        
        // Clear the active batch ID
        const activeBatchRef = doc(db, `users/${user.uid}/state/activeBatch`);
        batch.delete(activeBatchRef);

        try {
            await batch.commit();
            set(state => ({
                tasks: state.tasks.map(task => {
                    const updatedVersion = tasksToUpdateLocally.find(t => t.id === task.id);
                    return updatedVersion || task;
                })
            }));
        } catch (error) {
            console.error("Error confirming expense batch: ", error);
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
       const user = useAuthStore.getState().user;
       if (!user) {
           set({ cities: [], isLoading: false });
           return;
       }
      try {
        const q = query(collection(db, `users/${user.uid}/cities`), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const cities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
        set({ cities, isLoading: false });
      } catch (error) {
        console.error("Error fetching cities: ", error);
        set({ isLoading: false });
      }
    },
    addCity: async (city) => {
       const user = useAuthStore.getState().user;
       if (!user) return;
      try {
        const docRef = await addDoc(collection(db, `users/${user.uid}/cities`), city);
        const newCity = { ...city, id: docRef.id };
        const sortedCities = [...get().cities, newCity].sort((a, b) => a.name.localeCompare(b.name));
        set({ cities: sortedCities });
      } catch (error) {
        console.error("Error adding city: ", error);
      }
    },
    updateCity: async (updatedCity) => {
       const user = useAuthStore.getState().user;
       if (!user) return;
       try {
        const cityRef = doc(db, `users/${user.uid}/cities`, updatedCity.id);
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
       const user = useAuthStore.getState().user;
       if (!user) return;
       try {
        await deleteDoc(doc(db, `users/${user.uid}/cities`, id));
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
       const user = useAuthStore.getState().user;
       if (!user) {
           set({ managers: [], isLoading: false });
           return;
       }
      try {
        const q = query(collection(db, `users/${user.uid}/managers`), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const managers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Manager));
        set({ managers, isLoading: false });
      } catch (error) {
        console.error("Error fetching managers: ", error);
        set({ isLoading: false });
      }
    },
    addManager: async (manager) => {
       const user = useAuthStore.getState().user;
       if (!user) return;
       try {
        const docRef = await addDoc(collection(db, `users/${user.uid}/managers`), manager);
        const newManager = { ...manager, id: docRef.id };
        const sortedManagers = [...get().managers, newManager].sort((a, b) => a.name.localeCompare(b.name));
        set({ managers: sortedManagers });
      } catch (error) {
        console.error("Error adding manager: ", error);
      }
    },
    updateManager: async (updatedManager) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      try {
        const managerRef = doc(db, `users/${user.uid}/managers`, updatedManager.id);
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
      const user = useAuthStore.getState().user;
      if (!user) return;
      try {
        await deleteDoc(doc(db, `users/${user.uid}/managers`, id));
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
       const user = useAuthStore.getState().user;
       if (!user) {
           set({ missionTypes: [], isLoading: false });
           return;
       }
      try {
        const q = query(collection(db, `users/${user.uid}/missionTypes`), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const missionTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissionType));
        set({ missionTypes, isLoading: false });
      } catch (error) {
        console.error("Error fetching mission types: ", error);
        set({ isLoading: false });
      }
    },
    addMissionType: async (missionType) => {
       const user = useAuthStore.getState().user;
       if (!user) return;
       try {
        const docRef = await addDoc(collection(db, `users/${user.uid}/missionTypes`), missionType);
        const newMissionType = { ...missionType, id: docRef.id };
        const sortedMissionTypes = [...get().missionTypes, newMissionType].sort((a, b) => a.name.localeCompare(b.name));
        set({ missionTypes: sortedMissionTypes });
      } catch (error) {
        console.error("Error adding mission type: ", error);
      }
    },
    updateMissionType: async (updatedType) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        try {
            const typeRef = doc(db, `users/${user.uid}/missionTypes`, updatedType.id);
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
       const user = useAuthStore.getState().user;
       if (!user) return;
       try {
        await deleteDoc(doc(db, `users/${user.uid}/missionTypes`, id));
        set({ missionTypes: get().missionTypes.filter((type) => type.id !== id) });
      } catch (error) {
        console.error("Error deleting mission type: ", error);
      }
    },
  })
);

// Store for Invoicing
interface FacturationState {
    clientBalance: number;
    fetchClientBalance: () => Promise<void>;
    addPayment: (amount: number) => Promise<void>;
    applyBalanceToExpenses: (paymentInfo: { paymentDate: string; receivedAmount: number }) => Promise<void>;
}

export const useFacturationStore = create<FacturationState>((set, get) => ({
    clientBalance: 0,
    fetchClientBalance: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const balanceRef = doc(db, `users/${user.uid}/balance/client`);
        const docSnap = await getDoc(balanceRef);
        if (docSnap.exists()) {
            set({ clientBalance: docSnap.data().amount });
        } else {
            set({ clientBalance: 0 });
        }
    },
    addPayment: async (amount) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const balanceRef = doc(db, `users/${user.uid}/balance/client`);
        try {
            await setDoc(balanceRef, { amount: increment(amount) }, { merge: true });
            set((state) => ({ clientBalance: state.clientBalance + amount }));
        } catch (error) {
            console.error("Error adding payment:", error);
        }
    },
    applyBalanceToExpenses: async (paymentInfo) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        let currentBalance = get().clientBalance;
        if (currentBalance <= 0) return;

        const tasks = useTaskStore.getState().tasks;

        const groupedExpenses: Record<string, { netToPay: number; taskIds: Set<string>; processedDate: string }> = {};
        
        tasks.forEach(task => {
            task.expenses?.forEach(expense => {
                if (expense.status === 'Confirmé' && expense.batchId && expense.processedDate) {
                    const batchId = expense.batchId;
                    if (!groupedExpenses[batchId]) {
                        const approved = expense.approvedAmount ?? 0;
                        const advance = expense.advance ?? 0;
                        const fees = expense.accountantFees ?? 0;
                        const netToPay = approved - advance - fees;

                        groupedExpenses[batchId] = {
                            netToPay: netToPay,
                            taskIds: new Set(),
                            processedDate: expense.processedDate
                        };
                    }
                    groupedExpenses[batchId].taskIds.add(task.id);
                }
            });
        });

        const sortedGroups = Object.entries(groupedExpenses).sort(([, groupA], [, groupB]) => new Date(groupA.processedDate).getTime() - new Date(groupB.processedDate).getTime());

        const batch = writeBatch(db);
        let balanceChanged = false;
        let balanceToDeduct = 0;
        const paymentId = `payment-${Date.now()}`;

        for (const [batchId, group] of sortedGroups) {
            if (currentBalance >= group.netToPay) {
                group.taskIds.forEach(taskId => {
                    const taskRef = doc(db, `users/${user.uid}/tasks/${taskId}`);
                    const taskData = tasks.find(t => t.id === taskId);
                    if (taskData) {
                        const updatedExpenses = taskData.expenses?.map(exp => {
                            if (exp.batchId === batchId) {
                                return { 
                                    ...exp, 
                                    status: 'Payé' as ExpenseStatus,
                                    payment: { 
                                        ...(exp.payment || {}),
                                        paymentDate: paymentInfo.paymentDate,
                                        receivedAmount: paymentInfo.receivedAmount,
                                        paymentId: paymentId
                                    } 
                                };
                            }
                            return exp;
                        });
                        batch.update(taskRef, { expenses: updatedExpenses });
                    }
                });
                currentBalance -= group.netToPay;
                balanceToDeduct += group.netToPay;
                balanceChanged = true;
            } else {
                break;
            }
        }
        
        if (balanceChanged) {
            const balanceRef = doc(db, `users/${user.uid}/balance/client`);
            batch.update(balanceRef, { amount: increment(-balanceToDeduct) });
        }
        
        try {
            await batch.commit();
            await useTaskStore.getState().fetchTasks();
            await get().fetchClientBalance();
        } catch (error) {
            console.error("Error applying balance to expenses:", error);
        }
    }
}));
