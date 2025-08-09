
"use client";

import { useTaskStore, useAppStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState, useEffect } from "react";
import type { Expense, ExpenseStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

type GroupedExpense = {
  id: string;
  displayDate?: string;
  ville?: string;
  totalAmount: number;
  taskId: string;
};


type GroupedProcessedExpense = {
  id: string;
  processedDate: string;
  totalAmount: number;
};

export default function DepensesPage() {
    const router = useRouter();
    const tasks = useTaskStore((state) => state.tasks);
    const isHydrated = useAppStore((state) => state.isHydrated);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const [filterStatus, setFilterStatus] = useState<ExpenseStatus>('Sans compte');

    const groupedUnprocessedExpenses = useMemo(() => {
        if (filterStatus !== 'Sans compte') return [];
    
        const groupedByTask: Record<string, GroupedExpense> = {};
    
        tasks.forEach(task => {
            const unprocessedExpenses = task.expenses?.filter(exp => exp.status === 'Sans compte');
    
            if (unprocessedExpenses && unprocessedExpenses.length > 0) {
                if (!groupedByTask[task.id]) {
                    const totalAmount = unprocessedExpenses.reduce((sum, exp) => sum + exp.montant, 0);
                    
                    const displayDate = task.city === 'Casablanca' ? task.date : task.subMissions?.[0]?.date;
                    let ville = task.city;
                    if(ville !== 'Casablanca') {
                        const allCities = task.subMissions?.map(s => s.city).filter(Boolean) ?? [];
                        const uniqueCities = [...new Set(allCities)];
                        ville = uniqueCities.join(' / ') || 'Hors Casablanca';
                    }

                    groupedByTask[task.id] = {
                        id: task.id,
                        displayDate,
                        ville,
                        totalAmount,
                        taskId: task.id
                    };
                }
            }
        });
    
        return Object.values(groupedByTask).sort((a, b) => {
            const dateA = a.displayDate ? new Date(a.displayDate) : new Date(0);
            const dateB = b.displayDate ? new Date(b.displayDate) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [tasks, filterStatus]);


    const groupedProcessedExpenses = useMemo(() => {
        if (filterStatus !== 'Comptabilisé') return [];

        const expensesWithDate: (Expense & { taskId: string })[] = [];
        tasks.forEach(task => {
            task.expenses?.forEach(expense => {
                if (expense.status === 'Comptabilisé' && expense.processedDate) {
                    expensesWithDate.push({ ...expense, taskId: task.id });
                }
            });
        });
        
        const groupedByDate: Record<string, { totalAmount: number, taskIds: string[] }> = {};

        expensesWithDate.forEach(expense => {
            if (expense.processedDate) {
                const dateKey = format(new Date(expense.processedDate), 'yyyy-MM-dd');
                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = { totalAmount: 0, taskIds: [] };
                }
                groupedByDate[dateKey].totalAmount += expense.montant;
                if (!groupedByDate[dateKey].taskIds.includes(expense.taskId)) {
                    groupedByDate[dateKey].taskIds.push(expense.taskId);
                }
            }
        });

        return Object.entries(groupedByDate).map(([date, group]) => ({
            id: date,
            processedDate: date,
            totalAmount: group.totalAmount
        })).sort((a, b) => new Date(b.processedDate).getTime() - new Date(a.processedDate).getTime());
    }, [tasks, filterStatus]);


    const totalAmount = useMemo(() => {
        if (filterStatus === 'Comptabilisé') {
          return groupedProcessedExpenses.reduce((total, expense) => total + expense.totalAmount, 0);
        }
        return groupedUnprocessedExpenses.reduce((total, expense) => total + expense.totalAmount, 0);
    }, [groupedUnprocessedExpenses, groupedProcessedExpenses, filterStatus]);

    const oldestExpenseDate = useMemo(() => {
      if (filterStatus === 'Sans compte') {
        if (groupedUnprocessedExpenses.length === 0) return null;
        // find the oldest date
        return groupedUnprocessedExpenses.reduce((oldest, current) => {
            if (!oldest.displayDate) return current;
            if (!current.displayDate) return oldest;
            return new Date(oldest.displayDate) < new Date(current.displayDate) ? oldest : current;
        }).displayDate;
      }
      if (groupedProcessedExpenses.length === 0) return null;
      return groupedProcessedExpenses[groupedProcessedExpenses.length - 1].processedDate;

    }, [groupedUnprocessedExpenses, groupedProcessedExpenses, filterStatus]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };

    const handleView = (id: string) => {
        if (filterStatus === 'Sans compte') {
            router.push(`/missions/view/${id}?from=depenses`);
        } else {
             router.push(`/depenses/view/${id}`);
        }
    };
    
    const pageTitles = {
        'Sans compte': 'Dépenses non traitées',
        'Comptabilisé': 'Dépenses traitées',
        'Confirmé': 'Dépenses confirmées',
        'Payé': 'Dépenses Payées',
    }

    const totalCardTitles = {
        'Sans compte': 'Total des dépenses non comptabilisées',
        'Comptabilisé': 'Total des dépenses comptabilisées',
        'Confirmé': 'Total des dépenses confirmées',
        'Payé': 'Total des dépenses Payées',
    }

    const totalCardDescriptions = {
        'Sans compte': 'Montant total des dépenses non encore traitées.',
        'Comptabilisé': 'Montant total des dépenses déjà traitées.',
        'Confirmé': 'Montant total des dépenses confirmées.',
        'Payé': 'Montant total des dépenses Payées.',
    }

    const dateCardTitles = {
        'Sans compte': 'Date de la première dépense non comptabilisée',
        'Comptabilisé': 'Date de la première dépense comptabilisée',
        'Confirmé': 'Date de la première dépense confirmée',
        'Payé': 'Date de la première dépense Payée',
    }

    const dateCardDescription = oldestExpenseDate
        ? `La plus ancienne dépense ${filterStatus === 'Sans compte' ? 'non traitée' : filterStatus === 'Comptabilisé' ? 'traitée' : 'confirmée'}.`
        : `Aucune dépense ${filterStatus === 'Sans compte' ? 'non comptabilisée' : filterStatus === 'Comptabilisé' ? 'comptabilisée' : 'confirmée'}.`;

    if (!isHydrated || !isClient) {
      return <div>Chargement...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>{totalCardTitles[filterStatus]}</CardTitle>
                        <CardDescription>{totalCardDescriptions[filterStatus]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{dateCardTitles[filterStatus]}</CardTitle>
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
                            <CardTitle>{pageTitles[filterStatus]}</CardTitle>
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
                           {filterStatus === 'Sans compte' ? (
                                <TableRow>
                                    <TableHead>Date de mission</TableHead>
                                    <TableHead>Ville</TableHead>
                                    <TableHead>Montant</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                           ) : (
                                <TableRow>
                                    <TableHead>Date de traitement</TableHead>
                                    <TableHead>Montant Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                           )}
                        </TableHeader>
                        <TableBody>
                             {filterStatus === 'Sans compte' ? (
                                groupedUnprocessedExpenses.map((group) => (
                                    <TableRow key={group.taskId}>
                                        <TableCell>{formatDate(group.displayDate)}</TableCell>
                                        <TableCell>{group.ville}</TableCell>
                                        <TableCell>{formatCurrency(group.totalAmount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleView(group.taskId)}>
                                                Afficher
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                             ) : (
                                groupedProcessedExpenses.map((group) => (
                                    <TableRow key={group.id}>
                                      <TableCell>{formatDate(group.processedDate)}</TableCell>
                                      <TableCell>{formatCurrency(group.totalAmount)}</TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleView(group.id)}>
                                            Afficher
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                ))
                             )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
