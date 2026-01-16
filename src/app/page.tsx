"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { useTaskStore } from "@/lib/store";
import { useMemo, useState, useEffect } from "react";
import type { Task } from "@/lib/types";
import { getYear, getMonth, parseISO, format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MissionFormDialog } from "@/components/MissionFormDialog";
import { MonthPicker } from "@/components/MonthPicker";
import { YearPicker } from "@/components/YearPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsClient } from "@/hooks/useIsClient";
import { useRouter } from "next/navigation";
import { WeekPicker } from "@/components/WeekPicker";
import { cn } from "@/lib/utils";
import { CircularCounter } from "@/components/CircularCounter";
import { Progress } from "@/components/ui/progress";

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

  const filteredTasks = useMemo(() => {
    if (!selectedDate) {
      return tasks;
    }

    const selectedYear = getYear(selectedDate);
    const selectedMonth = getMonth(selectedDate);
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1, locale: fr });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1, locale: fr });

    return tasks.filter(task => {
        const checkDate = (dateStr?: string | null) => {
            if (!dateStr) return false;
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

        // Since all new tasks have subMissions, we primarily check their dates.
        if (task.subMissions && task.subMissions.length > 0) {
            return task.subMissions.some(sub => checkDate(sub.date));
        }

        // Fallback for old data structure that might only have a root date.
        return checkDate(task.date);
    });
  }, [tasks, timeRange, selectedDate]);
  
  const reportData = useMemo(() => {
    const allFlatTasks: (Partial<Task> & { subMissionIndex?: number, status?: 'Terminée' | 'Annulée' })[] = [];
    filteredTasks.forEach(task => {
        if (task.subMissions && task.subMissions.length > 0) {
            task.subMissions.forEach((subMission, index) => {
                allFlatTasks.push({
                    ...task,
                    city: subMission.city || task.city,
                    gestionnaire: subMission.gestionnaire || task.gestionnaire,
                    typeMission: subMission.typeMission || task.typeMission,
                    status: subMission.status || 'Terminée',
                    subMissionIndex: index
                });
            });
        } else {
            allFlatTasks.push({ ...task, status: 'Terminée' });
        }
    });

    const completedFlatTasks = allFlatTasks.filter(task => task.status === 'Terminée');

    const getBreakdown = (category: ReportCategory) => {
        const categoryTotals: Record<string, { completed: number; total: number }> = {};

        allFlatTasks.forEach(task => {
            const key = task[category] as string | undefined;
            
            if (key) {
                if (!categoryTotals[key]) {
                    categoryTotals[key] = { completed: 0, total: 0 };
                }
                categoryTotals[key].total++;
                if (task.status === 'Terminée') {
                    categoryTotals[key].completed++;
                }
            }
        });

        return Object.entries(categoryTotals)
            .map(([name, counts]) => ({ name, ...counts }))
            .sort((a, b) => b.completed - a.completed);
    };

    const cityTaskBreakdown = getBreakdown('city');
    const managerTaskBreakdown = getBreakdown('gestionnaire');
    const missionTypeTaskBreakdown = getBreakdown('typeMission');
    
    return {
        totalMissions: allFlatTasks.length,
        completedMissions: completedFlatTasks.length,
        cityTaskBreakdown,
        managerTaskBreakdown,
        missionTypeTaskBreakdown,
    };
  }, [filteredTasks]);

  const { totalMissions, completedMissions, cityTaskBreakdown, managerTaskBreakdown, missionTypeTaskBreakdown } = reportData;
  
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


  const renderReport = (category: ReportCategory, title: string, data: {name: string, completed: number, total: number}[], chartLabel: string, tableHead: string) => (
     <TabsContent value={category} className="mt-0">
        <div className="grid md:grid-cols-2 gap-6">
            {isLoading ? (
                <>
                    <Card><CardContent className="p-6"><Skeleton className="h-[152px] w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-8 w-3/4 mb-2"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
                </>
            ) : (
                <>
                    <Card>
                        <CardContent className="flex justify-center items-center gap-8 p-6">
                            <CircularCounter value={completedMissions} label="Missions terminées" color="hsl(var(--chart-13))" />
                            <CircularCounter value={totalMissions} label="Missions totales" color="hsl(var(--chart-10))" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>{`Nombre par ${tableHead.toLowerCase()}`}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             {data.length > 0 ? data.map(({ name, completed, total }) => {
                                const percentage = total > 0 ? (completed / total) * 100 : 0;
                                return (
                                    <div key={name} className="p-3 rounded-md border hover:bg-muted cursor-pointer" onClick={() => handleReportItemClick(category, name)}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium truncate">{name}</span>
                                            <span className="font-bold text-right text-sm">{`${completed}/${total}`}</span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
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
        <Button onClick={() => setIsMissionDialogOpen(true)} className="w-full sm:w-auto">
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
         {renderReport('city', 'Rapport', cityTaskBreakdown, 'Villes', 'Ville')}
         {renderReport('gestionnaire', 'Rapport', managerTaskBreakdown, 'Gestionnaires', 'Gestionnaire')}
         {renderReport('typeMission', 'Rapport', missionTypeTaskBreakdown, 'Missions', 'Type de Mission')}
      </Tabs>
    </div>
    <MissionFormDialog
        isOpen={isMissionDialogOpen}
        onOpenChange={setIsMissionDialogOpen}
    />
    </>
  );
}
