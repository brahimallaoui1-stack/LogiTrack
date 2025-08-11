
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Eye, Briefcase, Calendar, MapPin } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";


export default function MissionsPage() {
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const router = useRouter();
  const isClient = useIsClient();

  useEffect(() => {
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
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                   <Card key={i}>
                       <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                       <CardContent className="space-y-3">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-2/3" />
                       </CardContent>
                   </Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
         <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Missions</h1>
            <p className="text-muted-foreground">
                Voici la liste complète de toutes les missions enregistrées.
            </p>
         </div>
         <Button onClick={handleAddNew}>Ajouter une mission</Button>
      </div>
      
      {sortedTasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedTasks.map((task) => {
                const displayData = getTaskDisplayData(task);
                return (
                    <Card key={task.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base break-words">{formatDate(displayData.date, "dd-MM-yyyy")}</CardTitle>
                             <Button variant="outline" size="icon" onClick={() => handleView(task.id)} className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{displayData.ville || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{displayData.typeMission || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
      ) : (
        <div className="text-center py-16">
            <h3 className="text-lg font-semibold">Aucune mission trouvée</h3>
            <p className="text-muted-foreground mt-2">Commencez par ajouter une nouvelle mission.</p>
        </div>
      )}

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
