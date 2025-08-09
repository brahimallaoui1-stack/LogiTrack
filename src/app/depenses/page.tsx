
"use client";

import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import type { Expense, ExpenseStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EnrichedExpense = Expense & {
    missionDate?: string;
    ville?: string;
    taskId: string;
};

export default function DepensesPage() {
    const router = useRouter();
    const { tasks } = useTaskStore((state) => ({
      tasks: state.tasks,
    }));
    
    const [filterStatus, setFilterStatus] = useState<ExpenseStatus>('Sans compte');


    const allExpenses = useMemo(() => {
        const expensesWithDate: EnrichedExpense[] = [];
        tasks.forEach(task => {
            if (task.expenses && task.expenses.length > 0) {
                const missionDate = task.city === 'Casablanca' ? task.date : task.subMissions?.[0]?.date;
                const ville = task.city === 'Casablanca' ? task.city : task.subMissions?.[0]?.city || 'Hors Casablanca';

                task.expenses.forEach(expense => {
                    expensesWithDate.push({
                      ...expense,
                      missionDate: missionDate,
                      ville: ville,
                      taskId: task.id
                    });
                });
            }
        });
        
        return expensesWithDate.sort((a, b) => {
            const dateA = a.missionDate ? new Date(a.missionDate) : new Date(0);
            const dateB = b.missionDate ? new Date(b.missionDate) : new Date(0);
            return dateA.getTime() - dateB.getTime();
        });
    }, [tasks]);

    const filteredExpenses = useMemo(() => {
        return allExpenses.filter(expense => expense.status === filterStatus);
    }, [allExpenses, filterStatus]);
    
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((total, expense) => total + expense.montant, 0);
    }, [filteredExpenses]);

    const oldestExpenseDate = useMemo(() => {
      if (filteredExpenses.length === 0) {
        return null;
      }
      return filteredExpenses[0].missionDate;
    }, [filteredExpenses]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };

    const handleView = (taskId: string) => {
        router.push(`/missions/view/${taskId}?from=depenses`);
    };

    const pageTitle = filterStatus === 'Sans compte' ? 'Dépenses non traitées' : 'Dépenses traitées';
    const totalCardTitle = filterStatus === 'Sans compte' ? 'Total des dépenses non comptabilisées' : 'Total des dépenses comptabilisées';
    const totalCardDescription = filterStatus === 'Sans compte' ? 'Montant total des dépenses non encore traitées.' : 'Montant total des dépenses déjà traitées.';
    const dateCardTitle = filterStatus === 'Sans compte' ? 'Date de la première dépense non comptabilisée' : 'Date de la première dépense comptabilisée';
    const dateCardDescription = oldestExpenseDate
        ? `La plus ancienne dépense ${filterStatus === 'Sans compte' ? 'non traitée' : 'traitée'}.`
        : `Aucune dépense ${filterStatus === 'Sans compte' ? 'non comptabilisée' : 'comptabilisée'}.`;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>{totalCardTitle}</CardTitle>
                        <CardDescription>{totalCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{dateCardTitle}</CardTitle>
                        <CardDescription>{dateCardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-3xl font-bold">
                            {oldestExpenseDate
                                ? formatDate(oldestExpenseDate)
                                : 'N/A'
                            }
                         </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                   <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{pageTitle}</CardTitle>
                            <CardDescription>
                                Voici la liste de toutes les dépenses.
                            </CardDescription>
                        </div>
                         <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ExpenseStatus)}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sans compte">Dépenses non traitées</SelectItem>
                                <SelectItem value="Comptabilisé">Dépenses traitées</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date de mission</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead>Montant</TableHead>
                                {filterStatus === 'Sans compte' && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                    <TableCell>{expense.ville}</TableCell>
                                    <TableCell>{formatCurrency(expense.montant)}</TableCell>
                                    { filterStatus === 'Sans compte' &&
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleView(expense.taskId)}>
                                                Afficher
                                            </Button>
                                        </TableCell>
                                    }
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
