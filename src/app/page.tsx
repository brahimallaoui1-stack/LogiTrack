
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { MonthPicker } from "@/components/MonthPicker";
import { TaskDistributionChart } from "@/components/TaskDistributionChart";
import { useTaskStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Home() {
  const tasks = useTaskStore((state) => state.tasks);
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    // La logique de filtrage sera implémentée ici ultérieurement
    // Pour l'instant, nous utilisons toutes les tâches.
    return tasks;
  }, [tasks, timeRange, selectedDate]);

  const cityTaskCounts = useMemo(() => {
    const counts = filteredTasks.reduce((acc, task) => {
      acc[task.city] = (acc[task.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTasks]);

  return (
    <div className="grid gap-6">
       <div className="flex justify-start items-center">
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
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rapport de missions par ville</CardTitle>
            <CardDescription>Pourcentage de missions par ville.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskDistributionChart tasks={filteredTasks} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Classement des Villes</CardTitle>
            <CardDescription>Nombre de missions par ville.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-right">Missions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cityTaskCounts.map(({ city, count }) => (
                  <TableRow key={city}>
                    <TableCell className="font-medium">{city}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-4">
        <Button variant="outline">Villes</Button>
        <Button variant="outline">Responsables</Button>
      </div>
    </div>
  );
}
