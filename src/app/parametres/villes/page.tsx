
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCityStore, useAppStore } from "@/lib/store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { City } from "@/lib/types";

export default function ParametresVillesPage() {
  const { cities, addCity, updateCity, deleteCity } = useCityStore();
  const isHydrated = useAppStore((state) => state.isHydrated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityToDelete, setCityToDelete] = useState<string | null>(null);

  const [cityName, setCityName] = useState("");

  const handleOpenFormDialog = (city: City | null) => {
    setEditingCity(city);
    setCityName(city ? city.name : "");
    setIsFormDialogOpen(true);
  };
  
  const handleCloseFormDialog = () => {
    setEditingCity(null);
    setCityName("");
    setIsFormDialogOpen(false);
  }

  const handleSave = () => {
    if (cityName.trim()) {
      if (editingCity) {
        updateCity({ ...editingCity, name: cityName.trim() });
      } else {
        addCity({ name: cityName.trim() });
      }
      handleCloseFormDialog();
    }
  };

  const handleDelete = (id: string) => {
    setCityToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (cityToDelete) {
      deleteCity(cityToDelete);
    }
    setCityToDelete(null);
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
            <CardTitle>Paramètres des Villes</CardTitle>
            <CardDescription>Gérez les paramètres des villes à partir d'ici.</CardDescription>
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
              {cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell>{city.name}</TableCell>
                   <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenFormDialog(city)}>
                          <Pencil className="mr-2 h-4 w-4"/>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(city.id)} className="text-destructive">
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
            <DialogTitle>{editingCity ? "Modifier la ville" : "Ajouter une ville"}</DialogTitle>
            <DialogDescription>
              {editingCity ? "Modifiez le nom de la ville." : "Entrez le nom de la nouvelle ville."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de la ville</Label>
              <Input id="name" value={cityName} onChange={(e) => setCityName(e.target.value)} />
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
                Cette action est irréversible. Cela supprimera définitivement la ville.
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
