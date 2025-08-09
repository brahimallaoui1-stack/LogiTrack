
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTaskStore, useCityStore, useManagerStore, useMissionTypeStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MissionFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    task?: Task | null;
}

const initialFormState = {
  date: "",
  reservation: "",
  ville: "",
  entreprise: "",
  gestionnaire: "",
  infoVehicule: "",
  typeTache: "",
  typeVehicule: "",
  immatriculation: "",
  typeDepense: "",
  montant: "",
  remarque: "",
  label: ""
};

export function MissionFormDialog({ isOpen, onOpenChange, task: editingTask }: MissionFormDialogProps) {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  
  const { cities } = useCityStore();
  const { managers } = useManagerStore();
  const { missionTypes } = useMissionTypeStore();

  const [formState, setFormState] = useState(initialFormState);
  
  useEffect(() => {
    if (editingTask) {
      setFormState({
        date: editingTask.date || "",
        reservation: editingTask.reservation || "",
        ville: editingTask.city || "",
        entreprise: editingTask.entreprise || "",
        gestionnaire: editingTask.gestionnaire || "",
        infoVehicule: editingTask.infoVehicule || "",
        typeTache: editingTask.typeTache || "",
        typeVehicule: editingTask.typeVehicule || "",
        immatriculation: editingTask.immatriculation || "",
        typeDepense: editingTask.typeDepense || "",
        montant: editingTask.montant?.toString() || "",
        remarque: editingTask.remarque || "",
        label: editingTask.label || ""
      });
    } else {
      setFormState(initialFormState);
    }
  }, [editingTask]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSave = () => {
    if (editingTask) {
       const updated: Task = {
        ...editingTask,
        label: formState.typeTache || 'Nouvelle mission',
        city: formState.ville,
        date: formState.date,
        reservation: formState.reservation,
        entreprise: formState.entreprise,
        gestionnaire: formState.gestionnaire,
        infoVehicule: formState.infoVehicule,
        typeTache: formState.typeTache,
        typeVehicule: formState.typeVehicule,
        immatriculation: formState.immatriculation,
        typeDepense: formState.typeDepense,
        montant: formState.montant ? parseFloat(formState.montant) : undefined,
        remarque: formState.remarque,
      };
      updateTask(updated);
    } else {
      const newTask: Omit<Task, 'id'> = {
        label: formState.typeTache || 'Nouvelle mission',
        city: formState.ville,
        date: formState.date,
        reservation: formState.reservation,
        entreprise: formState.entreprise,
        gestionnaire: formState.gestionnaire,
        infoVehicule: formState.infoVehicule,
        typeTache: formState.typeTache,
        typeVehicule: formState.typeVehicule,
        immatriculation: formState.immatriculation,
        typeDepense: formState.typeDepense,
        montant: formState.montant ? parseFloat(formState.montant) : undefined,
        remarque: formState.remarque,
      };
      addTask(newTask);
    }
    setFormState(initialFormState);
    onOpenChange(false);
  };

  return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-2xl">
         <DialogHeader>
           <DialogTitle>{editingTask ? "Modifier la mission" : "Ajouter une mission"}</DialogTitle>
           <DialogDescription>
             {editingTask ? "Mettez à jour les détails de la mission." : "Remplissez les détails de la nouvelle mission ci-dessous."}
           </DialogDescription>
         </DialogHeader>
         <ScrollArea className="max-h-[70vh] p-4">
          <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={formState.date} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="reservation">Réservation</Label>
                    <Input id="reservation" value={formState.reservation} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="ville">Ville</Label>
                     <Select value={formState.ville} onValueChange={(value) => handleSelectChange('ville', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une ville" />
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map(city => (
                                <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="entreprise">Entreprise</Label>
                    <Input id="entreprise" value={formState.entreprise} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="gestionnaire">Gestionnaire</Label>
                     <Select value={formState.gestionnaire} onValueChange={(value) => handleSelectChange('gestionnaire', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un gestionnaire" />
                        </SelectTrigger>
                        <SelectContent>
                            {managers.map(manager => (
                                <SelectItem key={manager.id} value={manager.name}>{manager.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="infoVehicule">Infos véhicule</Label>
                    <Input id="infoVehicule" value={formState.infoVehicule} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="typeTache">Type de tâche</Label>
                     <Select value={formState.typeTache} onValueChange={(value) => handleSelectChange('typeTache', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de tâche" />
                        </SelectTrigger>
                        <SelectContent>
                            {missionTypes.map(type => (
                                <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="typeVehicule">Type de véhicule</Label>
                    <Input id="typeVehicule" value={formState.typeVehicule} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="immatriculation">Immatriculation</Label>
                    <Input id="immatriculation" value={formState.immatriculation} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="typeDepense">Type de dépense</Label>
                    <Input id="typeDepense" value={formState.typeDepense} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="montant">Montant</Label>
                    <Input id="montant" type="number" value={formState.montant} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="remarque">Remarque</Label>
                  <Textarea id="remarque" value={formState.remarque} onChange={handleInputChange} />
              </div>
          </div>
        </ScrollArea>
         <DialogFooter>
           <Button type="submit" onClick={handleSave}>Enregistrer</Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
  );
}

