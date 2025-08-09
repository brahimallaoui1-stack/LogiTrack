
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
    
    const totalNonComptabilisees = useMemo(() => {
        return allExpenses
            .filter(expense => expense.status === 'Sans compte')
            .reduce((total, expense) => total + expense.montant, 0);
    }, [allExpenses]);

    const oldestUnaccountedExpenseDate = useMemo(() => {
      const nonComptabiliseesExpenses = allExpenses.filter(expense => expense.status === 'Sans compte');
      if (nonComptabiliseesExpenses.length === 0) {
        return null;
      }
      return nonComptabiliseesExpenses[0].missionDate;
    }, [allExpenses]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };

    const handleView = (taskId: string) => {
        router.push(`/missions/view/${taskId}`);
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
                   <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Liste des dépenses</CardTitle>
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
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                    <TableCell>{expense.ville}</TableCell>
                                    <TableCell>{formatCurrency(expense.montant)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleView(expense.taskId)}>
                                            Afficher
                                        </Button>
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
