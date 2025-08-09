
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMissionTypeStore } from "@/lib/store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { MissionType } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParametresMissionsPage() {
  const { missionTypes, isLoading, fetchMissionTypes, addMissionType, updateMissionType, deleteMissionType } = useMissionTypeStore();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingMissionType, setEditingMissionType] = useState<MissionType | null>(null);
  const [missionTypeToDelete, setMissionTypeToDelete] = useState<string | null>(null);

  const [typeName, setTypeName] = useState("");

  useEffect(() => {
    fetchMissionTypes();
  }, [fetchMissionTypes]);

  const handleOpenFormDialog = (type: MissionType | null) => {
    setEditingMissionType(type);
    setTypeName(type ? type.name : "");
    setIsFormDialogOpen(true);
  };
  
  const handleCloseFormDialog = () => {
    setEditingMissionType(null);
    setTypeName("");
    setIsFormDialogOpen(false);
  }

  const handleSave = async () => {
    if (typeName.trim()) {
      if (editingMissionType) {
        await updateMissionType({ ...editingMissionType, name: typeName.trim() });
      } else {
        await addMissionType({ name: typeName.trim() });
      }
      handleCloseFormDialog();
    }
  };

  const handleDelete = (id: string) => {
    setMissionTypeToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (missionTypeToDelete) {
      await deleteMissionType(missionTypeToDelete);
    }
    setMissionTypeToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-center p-6 pb-0">
          <CardHeader className="p-0">
            <CardTitle>Paramètres des Types de Mission</CardTitle>
            <CardDescription>Gérez les types de missions à partir d'ici.</CardDescription>
          </CardHeader>
          <Button onClick={() => handleOpenFormDialog(null)}>Ajouter</Button>
        </div>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                  </TableRow>
                ))
              ) : (
                missionTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                     <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir le menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenFormDialog(type)}>
                            <Pencil className="mr-2 h-4 w-4"/>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(type.id)} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4"/>
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMissionType ? "Modifier le type de mission" : "Ajouter un type de mission"}</DialogTitle>
              <DialogDescription>
                {editingMissionType ? "Modifiez le nom du type de mission." : "Entrez le nom du nouveau type de mission."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du type</Label>
                <Input id="name" value={typeName} onChange={(e) => setTypeName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseFormDialog}>Annuler</Button>
              <Button onClick={handleSave}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement le type de mission.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
