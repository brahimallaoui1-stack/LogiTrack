
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { MissionFormDialog } from "@/components/MissionFormDialog";
import { formatDate } from "@/lib/utils";


export default function MissionsPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const router = useRouter();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCityChoiceDialogOpen, setIsCityChoiceDialogOpen] = useState(false);
  const [prefilledCity, setPrefilledCity] = useState<string | undefined>(undefined);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const getDate = (task: Task) => {
        if (task.city === 'Casablanca') {
          return task.date ? new Date(task.date) : new Date(0);
        }
        const firstSubMission = task.subMissions?.[0];
        return firstSubMission?.date ? new Date(firstSubMission.date) : new Date(0);
      };

      const dateA = getDate(a);
      const dateB = getDate(b);

      return dateB.getTime() - dateA.getTime();
    });
  }, [tasks]);
  
  const handleView = (taskId: string) => {
    router.push(`/missions/view/${taskId}`);
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setIsCityChoiceDialogOpen(true);
  };

  const handleCityChoice = (city?: string) => {
    setPrefilledCity(city);
    setIsCityChoiceDialogOpen(false);
    setIsDialogOpen(true);
  }

  const getTaskDisplayData = (task: Task) => {
    if (task.city === 'Casablanca') {
      return {
        date: task.date,
        ville: task.city,
        typeMission: task.typeMission
      };
    } else {
      const firstSubMission = task.subMissions?.[0];
      const allCities = task.subMissions?.map(s => s.city).filter(Boolean) ?? [];
      const uniqueCities = [...new Set(allCities)];
      
      return {
        date: firstSubMission?.date,
        ville: uniqueCities.join(' / ') || 'Hors Casablanca',
        typeMission: task.label // label is already a concatenation of types
      };
    }
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
                <TableHead>Date</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Type de mission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => {
                const displayData = getTaskDisplayData(task);
                return (
                  <TableRow key={task.id}>
                    <TableCell>{formatDate(displayData.date)}</TableCell>
                    <TableCell>{displayData.ville || 'N/A'}</TableCell>
                    <TableCell>{displayData.typeMission || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleView(task.id)}>
                            Afficher
                        </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <MissionFormDialog 
      isOpen={isDialogOpen} 
      onOpenChange={setIsDialogOpen} 
      task={editingTask}
      prefilledCity={prefilledCity}
    />

    <AlertDialog open={isCityChoiceDialogOpen} onOpenChange={setIsCityChoiceDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Type de mission</AlertDialogTitle>
                <AlertDialogDescription>
                    La mission se déroule-t-elle à Casablanca ou en dehors ?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => handleCityChoice()}>Hors Casablanca</Button>
                <Button onClick={() => handleCityChoice('Casablanca')}>Casablanca</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
