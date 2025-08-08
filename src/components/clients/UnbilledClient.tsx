"use client";

import * as React from 'react';
import Link from 'next/link';
import { useTaskStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UnbilledClient() {
  const { tasks, isInitialized } = useTaskStore();

  const unbilledTasks = React.useMemo(() => tasks.filter(t => t.status === 'unbilled'), [tasks]);

  const totalUnbilled = React.useMemo(() => {
    return unbilledTasks.reduce((total, task) => {
      return total + task.expenses.reduce((taskTotal, expense) => taskTotal + expense.amount, 0);
    }, 0);
  }, [unbilledTasks]);

  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Tâches non facturées</h1>
            <p className="text-muted-foreground">Suivez les tâches qui n'ont pas encore été payées.</p>
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Tâches non facturées</h1>
          <p className="text-muted-foreground">Suivez les tâches qui n'ont pas encore été payées.</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une nouvelle tâche
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total des Dépenses: {totalUnbilled.toFixed(2)} €</CardTitle>
        </CardHeader>
      </Card>
      
      {unbilledTasks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unbilledTasks.map((task) => {
            const taskTotal = task.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            return (
              <Link href={`/tasks/${task.id}`} key={task.id} className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{task.city}</span>
                      <Badge variant="secondary">{new Date(task.date).toLocaleDateString('fr-FR')}</Badge>
                    </CardTitle>
                    <CardDescription>{task.taskNumber} - {task.company}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Dépenses: {taskTotal.toFixed(2)} €</p>
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">Cliquez pour voir les détails</p>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium">Aucune tâche non facturée</h3>
            <p className="text-muted-foreground mt-2">Commencez par ajouter une nouvelle tâche pour suivre vos dépenses.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
