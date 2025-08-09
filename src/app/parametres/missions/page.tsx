"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMissionTypeStore } from "@/lib/store";

export default function ParametresMissionsPage() {
  const { missionTypes, addMissionType } = useMissionTypeStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const handleAddMissionType = () => {
    if (newTypeName.trim()) {
      addMissionType({ name: newTypeName.trim() });
      setNewTypeName("");
      setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center p-6 pb-0">
        <CardHeader className="p-0">
          <CardTitle>Paramètres des Types de Mission</CardTitle>
          <CardDescription>Gérez les types de missions à partir d'ici.</CardDescription>
        </CardHeader>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un type de mission</DialogTitle>
              <DialogDescription>Entrez le nom du nouveau type de mission.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du type</Label>
                <Input id="name" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMissionType}>Enregistrer</Button>
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
            {missionTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.id}</TableCell>
                <TableCell>{type.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
