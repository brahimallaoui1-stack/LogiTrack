"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useManagerStore } from "@/lib/store";

export default function ParametresGestionnairesPage() {
  const { managers, addManager } = useManagerStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newManagerName, setNewManagerName] = useState("");

  const handleAddManager = () => {
    if (newManagerName.trim()) {
      addManager({ name: newManagerName.trim() });
      setNewManagerName("");
      setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center p-6 pb-0">
        <CardHeader className="p-0">
          <CardTitle>Paramètres des Gestionnaires</CardTitle>
          <CardDescription>Gérez les paramètres des gestionnaires à partir d'ici.</CardDescription>
        </CardHeader>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un gestionnaire</DialogTitle>
              <DialogDescription>Entrez le nom du nouveau gestionnaire.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du gestionnaire</Label>
                <Input id="name" value={newManagerName} onChange={(e) => setNewManagerName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddManager}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager) => (
              <TableRow key={manager.id}>
                <TableCell>{manager.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
