export interface Expense {
  id: string;
  type: string;
  amount: number;
  receiptUrl?: string;
  receiptFilename?: string;
  suggestedCategories?: string[];
}

export interface Task {
  id: string;
  date: string;
  city: string;
  taskNumber: string;
  company: string;
  deliveryVehicleType: string;
  deliveryVehiclePlate: string;
  returnVehicleType: string;
  returnVehiclePlate: string;
  status: 'unbilled' | 'billed';
  expenses: Expense[];
  approvedAmount?: number;
  advance?: number;
  commission?: number;
}
