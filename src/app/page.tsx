"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskDistributionChart } from "@/components/TaskDistributionChart";
import { useTaskStore } from "@/lib/store";
import { useMemo } from "react";

export default function Home() {
  const tasks = useTaskStore((state) => state.tasks);

  const cityTaskCounts = useMemo(() => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.city] = (acc[task.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Tâches</CardTitle>
            <CardDescription>Pourcentage de tâches par ville.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskDistributionChart tasks={tasks} />
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
