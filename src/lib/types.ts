// Les types de données seront définis ici.

export interface Expense {
  id: string;
  typeDepense: string;
  montant: number;
  remarque?: string;
}
export interface Task {
  id: string;
  label: string;
  city: string;
  date?: string;
  reservation?: string;
  entreprise?: string; // Maintenu comme 'entreprise' en interne, mais libellé 'Client'
  gestionnaire?: string;
  typeMission?: string;
  
  // Livraison
  marqueVehiculeLivraison?: string;
  immatriculationLivraison?: string;
  remarqueLivraison?: string;

  // Récupération
  marqueVehiculeRecuperation?: string;
  immatriculationRecuperation?: string;
  remarqueRecuperation?: string;
  
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
