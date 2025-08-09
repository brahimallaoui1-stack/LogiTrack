
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { MoreHorizontal } from "lucide-react";
import { MissionFormDialog } from "@/components/MissionFormDialog";


export default function MissionsPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);


  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
    }
    setTaskToDelete(null);
    setIsDeleteDialogOpen(false);
  };


  return (
    <>
    <div className="flex flex-col gap-4">
       <div className="flex justify-end">
         <Button onClick={handleAddNew}>Ajouter une mission</Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.label}</TableCell>
                  <TableCell>{task.city}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(task)}>Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(task.id)} className="text-destructive">Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <MissionFormDialog 
      isOpen={isDialogOpen} 
      onOpenChange={setIsDialogOpen} 
      task={editingTask}
    />

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Cela supprimera définitivement la mission.
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
