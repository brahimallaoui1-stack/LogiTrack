
"use client";

import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { Expense } from "@/lib/types";
import { parse, isValid, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type EnrichedExpense = Expense & {
    missionDate?: string;
    ville?: string;
};

export default function ViewProcessedExpensesPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params; 

    const { tasks, fetchTasks } = useTaskStore();

    useEffect(() => {
        if (tasks.length === 0) {
            fetchTasks();
        }
    }, [tasks, fetchTasks]);

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
                 const isMatch = (exp.status === 'Comptabilisé' || exp.status === 'Payé') &&
                                exp.processedDate && 
                                format(new Date(exp.processedDate), 'yyyy-MM-dd') === id;
                if(isMatch) {
                    if (!status || exp.status === 'Payé') {
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

     const totalAmount = useMemo(() => {
        return processedExpenses.reduce((total, expense) => total + expense.montant, 0);
    }, [processedExpenses]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };
    
    const isPaid = expenseStatus === 'Payé';

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
                        <CardDescription>Aucune dépense traitée n'a été trouvée pour cette date.</CardDescription>
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
      : 'Voici le détail des dépenses pour ce lot en attente de paiement.';


    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{pageTitle}</CardTitle>
                            <CardDescription>{pageDescription}</CardDescription>
                        </div>
                        {expenseStatus && (
                             <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {expenseStatus}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date de mission</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{formatDate(expense.missionDate)}</TableCell>
                                    <TableCell>{expense.ville}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(expense.montant)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     <div className="text-right font-bold pr-4 mt-4 text-lg">
                        Total des dépenses: {formatCurrency(totalAmount)}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
