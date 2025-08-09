
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MissionFormDialog } from "@/components/MissionFormDialog";

type ReportCategory = 'city' | 'gestionnaire' | 'typeTache';

export default function Home() {
  const tasks = useTaskStore((state) => state.tasks);
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportCategory>("city");

  const filteredTasks = useMemo(() => {
    // La logique de filtrage sera implémentée ici ultérieurement
    // Pour l'instant, nous utilisons toutes les tâches.
    return tasks;
  }, [tasks, timeRange, selectedDate]);

  const getTaskCounts = (category: ReportCategory) => {
    const counts = filteredTasks.reduce((acc, task) => {
      const key = task[category];
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const cityTaskCounts = useMemo(() => getTaskCounts('city'), [filteredTasks]);
  const managerTaskCounts = useMemo(() => getTaskCounts('gestionnaire'), [filteredTasks]);
  const missionTypeTaskCounts = useMemo(() => getTaskCounts('typeTache'), [filteredTasks]);

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
                    <TaskDistributionChart tasks={filteredTasks} category={category} label={chartLabel} />
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
                          const percentage = filteredTasks.length > 0 ? ((count / filteredTasks.length) * 100).toFixed(1) : 0;
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
        <Button size="icon" onClick={() => setIsMissionDialogOpen(true)}>
            <Plus />
            <span className="sr-only">Ajouter une mission</span>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportCategory)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="city">Villes</TabsTrigger>
            <TabsTrigger value="gestionnaire">Gestionnaires</TabsTrigger>
            <TabsTrigger value="typeTache">Missions</TabsTrigger>
        </TabsList>
         {renderReport('city', 'Rapport de missions par ville', 'Pourcentage de missions par ville.', cityTaskCounts, 'Villes', 'Ville')}
         {renderReport('gestionnaire', 'Rapport de missions par gestionnaire', 'Pourcentage de missions par gestionnaire.', managerTaskCounts, 'Gestionnaires', 'Gestionnaire')}
         {renderReport('typeTache', 'Rapport de missions par type', 'Pourcentage de missions par type.', missionTypeTaskCounts, 'Missions', 'Type de Mission')}
      </Tabs>
    </div>
    <MissionFormDialog
        isOpen={isMissionDialogOpen}
        onOpenChange={setIsMissionDialogOpen}
    />
    </>
  );
}
