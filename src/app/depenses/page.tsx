
"use client";

import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import type { Expense, ExpenseStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

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
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "Tous">("Tous");

    const allExpenses = useMemo(() => {
        const expensesWithDate: EnrichedExpense[] = [];
        tasks.forEach(task => {
            if (task.expenses && task.expenses.length > 0) {
                const missionDate = task.subMissions?.[0]?.date;
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
        
        const sorted = expensesWithDate.sort((a, b) => {
            const dateA = a.missionDate ? new Date(a.missionDate) : new Date(0);
            const dateB = b.missionDate ? new Date(b.missionDate) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

        if (statusFilter === "Tous") {
          return sorted;
        }
        return sorted.filter(expense => expense.status === statusFilter);

    }, [tasks, statusFilter]);

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
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Dépenses</CardTitle>
                        <CardDescription>
                            Voici la liste de toutes les dépenses enregistrées.
                        </CardDescription>
                    </div>
                    <Select value={statusFilter} onValueChange={(value: ExpenseStatus | "Tous") => setStatusFilter(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="Tous">Tous</SelectItem>
                                <SelectItem value="Sans compte">Sans compte</SelectItem>
                                <SelectItem value="Comptabilisé">Comptabilisé</SelectItem>
                                <SelectItem value="Payé">Payé</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
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
                        {allExpenses.map((expense) => (
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
    );
}
