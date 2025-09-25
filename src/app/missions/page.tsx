
"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Eye, Briefcase, MapPin, XCircle, User } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { getYear, getMonth, parseISO, format, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

function MissionsPageComponent() {
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClient = useIsClient();

  // Category filters
  const cityFilter = searchParams.get('city');
  const managerFilter = searchParams.get('gestionnaire');
  const typeFilter = searchParams.get('typeMission');
  
  // Date filters
  const timeRangeFilter = searchParams.get('timeRange');
  const dateFilter = searchParams.get('date');
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCityChoiceDialogOpen, setIsCityChoiceDialogOpen] = useState(false);
  const [prefilledCity, setPrefilledCity] = useState<string | undefined>(undefined);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply category filters
    if (cityFilter) {
        filtered = filtered.filter(task => {
            if(task.city === 'Casablanca') return task.city === cityFilter;
            return task.subMissions?.some(sub => sub.city === cityFilter);
        });
    }
    if (managerFilter) {
        filtered = filtered.filter(task => {
            if(task.city === 'Casablanca') return task.gestionnaire === managerFilter;
            return task.subMissions?.some(sub => sub.gestionnaire === managerFilter);
        });
    }
    if (typeFilter) {
        filtered = filtered.filter(task => {
            if(task.city === 'Casablanca') return task.typeMission === typeFilter;
            return task.subMissions?.some(sub => sub.typeMission === typeFilter);
        });
    }

    // Apply date filter
    if (timeRangeFilter && dateFilter) {
        try {
            const filterDate = parseISO(dateFilter);
            const selectedYear = getYear(filterDate);
            const selectedMonth = getMonth(filterDate);
            const weekStart = startOfWeek(filterDate, { weekStartsOn: 1, locale: fr });
            const weekEnd = endOfWeek(filterDate, { weekStartsOn: 1, locale: fr });

            filtered = filtered.filter(task => {
                const checkDate = (dateStr?: string) => {
                    if (!dateStr) return false;
                    try {
                        const taskDate = parseISO(dateStr);
                        
                        if (timeRangeFilter === 'year') {
                            return getYear(taskDate) === selectedYear;
                        }
                        if (timeRangeFilter === 'month') {
                            return getYear(taskDate) === selectedYear && getMonth(taskDate) === selectedMonth;
                        }
                        if (timeRangeFilter === 'week') {
                           return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
                        }
                        return false;
                    } catch (e) { return false; }
                };

                if (task.city === 'Casablanca') {
                    return checkDate(task.date);
                } else {
                    return task.subMissions?.some(sub => checkDate(sub.date));
                }
            });
        } catch (e) {
            console.error("Invalid date filter format:", dateFilter);
        }
    }


    return filtered;

  }, [tasks, cityFilter, managerFilter, typeFilter, timeRangeFilter, dateFilter]);

  const sortedTasks = useMemo(() => {
    return filteredTasks.sort((a, b) => {
      const getDate = (task: Task) => {
        const primaryDate = task.date || (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].date : '1970-01-01');
        return new Date(primaryDate || '1970-01-01');
      };

      const dateA = getDate(a);
      const dateB = getDate(b);

      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredTasks]);
  
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

  const handleClearFilters = () => {
    router.push('/missions');
  };

  const getTaskDisplayData = (task: Task) => {
    if (task.city === 'Casablanca') {
      return {
        date: task.date,
        ville: task.city,
        typeMission: task.typeMission,
        gestionnaire: task.gestionnaire
      };
    } else {
      const firstSubMission = task.subMissions?.[0];
      const allCities = task.subMissions?.map(s => s.city).filter(Boolean) ?? [];
      const uniqueCities = [...new Set(allCities)];

      const allGestionnaires = task.subMissions?.map(s => s.gestionnaire).filter(Boolean) ?? [];
      const uniqueGestionnaires = [...new Set(allGestionnaires)];
      
      return {
        date: firstSubMission?.date,
        ville: uniqueCities.join(' / ') || 'Hors Casablanca',
        typeMission: task.label, // label is already a concatenation of types
        gestionnaire: uniqueGestionnaires.join(' / ')
      };
    }
  };
  
  const getDateFilterDisplay = () => {
      if (!timeRangeFilter || !dateFilter) return null;
      try {
          const date = parseISO(dateFilter);
          if (timeRangeFilter === 'year') return `Année: ${getYear(date)}`;
          if (timeRangeFilter === 'month') return `Mois: ${format(date, 'LLLL yyyy', { locale: fr })}`;
          if (timeRangeFilter === 'week') {
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            return `Semaine: ${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;
          }
      } catch {
          return null;
      }
      return null;
  }

  const hasFilters = cityFilter || managerFilter || typeFilter || (timeRangeFilter && dateFilter);

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
                       <CardContent className="space-y-3 p-4 pt-0">
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
                la liste complète de toutes les missions.
            </p>
         </div>
         <Button onClick={handleAddNew}>Ajouter une mission</Button>
      </div>

      {hasFilters && (
        <Card>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex justify-between items-center">
                    <span>Filtres Actifs</span>
                     <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Effacer
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex flex-wrap gap-2 text-sm">
                {cityFilter && <span className="px-2 py-1 bg-muted rounded-full">Ville: {cityFilter}</span>}
                {managerFilter && <span className="px-2 py-1 bg-muted rounded-full">Gestionnaire: {managerFilter}</span>}
                {typeFilter && <span className="px-2 py-1 bg-muted rounded-full">Type: {typeFilter}</span>}
                {getDateFilterDisplay() && <span className="px-2 py-1 bg-muted rounded-full">{getDateFilterDisplay()}</span>}
            </CardContent>
        </Card>
      )}
      
      {sortedTasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedTasks.map((task) => {
                const displayData = getTaskDisplayData(task);
                return (
                    <Card key={task.id}>
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <CardTitle className="text-base break-words">{formatDate(displayData.date, "dd-MM-yyyy")}</CardTitle>
                             <Button variant="outline" size="icon" onClick={() => handleView(task.id)} className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground p-4 pt-0">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{displayData.ville || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{displayData.typeMission || 'N/A'}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{displayData.gestionnaire || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
      ) : (
        <div className="text-center py-16">
            <h3 className="text-lg font-semibold">Aucune mission trouvée</h3>
            <p className="text-muted-foreground mt-2">
                {hasFilters ? "Aucune mission ne correspond aux filtres actuels." : "Commencez par ajouter une nouvelle mission."}
            </p>
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


export default function MissionsPage() {
    return (
        <Suspense fallback={<div>Chargement des filtres...</div>}>
            <MissionsPageComponent />
        </Suspense>
    )
}

    