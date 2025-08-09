
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
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MissionsPage() {
  const tasks = useTaskStore((state) => state.tasks);

  return (
    <div className="flex flex-col gap-4">
       <div className="flex justify-end">
         <Dialog>
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
                        <Input id="date" type="date" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reservation">Réservation</Label>
                        <Input id="reservation" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="ville">Ville</Label>
                        <Input id="ville" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="entreprise">Entreprise</Label>
                        <Input id="entreprise" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gestionnaire">Gestionnaire</Label>
                        <Input id="gestionnaire" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="info-vehicule">Infos véhicule</Label>
                        <Input id="info-vehicule" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type-tache">Type de tâche</Label>
                        <Input id="type-tache" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type-vehicule">Type de véhicule</Label>
                        <Input id="type-vehicule" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="immatriculation">Immatriculation</Label>
                        <Input id="immatriculation" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type-depense">Type de dépense</Label>
                        <Input id="type-depense" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="montant">Montant</Label>
                        <Input id="montant" type="number" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="remarque">Remarque</Label>
                      <Textarea id="remarque" />
                  </div>
              </div>
            </ScrollArea>
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
