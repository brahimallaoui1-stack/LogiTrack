
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
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type GroupedExpense = {
  id: string;
  displayDate?: string;
  ville?: string;
  totalAmount: number;
  taskId: string;
};


type GroupedProcessedExpense = {
  id: string; // The date 'yyyy-MM-dd'
  processedDate: string;
  totalAmount: number;
  status: ExpenseStatus;
};

export default function DepensesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { tasks, isLoading, fetchTasks } = useTaskStore();
    const { clientBalance, fetchClientBalance, addPayment, applyBalanceToExpenses } = useFacturationStore();

    const [isClient, setIsClient] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());


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
            return dateA.getTime() - dateB.getTime();
        });
    }, [tasks, filterStatus]);


    const groupedProcessedExpenses = useMemo(() => {
        const relevantStatuses: ExpenseStatus[] = ['Comptabilisé', 'Confirmé'];
        if (!relevantStatuses.includes(filterStatus as any)) return [];

        const grouped: Record<string, GroupedProcessedExpense> = {};
        
        tasks.forEach(task => {
            task.expenses?.forEach(expense => {
                if (expense.processedDate && (expense.status === 'Comptabilisé' || expense.status === 'Confirmé')) {
                    const dateKey = format(new Date(expense.processedDate), 'yyyy-MM-dd');
                    
                    if (!grouped[dateKey]) {
                        grouped[dateKey] = {
                            id: dateKey,
                            processedDate: dateKey,
                            totalAmount: 0,
                            status: expense.status // We'll assume a batch has a consistent status
                        };
                    }
                    // Aggregate based on the filter
                    if (expense.status === filterStatus) {
                        grouped[dateKey].totalAmount += expense.montant;
                    }
                }
            });
        });

        // Filter out groups with zero amount for the current filter
        const filteredGroups = Object.values(grouped).filter(g => g.totalAmount > 0);

        return filteredGroups.sort((a, b) => new Date(a.processedDate).getTime() - new Date(b.processedDate).getTime());
    }, [tasks, filterStatus]);


    const totalAmount = useMemo(() => {
        if (filterStatus === 'Confirmé') {
            return groupedProcessedExpenses.reduce((total, expense) => total + expense.totalAmount, 0);
        }
        if (filterStatus === 'Comptabilisé') {
            return groupedProcessedExpenses.reduce((total, expense) => total + expense.totalAmount, 0);
        }
        return groupedUnprocessedExpenses.reduce((total, expense) => total + expense.totalAmount, 0);
    }, [groupedUnprocessedExpenses, groupedProcessedExpenses, filterStatus]);

    const oldestExpenseDate = useMemo(() => {
      if (filterStatus === 'Sans compte') {
        if (groupedUnprocessedExpenses.length === 0) return null;
        return groupedUnprocessedExpenses.reduce((oldest, current) => {
            if (!oldest.displayDate) return current;
            if (!current.displayDate) return oldest;
            return new Date(oldest.displayDate) < new Date(current.displayDate) ? oldest : current;
        }).displayDate;
      }
      if (groupedProcessedExpenses.length === 0) return null;
      return groupedProcessedExpenses[0].processedDate;

    }, [groupedUnprocessedExpenses, groupedProcessedExpenses, filterStatus]);
    
     const handleAddPayment = async () => {
        if (typeof receivedAmount === 'number' && receivedAmount > 0 && paymentDate) {
            await addPayment(receivedAmount);
            await applyBalanceToExpenses({
                paymentDate: format(paymentDate, 'yyyy-MM-dd'),
                receivedAmount: receivedAmount
            });
            setReceivedAmount('');
            setPaymentDate(new Date());
            toast({
                title: "Paiement ajouté",
                description: `Le solde a été mis à jour et appliqué aux dépenses confirmées.`,
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
             router.push(`/depenses/view/${id}`);
        }
    };
    
    const pageTitles = {
        'Sans compte': 'Dépenses non traitées',
        'Comptabilisé': 'Dépenses en attente de confirmation',
        'Confirmé': 'Dépenses en attente de paiement',
        'Payé': 'Dépenses Payées',
    }

    const totalCardTitles = {
        'Sans compte': 'Total des dépenses non comptabilisées',
        'Comptabilisé': 'Total des dépenses à confirmer',
        'Confirmé': 'Total des dépenses en attente de paiement',
        'Payé': 'Total des dépenses Payées',
    }

    const totalCardDescriptions = {
        'Sans compte': 'Montant total des dépenses non encore traitées.',
        'Comptabilisé': 'Montant total des dépenses en attente de confirmation.',
        'Confirmé': 'Montant total des dépenses confirmées et en attente de paiement.',
        'Payé': 'Montant total des dépenses Payées.',
    }

    const dateCardTitles = {
        'Sans compte': 'Date de la première dépense non comptabilisée',
        'Comptabilisé': 'Date du lot le plus ancien à confirmer',
        'Confirmé': 'Date du lot le plus ancien à payer',
        'Payé': 'Date de la première dépense Payée',
    }

    const dateCardDescription = oldestExpenseDate
        ? `La plus ancienne dépense ${filterStatus === 'Sans compte' ? 'non traitée' : 'en attente'}.`
        : `Aucune dépense ${filterStatus === 'Sans compte' ? 'non comptabilisée' : 'en attente'}.`;
        
    const statusConfig: Record<ExpenseStatus, { color: string; text: string }> = {
        'Sans compte': { color: 'bg-gray-100 text-gray-800', text: 'Sans compte' },
        'Comptabilisé': { color: 'bg-yellow-100 text-yellow-800', text: 'À Confirmer' },
        'Confirmé': { color: 'bg-orange-100 text-orange-800', text: 'À Payer' },
        'Payé': { color: 'bg-green-100 text-green-800', text: 'Payé' },
    };


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
                    <CardTitle className="text-base">Solde AYVENS</CardTitle>
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
                   <div className="flex flex-col gap-2">
                      <Input 
                        id="receivedAmount" 
                        type="number" 
                        value={receivedAmount} 
                        onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Montant reçu"
                        className="flex-grow"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !paymentDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {paymentDate ? formatDate(paymentDate.toISOString(), "dd-MM-yyyy") : <span>Choisir une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={paymentDate}
                            onSelect={setPaymentDate}
                            initialFocus
                            />
                        </PopoverContent>
                      </Popover>
                      <Button onClick={handleAddPayment} disabled={!receivedAmount || !paymentDate} className="w-full">Ajouter</Button>
                   </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
             {filterStatus === 'Confirmé' && renderPaymentSection()}
             
             {filterStatus !== 'Confirmé' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="p-6">
                            <CardTitle>{totalCardTitles[filterStatus]}</CardTitle>
                            <CardDescription>{totalCardDescriptions[filterStatus]}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-6">
                            <CardTitle>{dateCardTitles[filterStatus]}</CardTitle>
                            <CardDescription>{dateCardDescription}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-3xl font-bold">
                                {oldestExpenseDate
                                    ? formatDate(oldestExpenseDate, "dd-MM-yyyy")
                                    : 'N/A'
                                }
                            </div>
                        </CardContent>
                    </Card>
                </div>
             )}

            <Card>
                <CardHeader className="p-6">
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
                                <SelectItem value="Comptabilisé">En attente de confirmation</SelectItem>
                                <SelectItem value="Confirmé">En attente de paiement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <Table>
                        <TableHeader>
                           {filterStatus === 'Sans compte' ? (
                                <TableRow>
                                    <TableHead className="px-2 sm:px-4">Date de mission</TableHead>
                                    <TableHead className="px-2 sm:px-4">Ville</TableHead>
                                    <TableHead className="px-2 sm:px-4">Montant</TableHead>
                                    <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
                                </TableRow>
                           ) : (
                                <TableRow>
                                    <TableHead className="px-2 sm:px-4">Date de traitement</TableHead>
                                    <TableHead className="px-2 sm:px-4">Montant Total</TableHead>
                                    <TableHead className="px-2 sm:px-4">Statut</TableHead>
                                    <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
                                </TableRow>
                           )}
                        </TableHeader>
                        <TableBody>
                             {filterStatus === 'Sans compte' ? (
                                groupedUnprocessedExpenses.map((group) => (
                                    <TableRow key={group.taskId}>
                                        <TableCell className="p-2 sm:p-4">{formatDate(group.displayDate, "dd-MM-yyyy")}</TableCell>
                                        <TableCell className="p-2 sm:p-4">{group.ville}</TableCell>
                                        <TableCell className="p-2 sm:p-4">{formatCurrency(group.totalAmount)}</TableCell>
                                        <TableCell className="text-right p-2 sm:p-4">
                                            <Button variant="outline" size="sm" onClick={() => handleView(group.taskId)}>
                                                Afficher
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                             ) : (
                                groupedProcessedExpenses.map((group) => {
                                    const statusInfo = statusConfig[group.status];
                                    return (
                                        <TableRow key={group.id}>
                                        <TableCell className="p-2 sm:p-4">{formatDate(group.processedDate, "dd-MM-yyyy")}</TableCell>
                                        <TableCell className="p-2 sm:p-4">{formatCurrency(group.totalAmount)}</TableCell>
                                        <TableCell className="p-2 sm:p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </TableCell>
                                        <TableCell className="text-right p-2 sm:p-4">
                                            <Button variant="outline" size="sm" onClick={() => handleView(group.id)}>
                                                Afficher
                                            </Button>
                                        </TableCell>
                                        </TableRow>
                                    )
                                })
                             )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    
