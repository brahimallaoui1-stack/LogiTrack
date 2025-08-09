
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
import { ExpenseDistributionChart } from "@/components/ExpenseDistributionChart";

type EnrichedExpense = Expense & { 
    missionDate?: string; 
    missionLabel?: string;
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
                const missionDate = task.city === 'Casablanca' ? task.date : task.subMissions?.[0]?.date;
                task.expenses.forEach(expense => {
                    expensesWithDate.push({ 
                      ...expense, 
                      missionDate, 
                      missionLabel: task.label, 
                      taskId: task.id 
                    });
                });
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

    const chartExpenses = useMemo(() => {
        return allExpenses.filter(expense => expense.status === 'Sans compte' || expense.status === 'Comptabilisé');
    }, [allExpenses]);


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
    
    const expenseStatusCounts = useMemo(() => {
        const counts = chartExpenses.reduce((acc, expense) => {
            acc[expense.status] = (acc[expense.status] || 0) + 1;
            return acc;
        }, {} as Record<ExpenseStatus, number>);
        return [
            { name: 'Sans compte', count: counts['Sans compte'] || 0 },
            { name: 'Comptabilisé', count: counts['Comptabilisé'] || 0 },
        ];
    }, [chartExpenses]);


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
                        <CardTitle>Dépenses non comptabilisées</CardTitle>
                        <CardDescription>Répartition des dépenses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ExpenseDistributionChart expenses={chartExpenses} category="status" label="Statut" />
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
                                <TableHead>Mission</TableHead>
                                <TableHead>Type de dépense</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Remarque</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {nonComptabiliseesExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                    <TableCell>{expense.missionLabel}</TableCell>
                                    <TableCell>{expense.typeDepense}</TableCell>
                                    <TableCell>{formatCurrency(expense.montant)}</TableCell>
                                    <TableCell>{expense.status}</TableCell>
                                    <TableCell>{expense.remarque || 'N/A'}</TableCell>
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
