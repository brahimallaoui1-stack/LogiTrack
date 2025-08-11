
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
import { CalendarIcon, CheckSquare, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/hooks/useIsClient";


type GroupedExpense = {
  id: string;
  displayDate?: string;
  ville?: string;
  totalAmount: number;
};


type GroupedProcessedExpense = {
  id: string; // The batchId
  processedDate: string;
  totalAmount: number;
  status: ExpenseStatus;
};

export default function DepensesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { tasks, isLoading, fetchTasks } = useTaskStore();
    const { clientBalance, fetchClientBalance, addPayment, applyBalanceToExpenses } = useFacturationStore();

    const isClient = useIsClient();
    const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());


    useEffect(() => {
        fetchTasks();
        fetchClientBalance();
    }, [fetchTasks, fetchClientBalance]);
    
    const [filterStatus, setFilterStatus] = useState<ExpenseStatus>('Sans compte');

    const groupedUnprocessedExpenses = useMemo(() => {
        if (filterStatus !== 'Sans compte') return [];
    
        const grouped: GroupedExpense[] = [];
    
        tasks.forEach(task => {
            const unprocessedExpenses = task.expenses?.filter(exp => exp.status === 'Sans compte');
    
            if (unprocessedExpenses && unprocessedExpenses.length > 0) {
                const totalAmount = unprocessedExpenses.reduce((sum, exp) => sum + exp.montant, 0);
                
                const displayDate = task.date || (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].date : undefined);
                let ville = task.city;
                if(ville !== 'Casablanca') {
                    const allCities = task.subMissions?.map(s => s.city).filter(Boolean) ?? [];
                    const uniqueCities = [...new Set(allCities)];
                    ville = uniqueCities.join(' / ') || 'Hors Casablanca';
                }

                grouped.push({
                    id: task.id,
                    displayDate,
                    ville,
                    totalAmount
                });
            }
        });
    
        return grouped.sort((a, b) => {
            const dateA = a.displayDate ? new Date(a.displayDate) : new Date(0);
            const dateB = b.displayDate ? new Date(b.displayDate) : new Date(0);
            return dateA.getTime() - dateB.getTime();
        });
    }, [tasks, filterStatus]);


    const groupedProcessedExpenses = useMemo(() => {
        const relevantStatuses: ExpenseStatus[] = ['Comptabilisé', 'Confirmé'];
        if (!relevantStatuses.includes(filterStatus as any)) return [];

        const grouped: Record<string, GroupedProcessedExpense & { approvedAmount?: number, advance?: number, accountantFees?: number }> = {};
        
        tasks.forEach(task => {
            task.expenses?.forEach(expense => {
                if (expense.status === filterStatus && expense.batchId) {
                    const batchId = expense.batchId;
                    
                    if (!grouped[batchId]) {
                        grouped[batchId] = {
                            id: batchId,
                            processedDate: expense.processedDate || new Date().toISOString(),
                            totalAmount: 0,
                            status: expense.status,
                        };
                    }
                    
                    if (filterStatus === 'Comptabilisé') {
                        grouped[batchId].totalAmount += expense.montant;
                    } else if (filterStatus === 'Confirmé') {
                         if (grouped[batchId].approvedAmount === undefined) {
                            grouped[batchId].approvedAmount = expense.approvedAmount;
                            grouped[batchId].advance = expense.advance;
                            grouped[batchId].accountantFees = expense.accountantFees;
                         }
                    }
                }
            });
        });
        
        const finalGroups = Object.values(grouped).map(group => {
            if (filterStatus === 'Confirmé') {
                const approved = group.approvedAmount ?? 0;
                const advance = group.advance ?? 0;
                const fees = group.accountantFees ?? 0;
                group.totalAmount = approved - advance - fees;
            }
            return group;
        });

        const filteredGroups = finalGroups.filter(g => filterStatus === 'Comptabilisé' ? g.totalAmount > 0 : g.approvedAmount !== undefined);

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
        'Confirmé': 'Total Net à payer',
        'Payé': 'Total des dépenses Payées',
    }

    const totalCardDescriptions = {
        'Sans compte': 'Montant total des dépenses non encore traitées.',
        'Comptabilisé': 'Montant total des dépenses en attente de confirmation.',
        'Confirmé': 'Montant total net à payer pour les lots confirmés.',
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
        'Sans compte': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', text: 'Sans compte' },
        'Comptabilisé': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'À Confirmer' },
        'Confirmé': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', text: 'À Payer' },
        'Payé': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Payé' },
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Total Net à Payer</CardTitle>
                    <CardDescription>Montant total des lots confirmés.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Solde AYVENS</CardTitle>
                    <CardDescription>Solde client actuel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(clientBalance)}</div>
                </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle className="text-base">Ajouter un paiement reçu</CardTitle>
                     <CardDescription>Mettre à jour le solde client.</CardDescription>
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
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>{totalCardTitles[filterStatus]}</CardTitle>
                            <CardDescription>{totalCardDescriptions[filterStatus]}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(totalAmount)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>{dateCardTitles[filterStatus]}</CardTitle>
                            <CardDescription>{dateCardDescription}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <div className="text-2xl sm:text-3xl font-bold">
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
                <CardHeader className="p-4 sm:p-6">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle>{pageTitles[filterStatus]}</CardTitle>
                            <CardDescription>
                                {filterStatus === 'Sans compte' ? 'Sélectionnez les missions à regrouper et à traiter.' : 'Voici la liste de toutes les dépenses.'}
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                           {filterStatus === 'Sans compte' ? (
                                <TableRow>
                                    <TableHead className="px-2 sm:px-4">Date</TableHead>
                                    <TableHead className="px-2 sm:px-4">Ville</TableHead>
                                    <TableHead className="px-2 sm:px-4">Montant</TableHead>
                                    <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
                                </TableRow>
                           ) : (
                                <TableRow>
                                    <TableHead className="px-2 sm:px-4">Date</TableHead>
                                    <TableHead className="px-2 sm:px-4">{filterStatus === 'Confirmé' ? 'Net à Payer' : 'Montant'}</TableHead>
                                    <TableHead className="px-2 sm:px-4">Statut</TableHead>
                                    <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
                                </TableRow>
                           )}
                        </TableHeader>
                        <TableBody>
                             {filterStatus === 'Sans compte' ? (
                                groupedUnprocessedExpenses.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatDate(group.displayDate, "dd-MM-yy")}</TableCell>
                                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{group.ville}</TableCell>
                                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatCurrency(group.totalAmount)}</TableCell>
                                        <TableCell className="text-right px-2 sm:px-4">
                                            <Button variant="outline" size="icon" onClick={() => handleView(group.id)} className="h-8 w-8">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                             ) : (
                                groupedProcessedExpenses.map((group) => {
                                    const statusInfo = statusConfig[group.status];
                                    return (
                                        <TableRow key={group.id}>
                                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatDate(group.processedDate, "dd-MM-yy")}</TableCell>
                                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatCurrency(group.totalAmount)}</TableCell>
                                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </TableCell>
                                        <TableCell className="text-right px-2 sm:px-4">
                                            <Button variant="outline" size="icon" onClick={() => handleView(group.id)} className="h-8 w-8">
                                                <Eye className="h-4 w-4" />
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
