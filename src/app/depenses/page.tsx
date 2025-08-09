
"use client";

import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";
import type { Expense } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DepensesPage() {
    const tasks = useTaskStore((state) => state.tasks);

    const allExpenses = useMemo(() => {
        const expensesWithDate: (Expense & { missionDate?: string, missionLabel?: string })[] = [];
        tasks.forEach(task => {
            if (task.expenses && task.expenses.length > 0) {
                const missionDate = task.subMissions?.[0]?.date;
                task.expenses.forEach(expense => {
                    expensesWithDate.push({ ...expense, missionDate, missionLabel: task.label });
                });
            }
        });
        return expensesWithDate.sort((a, b) => {
            const dateA = a.missionDate ? new Date(a.missionDate) : new Date(0);
            const dateB = b.missionDate ? new Date(b.missionDate) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [tasks]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dépenses</CardTitle>
                <CardDescription>
                    Voici la liste de toutes les dépenses enregistrées.
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
                            <TableHead>Remarque</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allExpenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                <TableCell>{expense.missionLabel}</TableCell>
                                <TableCell>{expense.typeDepense}</TableCell>
                                <TableCell>{formatCurrency(expense.montant)}</TableCell>
                                <TableCell>{expense.remarque || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
