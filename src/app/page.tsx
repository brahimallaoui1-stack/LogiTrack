"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDistributionChart } from "@/components/TaskDistributionChart";
import { useTaskStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";

export default function Home() {
  const tasks = useTaskStore((state) => state.tasks);
  const [timeRange, setTimeRange] = useState("month");

  const filteredTasks = useMemo(() => {
    // La logique de filtrage sera implémentée ici ultérieurement
    // Pour l'instant, nous utilisons toutes les tâches.
    return tasks;
  }, [tasks, timeRange]);

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
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tableau de Bord</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner une période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mois</SelectItem>
            <SelectItem value="year">Année</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Tâches</CardTitle>
            <CardDescription>Pourcentage de tâches par ville.</CardDescription>
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
    </div>
  );
}
