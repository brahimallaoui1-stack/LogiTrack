"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCityStore } from "@/lib/store";

export default function ParametresVillesPage() {
  const { cities, addCity } = useCityStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");

  const handleAddCity = () => {
    if (newCityName.trim()) {
      addCity({ name: newCityName.trim() });
      setNewCityName("");
      setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center p-6 pb-0">
        <CardHeader className="p-0">
          <CardTitle>Paramètres des Villes</CardTitle>
          <CardDescription>Gérez les paramètres des villes à partir d'ici.</CardDescription>
        </CardHeader>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une ville</DialogTitle>
              <DialogDescription>Entrez le nom de la nouvelle ville.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom de la ville</Label>
                <Input id="name" value={newCityName} onChange={(e) => setNewCityName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCity}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nom</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.map((city) => (
              <TableRow key={city.id}>
                <TableCell>{city.id}</TableCell>
                <TableCell>{city.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
