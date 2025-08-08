"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, Expense } from './types';
import { produce } from 'immer';

interface TaskState {
  tasks: Task[];
  getTaskById: (id: string) => Task | undefined;
  addTask: (task: Task) => void;
  updateTask: (updatedTask: Partial<Task> & { id: string }) => void;
  addExpenseToTask: (taskId: string, expense: Expense) => void;
  setTaskBilled: (taskId: string) => void;
  updateBilledTaskDetails: (taskId: string, details: { approvedAmount?: number; advance?: number; commission?: number }) => void;
  isInitialized: boolean;
}

const initialTasks: Task[] = [
  {
    id: 'task-1',
    date: '2024-05-10',
    city: 'Paris',
    taskNumber: 'T-12345',
    company: 'Global Logistics',
    deliveryVehicleType: 'Van',
    deliveryVehiclePlate: 'AB-123-CD',
    returnVehicleType: 'Van',
    returnVehiclePlate: 'AB-123-CD',
    status: 'unbilled',
    expenses: [
      { id: 'exp-1-1', type: 'Repas', amount: 25.50 },
      { id: 'exp-1-2', type: 'Taxi', amount: 42.00, receiptUrl: 'https://placehold.co/600x400.png', receiptFilename: 'taxi.png' },
    ],
  },
  {
    id: 'task-2',
    date: '2024-05-12',
    city: 'Lyon',
    taskNumber: 'T-67890',
    company: 'Speedy Deliveries',
    deliveryVehicleType: 'Truck',
    deliveryVehiclePlate: 'EF-456-GH',
    returnVehicleType: 'Truck',
    returnVehiclePlate: 'EF-456-GH',
    status: 'unbilled',
    expenses: [
      { id: 'exp-2-1', type: 'Hébergement', amount: 120.00, receiptUrl: 'https://placehold.co/600x400.png', receiptFilename: 'hotel.png' },
    ],
  },
   {
    id: 'task-3',
    date: '2024-04-20',
    city: 'Marseille',
    taskNumber: 'T-54321',
    company: 'Southern Couriers',
    deliveryVehicleType: 'Scooter',
    deliveryVehiclePlate: 'IJ-789-KL',
    returnVehicleType: 'Scooter',
    returnVehiclePlate: 'IJ-789-KL',
    status: 'billed',
    expenses: [
      { id: 'exp-3-1', type: 'Repas', amount: 18.75 },
      { id: 'exp-3-2', type: 'Autre', amount: 10.00 },
    ],
    approvedAmount: 30.00,
    advance: 5.00,
    commission: 2.00,
  }
];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: initialTasks,
      isInitialized: false,
      getTaskById: (id: string) => get().tasks.find((task) => task.id === id),
      addTask: (task: Task) => {
        set(
          produce((state: TaskState) => {
            state.tasks.push(task);
          })
        );
      },
      updateTask: (updatedTask: Partial<Task> & { id: string }) => {
        set(
          produce((state: TaskState) => {
            const taskIndex = state.tasks.findIndex((t) => t.id === updatedTask.id);
            if (taskIndex !== -1) {
              state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updatedTask };
            }
          })
        );
      },
      addExpenseToTask: (taskId: string, expense: Expense) => {
        set(
          produce((state: TaskState) => {
            const task = state.tasks.find((t) => t.id === taskId);
            if (task) {
              task.expenses.push(expense);
            }
          })
        );
      },
      setTaskBilled: (taskId: string) => {
        set(
          produce((state: TaskState) => {
            const task = state.tasks.find((t) => t.id === taskId);
            if (task) {
              task.status = 'billed';
            }
          })
        );
      },
      updateBilledTaskDetails: (taskId: string, details: { approvedAmount?: number; advance?: number; commission?: number }) => {
         set(
          produce((state: TaskState) => {
            const task = state.tasks.find((t) => t.id === taskId);
            if (task && task.status === 'billed') {
                if(details.approvedAmount !== undefined) task.approvedAmount = details.approvedAmount;
                if(details.advance !== undefined) task.advance = details.advance;
                if(details.commission !== undefined) task.commission = details.commission;
            }
          })
        );
      }
    }),
    {
      name: 'expensetrack-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
