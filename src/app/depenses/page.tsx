
"use client";

import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";
import type { Expense, ExpenseStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

type EnrichedExpense = Expense & { 
    missionDate?: string; 
    ville?: string;
    taskId: string;
};

export default function DepensesPage() {
    const { tasks, updateExpense } = useTaskStore((state) => ({
      tasks: state.tasks,
      updateExpense: state.updateExpense
    }));

    const allExpenses = useMemo(() => {
        const expensesWithDate: EnrichedExpense[] = [];
        tasks.forEach(task => {
            if (task.expenses && task.expenses.length > 0) {
                if (task.city === 'Casablanca') {
                     // Expenses for Casablanca missions, if any were to be added in the future
                     task.expenses.forEach(expense => {
                        expensesWithDate.push({ 
                          ...expense, 
                          missionDate: task.date, 
                          ville: task.city,
                          taskId: task.id 
                        });
                    });
                } else {
                     // For 'Hors Casablanca' missions, we need to associate the expense with the correct sub-mission city
                     // Since expenses are at the task level for HC, we'll associate it with the first sub-mission's city and date for now.
                    const firstSubMission = task.subMissions?.[0];
                    task.expenses.forEach(expense => {
                         expensesWithDate.push({ 
                            ...expense, 
                            missionDate: firstSubMission?.date, 
                            ville: firstSubMission?.city || 'Hors Casablanca',
                            taskId: task.id 
                        });
                    });
                }
            }
        });
        
        return expensesWithDate.sort((a, b) => {
            const dateA = a.missionDate ? new Date(a.missionDate) : new Date(0);
            const dateB = b.missionDate ? new Date(b.missionDate) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [tasks]);

    const nonComptabiliseesExpenses = useMemo(() => {
        return allExpenses.filter(expense => expense.status === 'Sans compte');
    }, [allExpenses]);
    
    const totalNonComptabilisees = useMemo(() => {
        return nonComptabiliseesExpenses.reduce((total, expense) => total + expense.montant, 0);
    }, [nonComptabiliseesExpenses]);

    const oldestUnaccountedExpenseDate = useMemo(() => {
      if (nonComptabiliseesExpenses.length === 0) {
        return null;
      }
      // The array is sorted from newest to oldest, so the last element is the oldest.
      return nonComptabiliseesExpenses[nonComptabiliseesExpenses.length - 1].missionDate;
    }, [nonComptabiliseesExpenses]);


    const handleStatusChange = (expense: Expense, taskId: string, newStatus: ExpenseStatus) => {
        const updatedExpense = { ...expense, status: newStatus };
        updateExpense(taskId, updatedExpense);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };
    
    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Dépenses non comptabilisées</CardTitle>
                        <CardDescription>Montant total des dépenses non encore traitées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(totalNonComptabilisees)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Date de la première dépense non comptabilisée</CardTitle>
                        <CardDescription>
                          {oldestUnaccountedExpenseDate 
                            ? `La plus ancienne dépense non traitée.`
                            : 'Aucune dépense non comptabilisée.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-3xl font-bold">
                            {oldestUnaccountedExpenseDate 
                                ? formatDate(oldestUnaccountedExpenseDate)
                                : 'N/A'
                            }
                         </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des dépenses non comptabilisées</CardTitle>
                    <CardDescription>
                        Voici la liste de toutes les dépenses qui n'ont pas encore été comptabilisées.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date de mission</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {nonComptabiliseesExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                    <TableCell>{expense.ville}</TableCell>
                                    <TableCell>{formatCurrency(expense.montant)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Ouvrir le menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleStatusChange(expense, expense.taskId, 'Sans compte')}>
                                                    Sans compte
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(expense, expense.taskId, 'Comptabilisé')}>
                                                    Comptabilisé
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(expense, expense.taskId, 'Payé')}>
                                                    Payé
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
