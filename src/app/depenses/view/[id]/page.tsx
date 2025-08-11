
"use client";

import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { Expense } from "@/lib/types";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";


type GroupedMissionExpense = {
    missionId: string;
    missionDate?: string;
    ville?: string;
    totalAmount: number;
};


export default function ViewProcessedExpensesPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params; 
    const { toast } = useToast();

    const { tasks, fetchTasks, confirmExpenseBatch } = useTaskStore();
    const [isConfirming, setIsConfirming] = useState(false);
    
    // Batch-level accounting info
    const [approvedAmount, setApprovedAmount] = useState<number | ''>('');
    const [advance, setAdvance] = useState<number | ''>('');
    const [accountantFees, setAccountantFees] = useState<number | ''>('');
    
    useEffect(() => {
        if (tasks.length === 0) {
            fetchTasks();
        }
    }, [tasks.length, fetchTasks]);

    const batchId = id as string;

    const { groupedMissionExpenses, expenseStatus, initialTotal, processedDate } = useMemo(() => {
        if (!batchId) return { groupedMissionExpenses: [], expenseStatus: null, initialTotal: 0, processedDate: null };
    
        let status: Expense['status'] | null = null;
        let total = 0;
        let pDate: string | undefined = undefined;
        const missionsInBatch: Record<string, GroupedMissionExpense> = {};

        tasks.forEach(task => {
            const expensesInBatch = task.expenses?.filter(exp => {
                const isMatch = exp.batchId === batchId;
                if (isMatch) {
                   if (!pDate) pDate = exp.processedDate;
                   status = exp.status;
                }
                return isMatch;
            });

            if (expensesInBatch && expensesInBatch.length > 0) {
                if (!missionsInBatch[task.id]) {
                    const missionDate = task.date || (task.subMissions && task.subMissions.length > 0 ? task.subMissions[0].date : undefined);
                    let ville = task.city;
                    if(ville !== 'Casablanca') {
                        const allCities = task.subMissions?.map(s => s.city).filter(Boolean) ?? [];
                        const uniqueCities = [...new Set(allCities)];
                        ville = uniqueCities.join(' / ') || 'Hors Casablanca';
                    }
                    missionsInBatch[task.id] = {
                        missionId: task.id,
                        missionDate: missionDate,
                        ville: ville,
                        totalAmount: 0,
                    };
                }
                const missionTotal = expensesInBatch.reduce((sum, exp) => sum + exp.montant, 0);
                missionsInBatch[task.id].totalAmount += missionTotal;
                total += missionTotal;
            }
        });

        const allExpenses = tasks.flatMap(t => t.expenses || []);
        const firstExpenseOfBatch = allExpenses.find(exp => exp.batchId === batchId);
        if (firstExpenseOfBatch) {
            status = firstExpenseOfBatch.status;
            setApprovedAmount(firstExpenseOfBatch.approvedAmount ?? '');
            setAdvance(firstExpenseOfBatch.advance ?? '');
            setAccountantFees(firstExpenseOfBatch.accountantFees ?? '');
        }
        
        return { 
            groupedMissionExpenses: Object.values(missionsInBatch), 
            expenseStatus: status, 
            initialTotal: total,
            processedDate: pDate
        };

    }, [tasks, batchId]);


    const handleConfirmBatch = async () => {
        if (approvedAmount === '' || advance === '' || accountantFees === '') {
            toast({
                variant: 'destructive',
                title: "Champs requis",
                description: "Veuillez remplir tous les champs comptables."
            });
            return;
        }

        await confirmExpenseBatch(batchId, {
            approvedAmount: Number(approvedAmount),
            advance: Number(advance),
            accountantFees: Number(accountantFees)
        });
        toast({
            title: "Lot confirmé",
            description: "Les dépenses ont été confirmées et sont prêtes pour le paiement."
        });
        router.push('/depenses');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };
    
    const isPaid = expenseStatus === 'Payé';
    const isConfirmed = expenseStatus === 'Confirmé';
    const isReadyForConfirmation = expenseStatus === 'Comptabilisé';

    const netAmount = useMemo(() => {
        const approved = typeof approvedAmount === 'number' ? approvedAmount : 0;
        const adv = typeof advance === 'number' ? advance : 0;
        const fees = typeof accountantFees === 'number' ? accountantFees : 0;
        return approved - adv - fees;
    }, [approvedAmount, advance, accountantFees]);


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

    if (!batchId || groupedMissionExpenses.length === 0) {
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
    
    const pageTitle = `Détail des dépenses du ${formatDate(processedDate, "dd-MM-yyyy")}`;
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
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date Mission</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedMissionExpenses.map((mission) => (
                                <TableRow key={mission.missionId}>
                                    <TableCell>{formatDate(mission.missionDate, "dd-MM-yyyy")}</TableCell>
                                    <TableCell>{mission.ville}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(mission.totalAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     <div className="text-right font-bold pr-4 mt-4 text-lg">
                        Total Initial: {formatCurrency(initialTotal)}
                    </div>
                </CardContent>

                <Separator className="my-4"/>

                <CardFooter className="flex-col items-end gap-4">
                     <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full max-w-md self-end">
                         <Label htmlFor="approvedAmount">Montant Approuvé</Label>
                         <Input
                            id="approvedAmount"
                            type="number"
                            className="text-right"
                            placeholder="Vide"
                            value={approvedAmount}
                            onChange={(e) => setApprovedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            readOnly={!isReadyForConfirmation}
                         />

                         <Label htmlFor="advance">Avance (Tasbiq)</Label>
                         <Input
                            id="advance"
                            type="number"
                            className="text-right"
                            placeholder="Vide"
                            value={advance}
                            onChange={(e) => setAdvance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            readOnly={!isReadyForConfirmation}
                         />

                         <Label htmlFor="accountantFees">Frais Comptable (L3omola)</Label>
                         <Input
                            id="accountantFees"
                            type="number"
                            className="text-right"
                            placeholder="Vide"
                            value={accountantFees}
                            onChange={(e) => setAccountantFees(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            readOnly={!isReadyForConfirmation}
                         />
                     </div>
                     <Separator className="my-2 w-full max-w-md self-end"/>
                     <div className="flex justify-between items-center w-full max-w-md self-end">
                        <div className="text-right font-bold text-xl w-full pr-2">
                           Net à Payer: {formatCurrency(netAmount)}
                        </div>
                         {expenseStatus && (
                             <span className={`px-3 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap ${statusConfig[expenseStatus].color}`}>
                                {statusConfig[expenseStatus].text}
                            </span>
                        )}
                     </div>
                </CardFooter>
            </Card>
        </div>
        <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirmer les montants?</AlertDialogTitle>
                <AlertDialogDescription>
                    Cette action mettra à jour le lot avec les montants que vous avez saisis et le marquera comme "Confirmé". Vous ne pourrez plus modifier ces montants.
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
