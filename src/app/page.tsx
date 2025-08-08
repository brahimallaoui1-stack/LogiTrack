"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TaskDistributionChart } from "@/components/TaskDistributionChart";
import { useTaskStore } from "@/lib/store";

export default function Home() {
  const tasks = useTaskStore((state) => state.tasks);

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
      </div>
    </div>
  );
}
