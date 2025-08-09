// Les types de données seront définis ici.
export interface Task {
  id: string;
  label: string;
  city: string;
  date?: string;
  reservation?: string;
  entreprise?: string;
  gestionnaire?: string;
  infoVehicule?: string;
  typeTache?: string;
  typeVehicule?: string;
  immatriculation?: string;
  typeDepense?: string;
  montant?: number;
  remarque?: string;
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
