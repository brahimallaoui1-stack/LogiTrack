"use client";

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

export default function MissionsPage() {
  const tasks = useTaskStore((state) => state.tasks);

  return (
    <div className="flex flex-col gap-4">
       <div className="flex justify-end">
         <Dialog>
           <DialogTrigger asChild>
             <Button>Ajouter une mission</Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[625px]">
             <DialogHeader>
               <DialogTitle>Ajouter une mission</DialogTitle>
               <DialogDescription>
                 Remplissez les détails de la nouvelle mission ci-dessous.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Date</Label>
                    <Input id="date" type="date" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reservation" className="text-right">Réservation</Label>
                    <Input id="reservation" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ville" className="text-right">Ville</Label>
                    <Input id="ville" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="entreprise" className="text-right">Entreprise</Label>
                    <Input id="entreprise" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gestionnaire" className="text-right">Gestionnaire</Label>
                    <Input id="gestionnaire" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="info-vehicule" className="text-right">Infos véhicule</Label>
                    <Input id="info-vehicule" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type-tache" className="text-right">Type de tâche</Label>
                    <Input id="type-tache" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type-vehicule" className="text-right">Type de véhicule</Label>
                    <Input id="type-vehicule" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="immatriculation" className="text-right">Immatriculation</Label>
                    <Input id="immatriculation" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type-depense" className="text-right">Type de dépense</Label>
                    <Input id="type-depense" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="montant" className="text-right">Montant</Label>
                    <Input id="montant" type="number" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="remarque" className="text-right">Remarque</Label>
                    <Textarea id="remarque" className="col-span-3" />
                </div>
             </div>
             <DialogFooter>
               <Button type="submit">Enregistrer</Button>
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
                <TableHead>ID</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>Ville</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
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