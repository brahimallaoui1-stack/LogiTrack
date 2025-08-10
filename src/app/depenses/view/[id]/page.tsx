
"use client";

import { useTaskStore, useFacturationStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { Expense } from "@/lib/types";
import { parse, isValid, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


type EnrichedExpense = Expense & {
    missionDate?: string;
    ville?: string;
};

export default function ViewProcessedExpensesPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params; 
    const { toast } = useToast();

    const { tasks, fetchTasks, confirmExpenseBatch } = useTaskStore();
    const [localExpenses, setLocalExpenses] = useState<EnrichedExpense[]>([]);
    const [isConfirming, setIsConfirming] = useState(false);
    
    useEffect(() => {
        if (tasks.length === 0) {
            fetchTasks();
        }
    }, [tasks.length, fetchTasks]);

    const isDateId = useMemo(() => {
      const date = parse(id as string, 'yyyy-MM-dd', new Date());
      return isValid(date);
    }, [id])

    const { processedExpenses, expenseStatus } = useMemo(() => {
      if (!isDateId) return { processedExpenses: [], expenseStatus: null };

      let status: Expense['status'] | null = null;
      const allExpenses: EnrichedExpense[] = [];
      
      tasks.forEach(task => {
        task.expenses
            ?.filter(exp => {
                 const isMatch = (exp.status === 'Comptabilisé' || exp.status === 'Confirmé' || exp.status === 'Payé') &&
                                exp.processedDate && 
                                format(new Date(exp.processedDate), 'yyyy-MM-dd') === id;
                if(isMatch) {
                    if (!status || exp.status === 'Payé' || exp.status === 'Confirmé') {
                       status = exp.status;
                    }
                }
                return isMatch;
            })
            .forEach(expense => {
                const missionDate = task.date || (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].date : undefined);
                const ville = task.city === 'Casablanca' ? task.city : (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].city : 'Hors Casablanca');
                allExpenses.push({
                    ...expense,
                    missionDate: missionDate,
                    ville: ville,
                });
            });
      });
      return { processedExpenses: allExpenses, expenseStatus: status };

    }, [tasks, id, isDateId]);

    useEffect(() => {
        if (processedExpenses.length > 0) {
            setLocalExpenses(processedExpenses);
        }
    }, [processedExpenses]);

    const handleLocalExpenseChange = (expenseId: string, field: keyof Expense, value: string | number) => {
        setLocalExpenses(prev => 
            prev.map(exp => 
                exp.id === expenseId ? { ...exp, [field]: value } : exp
            )
        );
    };

    const handleConfirmBatch = async () => {
        const batchDate = id as string;
        await confirmExpenseBatch(batchDate, localExpenses);
        toast({
            title: "Lot confirmé",
            description: "Les dépenses ont été confirmées et sont prêtes pour le paiement."
        });
        router.push('/depenses');
    };


     const totalAmount = useMemo(() => {
        return processedExpenses.reduce((total, expense) => total + (expense.approvedAmount ?? expense.montant), 0);
    }, [processedExpenses]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };
    
    const isPaid = expenseStatus === 'Payé';
    const isConfirmed = expenseStatus === 'Confirmé';
    const isReadyForConfirmation = expenseStatus === 'Comptabilisé';


    if (tasks.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <Card>
                    <CardHeader>
                         <Skeleton className="h-8 w-48 mb-2" />
                         <Skeleton className="h-4 w-80" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-10 w-48" />
                    </CardContent>
                 </Card>
            </div>
        )
    }

    if (!isDateId || processedExpenses.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Aucune dépense trouvée</CardTitle>
                        <CardDescription>Aucune dépense traitée n'a été trouvée pour ce lot.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => router.push('/depenses')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux dépenses
                        </Button>
                    </CardContent>
                 </Card>
            </div>
        )
    }
    
    const pageTitle = `Détail des dépenses du ${formatDate(id as string)}`;
    const pageDescription = isPaid
      ? 'Voici le récapitulatif des dépenses pour ce lot qui a été soldé.'
      : isConfirmed
      ? 'Voici le détail des dépenses pour ce lot confirmé et en attente de paiement.'
      : 'Veuillez vérifier et confirmer les montants ci-dessous.';

    const statusConfig: Record<Expense['status'], { color: string; text: string }> = {
        'Sans compte': { color: 'bg-gray-100 text-gray-800', text: 'Sans compte' },
        'Comptabilisé': { color: 'bg-yellow-100 text-yellow-800', text: 'À Confirmer' },
        'Confirmé': { color: 'bg-orange-100 text-orange-800', text: 'À Payer' },
        'Payé': { color: 'bg-green-100 text-green-800', text: 'Payé' },
    };


    return (
        <>
        <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                 {isReadyForConfirmation && (
                    <Button onClick={() => setIsConfirming(true)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmer le lot
                    </Button>
                 )}
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{pageTitle}</CardTitle>
                            <CardDescription>{pageDescription}</CardDescription>
                        </div>
                        {expenseStatus && (
                             <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${statusConfig[expenseStatus].color}`}>
                                {statusConfig[expenseStatus].text}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date Mission</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead className="text-right">Montant Initial</TableHead>
                                <TableHead className="text-right w-[150px]">Montant Approuvé</TableHead>
                                <TableHead className="text-right w-[150px]">Avance</TableHead>
                                <TableHead className="text-right w-[150px]">Frais Comptable</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {localExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                    <TableCell>{expense.ville}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(expense.montant)}</TableCell>
                                    <TableCell className="text-right">
                                        <Input 
                                            type="number"
                                            className="text-right"
                                            placeholder="Vide"
                                            value={expense.approvedAmount ?? ''}
                                            onChange={(e) => handleLocalExpenseChange(expense.id, 'approvedAmount', parseFloat(e.target.value) || 0)}
                                            readOnly={!isReadyForConfirmation}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input 
                                            type="number"
                                            className="text-right"
                                            placeholder="Vide"
                                            value={expense.advance ?? ''}
                                            onChange={(e) => handleLocalExpenseChange(expense.id, 'advance', parseFloat(e.target.value) || 0)}
                                            readOnly={!isReadyForConfirmation}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input 
                                            type="number"
                                            className="text-right"
                                            placeholder="Vide"
                                            value={expense.accountantFees ?? ''}
                                            onChange={(e) => handleLocalExpenseChange(expense.id, 'accountantFees', parseFloat(e.target.value) || 0)}
                                            readOnly={!isReadyForConfirmation}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     <div className="text-right font-bold pr-4 mt-4 text-lg">
                        Total Approuvé: {formatCurrency(totalAmount)}
                    </div>
                </CardContent>
            </Card>
        </div>
        <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirmer les montants?</AlertDialogTitle>
                <AlertDialogDescription>
                    Cette action mettra à jour les dépenses avec les montants que vous avez saisis et marquera le lot comme "Confirmé". Vous ne pourrez plus modifier ces montants.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmBatch}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

    