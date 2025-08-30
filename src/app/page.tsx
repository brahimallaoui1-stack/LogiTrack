
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { TaskDistributionChart } from "@/components/TaskDistributionChart";
import { useTaskStore } from "@/lib/store";
import { useMemo, useState, useEffect } from "react";
import type { Task } from "@/lib/types";
import { getYear, getMonth, parseISO, format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MissionFormDialog } from "@/components/MissionFormDialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { MonthPicker } from "@/components/MonthPicker";
import { YearPicker } from "@/components/YearPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsClient } from "@/hooks/useIsClient";
import { useRouter } from "next/navigation";
import { WeekPicker } from "@/components/WeekPicker";
import { cn } from "@/lib/utils";

type ReportCategory = 'city' | 'gestionnaire' | 'typeMission';

export default function Home() {
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const isClient = useIsClient();
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const [timeRange, setTimeRange] = useState("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportCategory>("city");
  const [isCityChoiceDialogOpen, setIsCityChoiceDialogOpen] = useState(false);
  const [prefilledCity, setPrefilledCity] = useState<string | undefined>(undefined);

  const filteredTasks = useMemo(() => {
    if (!selectedDate) {
      return tasks;
    }

    const selectedYear = getYear(selectedDate);
    const selectedMonth = getMonth(selectedDate);
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1, locale: fr });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1, locale: fr });

    return tasks.filter(task => {
      const checkDate = (dateStr: string) => {
        try {
          const taskDate = parseISO(dateStr);
          
          if (timeRange === 'year') {
            return getYear(taskDate) === selectedYear;
          }
          if (timeRange === 'month') {
            return getYear(taskDate) === selectedYear && getMonth(taskDate) === selectedMonth;
          }
          if (timeRange === 'week') {
            return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
          }
          return false;
        } catch (e) {
          return false;
        }
      };
      
      const primaryDate = task.date || (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].date : undefined);
      if (!primaryDate) return false;

      if (task.city === 'Casablanca') {
        if (!task.date) return false;
        return checkDate(task.date);
      } else {
         if (!task.subMissions || task.subMissions.length === 0) return false;
         return task.subMissions.some(sub => {
            if (!sub.date) return false;
            return checkDate(sub.date);
         });
      }
    });
  }, [tasks, timeRange, selectedDate]);
  
  const reportData = useMemo(() => {
    const flatTasks: (Task & { subMissionIndex?: number })[] = [];
    filteredTasks.forEach(task => {
        if (task.city === 'Casablanca') {
            flatTasks.push(task);
        } else if (task.subMissions) {
            task.subMissions.forEach((subMission, index) => {
                flatTasks.push({
                    ...task,
                    city: subMission.city || task.city,
                    gestionnaire: subMission.gestionnaire || task.gestionnaire,
                    typeMission: subMission.typeMission || task.typeMission,
                    subMissionIndex: index
                });
            });
        }
    });

    const getCounts = (category: ReportCategory) => {
        const counts = flatTasks.reduce((acc, task) => {
            let key: string | undefined;

            if (category === 'city') {
                key = task.city;
            } else {
                key = task[category];
            }

            if (key) {
                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    };

    const cityTaskCounts = getCounts('city');
    const managerTaskCounts = getCounts('gestionnaire');
    const missionTypeTaskCounts = getCounts('typeMission');
    
    return {
        totalMissions: flatTasks.length,
        cityTaskCounts,
        managerTaskCounts,
        missionTypeTaskCounts,
        flatTasks,
    };
  }, [filteredTasks]);

  const { totalMissions, cityTaskCounts, managerTaskCounts, missionTypeTaskCounts, flatTasks } = reportData;

  const handleCityChoice = (city?: string) => {
    setPrefilledCity(city);
    setIsCityChoiceDialogOpen(false);
    setIsMissionDialogOpen(true);
  }
  
  const handleReportItemClick = (category: ReportCategory, value: string) => {
    const params = new URLSearchParams();
    params.set(category, value);
    if (selectedDate) {
      params.set('timeRange', timeRange);
      params.set('date', selectedDate.toISOString());
    }
    router.push(`/missions?${params.toString()}`);
  }

  const getDateFilterDisplay = () => {
    if (!selectedDate) return "Choisir une date";
    if (timeRange === 'year') return getYear(selectedDate);
    if (timeRange === 'month') return format(selectedDate, 'LLLL yyyy', { locale: fr });
    if (timeRange === 'week') {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
    }
    return format(selectedDate, 'PPP', { locale: fr });
  };


  const renderReport = (category: ReportCategory, title: string, data: {name: string, count: number}[], chartLabel: string, tableHead: string) => (
     <TabsContent value={category} className="mt-0">
        <div className="grid md:grid-cols-2 gap-6">
            {isLoading ? (
                <>
                    <Card><CardHeader><Skeleton className="h-8 w-3/4 mb-2"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-8 w-3/4 mb-2"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
                </>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Rapport par {tableHead.toLowerCase()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TaskDistributionChart tasks={flatTasks} category={category} label={chartLabel} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Nombre par {tableHead.toLowerCase()}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             {data.length > 0 ? data.map(({ name, count }) => {
                                const percentage = totalMissions > 0 ? ((count / totalMissions) * 100).toFixed(1) : 0;
                                return (
                                    <div key={name} className="grid grid-cols-3 items-center p-2 rounded-md border hover:bg-muted cursor-pointer" onClick={() => handleReportItemClick(category, name)}>
                                        <span className="font-medium truncate">{name}</span>
                                        <span className="font-bold text-center">{count}</span>
                                        <span className="text-xs text-muted-foreground text-right">{percentage}%</span>
                                    </div>
                                );
                            }) : (
                                <p className="text-muted-foreground text-center py-4">Aucune mission à afficher pour cette période.</p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
     </TabsContent>
  );

  if (!isClient) {
    return (
        <div className="grid gap-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
                <Skeleton className="h-10 w-full sm:w-[190px]" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid md:grid-cols-2 gap-6">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        </div>
    );
  }

  return (
    <>
    <div className="grid gap-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                 <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[260px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {getDateFilterDisplay()}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {timeRange === 'year' && <YearPicker date={selectedDate} onChange={setSelectedDate} />}
                {timeRange === 'month' && <MonthPicker date={selectedDate} onChange={setSelectedDate} />}
                {timeRange === 'week' && <WeekPicker date={selectedDate} onChange={setSelectedDate} />}
              </PopoverContent>
            </Popover>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <Button onClick={() => setIsCityChoiceDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une mission
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportCategory)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="city">Villes</TabsTrigger>
            <TabsTrigger value="gestionnaire">Gestionnaires</TabsTrigger>
            <TabsTrigger value="typeMission">Missions</TabsTrigger>
        </TabsList>
         {renderReport('city', 'Nombre de missions par ville', cityTaskCounts, 'Villes', 'Ville')}
         {renderReport('gestionnaire', 'Nombre de missions par gestionnaire', managerTaskCounts, 'Gestionnaires', 'Gestionnaire')}
         {renderReport('typeMission', 'Nombre de missions par type', missionTypeTaskCounts, 'Missions', 'Type de Mission')}
      </Tabs>
    </div>
    <MissionFormDialog
        isOpen={isMissionDialogOpen}
        onOpenChange={setIsMissionDialogOpen}
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
