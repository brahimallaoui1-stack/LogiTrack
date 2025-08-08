"use client";

import * as React from 'react';
import { useTaskStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Task } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function BilledTaskRow({ task }: { task: Task }) {
  const { updateBilledTaskDetails } = useTaskStore();

  const [approvedAmount, setApprovedAmount] = React.useState(task.approvedAmount ?? '');
  const [advance, setAdvance] = React.useState(task.advance ?? '');
  const [commission, setCommission] = React.useState(task.commission ?? '');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      updateBilledTaskDetails(task.id, {
        approvedAmount: Number(approvedAmount) || 0,
        advance: Number(advance) || 0,
        commission: Number(commission) || 0,
      });
    }, 500);

    return () => clearTimeout(handler);
  }, [approvedAmount, advance, commission, task.id, updateBilledTaskDetails]);
  
  const totalExpenses = task.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const difference = (Number(approvedAmount) || 0) - totalExpenses;

  return (
    <TableRow>
      <TableCell>{new Date(task.date).toLocaleDateString('fr-FR')}</TableCell>
      <TableCell>{task.city}</TableCell>
      <TableCell className="font-medium">{task.taskNumber}</TableCell>
      <TableCell className="text-right">{totalExpenses.toFixed(2)} €</TableCell>
      <TableCell>
        <Input
          type="number"
          value={approvedAmount}
          onChange={(e) => setApprovedAmount(e.target.value)}
          className="h-8 w-24"
          placeholder="0.00"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={advance}
          onChange={(e) => setAdvance(e.target.value)}
          className="h-8 w-24"
          placeholder="Tasbiq"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          className="h-8 w-24"
          placeholder="L3omola"
        />
      </TableCell>
      <TableCell className={`text-right font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {difference.toFixed(2)} €
      </TableCell>
    </TableRow>
  );
}

export default function BilledClient() {
  const { tasks, isInitialized } = useTaskStore();

  const billedTasks = React.useMemo(() => tasks.filter(t => t.status === 'billed'), [tasks]);
  
  const totalExpenses = billedTasks.reduce((total, task) => {
    return total + task.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, 0);

  if (!isInitialized) {
    return (
       <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Facturation</h1>
          <p className="text-muted-foreground">Gérez les comptes que vous avez ouverts avec l'entreprise.</p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Facturation</h1>
        <p className="text-muted-foreground">Gérez les comptes que vous avez ouverts avec l'entreprise.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Total des dépenses facturées: {totalExpenses.toFixed(2)} €</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>N° Tâche</TableHead>
                <TableHead className="text-right">Dépenses</TableHead>
                <TableHead>Montant Approuvé</TableHead>
                <TableHead>Avance (Tasbiq)</TableHead>
                <TableHead>Commission (L3omola)</TableHead>
                <TableHead className="text-right">Différence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billedTasks.length > 0 ? (
                 billedTasks.map(task => <BilledTaskRow key={task.id} task={task} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">Aucune tâche facturée</TableCell>
                </TableRow>
              )}
            </TableBody>
             <TableFooter>
                <TableRow>
                    <TableCell colSpan={7} className="font-bold">Total des dépenses facturées</TableCell>
                    <TableCell className="text-right font-bold">{totalExpenses.toFixed(2)} €</TableCell>
                </TableRow>
             </TableFooter>
          </Table>
           <p className="text-xs text-muted-foreground mt-2">La différence est calculée comme suit : Montant Approuvé - Dépenses.</p>
        </CardContent>
      </Card>
    </div>
  );
}
