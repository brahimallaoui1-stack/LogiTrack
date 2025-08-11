
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { MissionFormDialog } from "@/components/MissionFormDialog";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";


export default function MissionsPage() {
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    fetchTasks();
  }, [fetchTasks]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCityChoiceDialogOpen, setIsCityChoiceDialogOpen] = useState(false);
  const [prefilledCity, setPrefilledCity] = useState<string | undefined>(undefined);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const getDate = (task: Task) => {
        const primaryDate = task.date || (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].date : '1970-01-01');
        return new Date(primaryDate || '1970-01-01');
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

  if (!isClient || isLoading) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <Skeleton className="h-10 w-40" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <Skeleton className="h-9 w-20" />
                            </div>
                        ))}
                   </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-4">
       <div className="flex justify-end">
         <Button onClick={handleAddNew}>Ajouter une mission</Button>
      </div>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Liste des Missions</CardTitle>
          <CardDescription>
            Voici la liste complète de toutes les missions enregistrées.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 sm:px-4">Date</TableHead>
                <TableHead className="px-2 sm:px-4">Ville</TableHead>
                <TableHead className="px-2 sm:px-4">Type de mission</TableHead>
                <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => {
                const displayData = getTaskDisplayData(task);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatDate(displayData.date, "dd-MM-yyyy")}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{displayData.ville || 'N/A'}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{displayData.typeMission || 'N/A'}</TableCell>
                    <TableCell className="text-right px-2 sm:px-4">
                        <Button variant="outline" size="icon" onClick={() => handleView(task.id)} className="h-8 w-8">
                            <Eye className="h-4 w-4" />
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
