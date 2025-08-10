
"use client";

import { useTaskStore, useFacturationStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState, useEffect } from "react";
import type { Expense, ExpenseStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
  taskId: string;
};

export default function DepensesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { tasks, isLoading, fetchTasks } = useTaskStore();
    const { clientBalance, fetchClientBalance, addPayment, applyBalanceToExpenses } = useFacturationStore();

    const [isClient, setIsClient] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<number | ''>('');

    useEffect(() => {
        setIsClient(true);
        fetchTasks();
        fetchClientBalance();
    }, [fetchTasks, fetchClientBalance]);
    
    const [filterStatus, setFilterStatus] = useState<ExpenseStatus>('Sans compte');

    const groupedUnprocessedExpenses = useMemo(() => {
        if (filterStatus !== 'Sans compte') return [];
    
        const groupedByTask: Record<string, GroupedExpense> = {};
    
        tasks.forEach(task => {
            const unprocessedExpenses = task.expenses?.filter(exp => exp.status === 'Sans compte');
    
            if (unprocessedExpenses && unprocessedExpenses.length > 0) {
                if (!groupedByTask[task.id]) {
                    const totalAmount = unprocessedExpenses.reduce((sum, exp) => sum + exp.montant, 0);
                    
                    const displayDate = task.date || (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].date : undefined);
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

        const processedTasks: GroupedProcessedExpense[] = [];
        
        tasks.forEach(task => {
            const processedExpenses = task.expenses?.filter(exp => exp.status === 'Comptabilisé');
            if (processedExpenses && processedExpenses.length > 0) {
                const totalAmount = processedExpenses.reduce((sum, exp) => sum + exp.montant, 0);
                const processedDate = processedExpenses[0].processedDate; // Assuming all expenses in a task are processed at the same time
                
                if (processedDate) {
                     processedTasks.push({
                        id: task.id,
                        processedDate: processedDate,
                        totalAmount: totalAmount,
                        taskId: task.id
                    });
                }
            }
        });

        return processedTasks.sort((a, b) => new Date(a.processedDate).getTime() - new Date(b.processedDate).getTime()); // oldest first
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
      return groupedProcessedExpenses[0].processedDate; // Now sorted oldest first

    }, [groupedUnprocessedExpenses, groupedProcessedExpenses, filterStatus]);
    
     const handleAddPayment = async () => {
        if (typeof receivedAmount === 'number' && receivedAmount > 0) {
            await addPayment(receivedAmount);
            await applyBalanceToExpenses();
            setReceivedAmount('');
            toast({
                title: "Paiement ajouté",
                description: `Le solde a été mis à jour et appliqué aux dépenses en attente.`,
            });
        }
    };


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
             // For processed expenses, we now view the mission they belong to
             router.push(`/missions/view/${id}?from=depenses`);
        }
    };
    
    const pageTitles = {
        'Sans compte': 'Dépenses non traitées',
        'Comptabilisé': 'Dépenses en attente de paiement',
        'Payé': 'Dépenses Payées',
        'Confirmé': 'Dépenses Confirmées'
    }

    const totalCardTitles = {
        'Sans compte': 'Total des dépenses non comptabilisées',
        'Comptabilisé': 'Total des dépenses en attente',
        'Payé': 'Total des dépenses Payées',
        'Confirmé': 'Total des dépenses Confirmées'
    }

    const totalCardDescriptions = {
        'Sans compte': 'Montant total des dépenses non encore traitées.',
        'Comptabilisé': 'Montant total des dépenses en attente de paiement.',
        'Payé': 'Montant total des dépenses Payées.',
        'Confirmé': 'Montant total des dépenses Confirmées'
    }

    const dateCardTitles = {
        'Sans compte': 'Date de la première dépense non comptabilisée',
        'Comptabilisé': 'Date du lot le plus ancien',
        'Payé': 'Date de la première dépense Payée',
        'Confirmé': 'Date de la première dépense Confirmée'
    }

    const dateCardDescription = oldestExpenseDate
        ? `La plus ancienne dépense ${filterStatus === 'Sans compte' ? 'non traitée' : 'traitée'}.`
        : `Aucune dépense ${filterStatus === 'Sans compte' ? 'non comptabilisée' : 'comptabilisée'}.`;

    if (!isClient || isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/3" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/3" />
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-10 w-48" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const renderPaymentSection = () => (
        <div className="grid gap-6 md:grid-cols-3 mb-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Total en attente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Solde client</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(clientBalance)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Ajouter un paiement reçu</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="flex flex-col sm:flex-row items-center gap-2">
                      <Input 
                        id="receivedAmount" 
                        type="number" 
                        value={receivedAmount} 
                        onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Montant reçu"
                        className="flex-grow"
                      />
                      <Button onClick={handleAddPayment} disabled={!receivedAmount} className="w-full sm:w-auto">Ajouter</Button>
                   </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
             {filterStatus === 'Comptabilisé' && renderPaymentSection()}
             
             {filterStatus !== 'Comptabilisé' && (
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
             )}

            <Card>
                <CardHeader>
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle>{pageTitles[filterStatus]}</CardTitle>
                            <CardDescription>
                                Voici la liste de toutes les dépenses.
                            </CardDescription>
                        </div>
                         <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ExpenseStatus)}>
                            <SelectTrigger className="w-full md:w-[220px]">
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sans compte">Dépenses non traitées</SelectItem>
                                <SelectItem value="Comptabilisé">Dépenses en attente</SelectItem>
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
                                        <Button variant="outline" size="sm" onClick={() => handleView(group.taskId)}>
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
