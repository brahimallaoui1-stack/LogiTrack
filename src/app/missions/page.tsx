
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTaskStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task } from "@/lib/types";

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

export default function MissionsPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSave = () => {
    const newTask: Omit<Task, 'id'> = {
      label: formState.typeTache || 'Nouvelle mission', // Using 'typeTache' as the label for now
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
    setFormState(initialFormState);
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
       <div className="flex justify-end">
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button>Ajouter une mission</Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-2xl">
             <DialogHeader>
               <DialogTitle>Ajouter une mission</DialogTitle>
               <DialogDescription>
                 Remplissez les détails de la nouvelle mission ci-dessous.
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
                        <Input id="ville" value={formState.ville} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="entreprise">Entreprise</Label>
                        <Input id="entreprise" value={formState.entreprise} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gestionnaire">Gestionnaire</Label>
                        <Input id="gestionnaire" value={formState.gestionnaire} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="infoVehicule">Infos véhicule</Label>
                        <Input id="infoVehicule" value={formState.infoVehicule} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="typeTache">Type de tâche</Label>
                        <Input id="typeTache" value={formState.typeTache} onChange={handleInputChange} />
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
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des Missions</CardTitle>
          <CardDescription>
            Voici la liste complète de toutes les missions enregistrées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Ville</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.label}</TableCell>
                  <TableCell>{task.city}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
