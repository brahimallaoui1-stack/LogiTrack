
// Les types de données seront définis ici.

export type ExpenseStatus = 'Sans compte' | 'Comptabilisé' | 'Confirmé' | 'Payé';

export interface Invoice {
  // Not a separate document anymore, but part of an expense
  paymentDate?: string;
  paymentId?: string; // Unique ID for the payment transaction
  receivedAmount?: number;
}

export interface Expense {
  id: string;
  typeDepense: string;
  montant: number;
  remarque?: string;
  status: ExpenseStatus;
  processedDate?: string;
  
  // New accounting fields
  approvedAmount?: number;
  advance?: number;
  accountantFees?: number;
  
  payment?: Invoice;
}

export interface SubMission {
  id: string;
  date?: string;
  reservation?: string;
  city?: string;
  entreprise?: string; 
  typeMission?: string;
  gestionnaire?: string;
  marqueVehicule?: string;
  immatriculation?: string;
  remarque?: string;
}

export interface Task {
  id: string;
  label: string; // Le nom global de la mission
  city: string; // Casablanca ou Hors Casablanca
  
  // Pour les missions simples (Casablanca)
  date?: string;
  reservation?: string;
  entreprise?: string; 
  gestionnaire?: string;
  typeMission?: string;
  marqueVehicule?: string;
  immatriculation?: string;
  remarque?: string;
  
  // Pour les missions complexes (Hors Casablanca)
  subMissions?: SubMission[];
  expenses?: Expense[];
}

export interface City {
  id: string;
  name: string;
}

export interface Manager {
  id: string;
  name: string;
}

export interface MissionType {
  id: string;
  name: string;
}

export interface User {
    uid: string;
    email: string | null;
}

export interface ClientBalance {
    amount: number;
}

    