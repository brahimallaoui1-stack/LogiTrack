
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { MonthPicker } from "@/components/MonthPicker";
import { TaskDistributionChart } from "@/components/TaskDistributionChart";
import { useTaskStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { format, getYear, getMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MissionFormDialog } from "@/components/MissionFormDialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

type ReportCategory = 'city' | 'gestionnaire' | 'typeMission';

export default function Home() {
  const tasks = useTaskStore((state) => state.tasks);
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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

    return tasks.filter(task => {
      if (task.city === 'Casablanca') {
        if (!task.date) return false;
        try {
          const taskDate = parseISO(task.date);
          const taskYear = getYear(taskDate);
          const taskMonth = getMonth(taskDate);

          if (timeRange === 'year') {
            return taskYear === selectedYear;
          }
          return taskYear === selectedYear && taskMonth === selectedMonth;
        } catch (e) {
          return false;
        }
      } else {
         if (!task.subMissions || task.subMissions.length === 0) return false;
         // Pour les missions complexes, inclure la mission si au moins une sous-mission correspond au filtre
         return task.subMissions.some(sub => {
            if (!sub.date) return false;
             try {
                const subDate = parseISO(sub.date);
                const subYear = getYear(subDate);
                const subMonth = getMonth(subDate);

                if (timeRange === 'year') {
                    return subYear === selectedYear;
                }
                return subYear === selectedYear && subMonth === selectedMonth;
            } catch (e) {
                return false;
            }
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
                key = task.city === 'Hors Casablanca' ? 'Hors Casablanca' : task.city;
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

  const renderReport = (category: ReportCategory, title: string, description: string, data: {name: string, count: number}[], chartLabel: string, tableHead: string) => (
     <TabsContent value={category} className="mt-0">
        <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <TaskDistributionChart tasks={flatTasks} category={category} label={chartLabel} />
                </CardContent>
                </Card>
                <Card>
                <CardHeader>
                    <CardTitle>Classement des {tableHead}</CardTitle>
                    <CardDescription>Nombre de missions par {tableHead.toLowerCase()}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>{tableHead}</TableHead>
                        <TableHead className="text-right">Missions</TableHead>
                        <TableHead className="text-right">Pourcentage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(({ name, count }) => {
                          const percentage = totalMissions > 0 ? ((count / totalMissions) * 100).toFixed(1) : 0;
                          return (
                            <TableRow key={name}>
                                <TableCell className="font-medium">{name}</TableCell>
                                <TableCell className="text-right">{count}</TableCell>
                                <TableCell className="text-right">{percentage}%</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                    </Table>
                </CardContent>
                </Card>
            </div>
        </div>
     </TabsContent>
  );

  return (
    <>
    <div className="grid gap-6">
       <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy', { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <MonthPicker
                  date={selectedDate}
                  onChange={(newDate) => {
                    setSelectedDate(newDate);
                    setIsPickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[90px] md:w-[180px]">
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <Button size="icon" onClick={() => setIsCityChoiceDialogOpen(true)}>
            <Plus />
            <span className="sr-only">Ajouter une mission</span>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportCategory)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="city">Villes</TabsTrigger>
            <TabsTrigger value="gestionnaire">Gestionnaires</TabsTrigger>
            <TabsTrigger value="typeMission">Missions</TabsTrigger>
        </TabsList>
         {renderReport('city', 'Rapport de missions par ville', 'Pourcentage de missions par ville.', cityTaskCounts, 'Villes', 'Ville')}
         {renderReport('gestionnaire', 'Rapport de missions par gestionnaire', 'Pourcentage de missions par gestionnaire.', managerTaskCounts, 'Gestionnaires', 'Gestionnaire')}
         {renderReport('typeMission', 'Rapport par type de mission', 'Pourcentage de missions par type de mission.', missionTypeTaskCounts, 'Missions', 'Types de Mission')}
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
