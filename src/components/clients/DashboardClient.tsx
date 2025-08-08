"use client";

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, DollarSign, PlusCircle } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardClient() {
  const { tasks, isInitialized } = useTaskStore();

  const unbilledTasks = React.useMemo(() => tasks.filter(t => t.status === 'unbilled'), [tasks]);

  const { balance, firstNewExpenseDate } = React.useMemo(() => {
    if (!unbilledTasks.length) {
      return { balance: 0, firstNewExpenseDate: 'N/A' };
    }

    const balance = unbilledTasks.reduce((total, task) => {
      return total + task.expenses.reduce((taskTotal, expense) => taskTotal + expense.amount, 0);
    }, 0);

    const firstNewExpenseDate = unbilledTasks.reduce((earliest, task) => {
      return task.date < earliest ? task.date : earliest;
    }, unbilledTasks[0].date);

    return { balance, firstNewExpenseDate: new Date(firstNewExpenseDate).toLocaleDateString('fr-FR') };
  }, [unbilledTasks]);
  
  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Tableau de bord</h1>
            <p className="text-muted-foreground">Un résumé rapide de votre situation financière.</p>
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Tableau de bord</h1>
          <p className="text-muted-foreground">Un résumé rapide de votre situation financière.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/tasks/new">
            <PlusCircle className="mr-2" />
            Ajouter une tâche
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde non facturé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">Total des dépenses pour les tâches non facturées.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date de la 1ère dépense</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{firstNewExpenseDate}</div>
            <p className="text-xs text-muted-foreground">Depuis la dernière comptabilité.</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant des nouvelles dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance.toFixed(2)} €</div>
            <p className="text-xs text-primary-foreground/80">Total des nouvelles dépenses.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tâches non facturées</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground mb-4">Suivez les tâches qui n'ont pas encore été payées.</p>
             <Button asChild variant="outline">
                <Link href="/unbilled">
                    Voir les tâches non facturées <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Facturation</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground mb-4">Gérez les comptes que vous avez ouverts avec l'entreprise.</p>
             <Button asChild variant="outline">
                <Link href="/billed">
                    Aller à la facturation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
