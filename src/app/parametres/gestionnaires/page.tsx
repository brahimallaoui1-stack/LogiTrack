
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useManagerStore, useAppStore } from "@/lib/store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Manager } from "@/lib/types";

export default function ParametresGestionnairesPage() {
  const { managers, addManager, updateManager, deleteManager } = useManagerStore();
  const isHydrated = useAppStore((state) => state.isHydrated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [managerToDelete, setManagerToDelete] = useState<string | null>(null);

  const [managerName, setManagerName] = useState("");

  const handleOpenFormDialog = (manager: Manager | null) => {
    setEditingManager(manager);
    setManagerName(manager ? manager.name : "");
    setIsFormDialogOpen(true);
  };
  
  const handleCloseFormDialog = () => {
    setEditingManager(null);
    setManagerName("");
    setIsFormDialogOpen(false);
  }

  const handleSave = () => {
    if (managerName.trim()) {
      if (editingManager) {
        updateManager({ ...editingManager, name: managerName.trim() });
      } else {
        addManager({ name: managerName.trim() });
      }
      handleCloseFormDialog();
    }
  };

  const handleDelete = (id: string) => {
    setManagerToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (managerToDelete) {
      deleteManager(managerToDelete);
    }
    setManagerToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  if (!isHydrated || !isClient) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <Card>
        <div className="flex justify-between items-center p-6 pb-0">
          <CardHeader className="p-0">
            <CardTitle>Paramètres des Gestionnaires</CardTitle>
            <CardDescription>Gérez les paramètres des gestionnaires à partir d'ici.</CardDescription>
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
              {managers.map((manager) => (
                <TableRow key={manager.id}>
                  <TableCell>{manager.name}</TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenFormDialog(manager)}>
                          <Pencil className="mr-2 h-4 w-4"/>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(manager.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4"/>
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingManager ? "Modifier le gestionnaire" : "Ajouter un gestionnaire"}</DialogTitle>
            <DialogDescription>
              {editingManager ? "Modifiez le nom du gestionnaire." : "Entrez le nom du nouveau gestionnaire."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du gestionnaire</Label>
              <Input id="name" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
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
                Cette action est irréversible. Cela supprimera définitivement le gestionnaire.
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
