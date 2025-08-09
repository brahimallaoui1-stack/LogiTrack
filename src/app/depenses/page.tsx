
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

type GroupedExpense = {
    missionDate: string;
    ville: string;
    montant: number;
    taskIds: string[];
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
                if (task.city === 'Casablanca') {
                     task.expenses.forEach(expense => {
                        expensesWithDate.push({ 
                          ...expense, 
                          missionDate: task.date, 
                          ville: task.city,
                          taskId: task.id 
                        });
                    });
                } else {
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
            return dateA.getTime() - dateB.getTime();
        });
    }, [tasks]);

    const filteredExpenses = useMemo(() => {
        return allExpenses.filter(expense => expense.status === filterStatus);
    }, [allExpenses, filterStatus]);

    const groupedAndFilteredExpenses = useMemo(() => {
        if (filterStatus === 'Sans compte') {
            return filteredExpenses;
        }

        const grouped = filteredExpenses.reduce((acc, expense) => {
            const date = expense.missionDate || 'unknown';
            if (!acc[date]) {
                acc[date] = {
                    missionDate: expense.missionDate!,
                    ville: 'Multiple', // Or logic to determine city
                    montant: 0,
                    taskIds: [],
                };
            }
            acc[date].montant += expense.montant;
            if (!acc[date].taskIds.includes(expense.taskId)) {
                acc[date].taskIds.push(expense.taskId);
            }
            return acc;
        }, {} as Record<string, GroupedExpense>);

        return Object.values(grouped).sort((a, b) => {
            const dateA = new Date(a.missionDate);
            const dateB = new Date(b.missionDate);
            return dateA.getTime() - dateB.getTime();
        });

    }, [filteredExpenses, filterStatus]);
    
    const totalAmount = useMemo(() => {
        const source = filterStatus === 'Sans compte' ? filteredExpenses : groupedAndFilteredExpenses;
        return source.reduce((total, expense) => total + expense.montant, 0);
    }, [filteredExpenses, groupedAndFilteredExpenses, filterStatus]);

    const oldestExpenseDate = useMemo(() => {
      const source = filterStatus === 'Sans compte' ? filteredExpenses : groupedAndFilteredExpenses;
      if (source.length === 0) {
        return null;
      }
      return source[0].missionDate;
    }, [filteredExpenses, groupedAndFilteredExpenses, filterStatus]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };

    const handleView = (taskId: string) => {
        const query = filterStatus === 'Sans compte' ? '?from=depenses' : '';
        router.push(`/missions/view/${taskId}${query}`);
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedAndFilteredExpenses.map((expense, index) => (
                                <TableRow key={expense.missionDate || index}>
                                    <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                    <TableCell>{'ville' in expense ? (expense as EnrichedExpense | GroupedExpense).ville : ''}</TableCell>
                                    <TableCell>{formatCurrency(expense.montant)}</TableCell>
                                    <TableCell className="text-right">
                                       { filterStatus === 'Sans compte' && 'taskId' in expense &&
                                            <Button variant="outline" size="sm" onClick={() => handleView((expense as EnrichedExpense).taskId)}>
                                                Afficher
                                            </Button>
                                        }
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
