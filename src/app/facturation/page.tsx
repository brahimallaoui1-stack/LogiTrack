
"use client";

import { useMemo, useState, useEffect } from "react";
import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { DollarSign, Banknote, Eye, Calendar, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";

type GroupedExpense = {
  id: string; // The batchId
  processedDate: string; // The original processedDate
  totalAmount: number;
  status: 'Payé';
  paymentDate?: string;
  paymentId: string;
};

export default function FacturationPage() {
  const router = useRouter();
  const { tasks, isLoading: isLoadingTasks, fetchTasks } = useTaskStore();
  const isClient = useIsClient();

  useEffect(() => {
    if(tasks.length === 0) fetchTasks();
  }, [fetchTasks, tasks.length]);
  
  const paidExpenses = useMemo(() => {
    const groupedByPayment: Record<string, GroupedExpense> = {};

    tasks.forEach(task => {
      task.expenses?.forEach(expense => {
        if (expense.status === 'Payé' && expense.payment?.paymentId && expense.batchId && expense.processedDate) {
          const batchId = expense.batchId;
          
          if (!groupedByPayment[batchId]) {
            groupedByPayment[batchId] = { 
                id: batchId,
                processedDate: expense.processedDate,
                totalAmount: 0, 
                status: 'Payé',
                paymentDate: expense.payment.paymentDate,
                paymentId: expense.payment.paymentId,
            };
          }
          groupedByPayment[batchId].totalAmount += expense.montant;
        }
      });
    });

    return Object.values(groupedByPayment).sort((a,b) => {
        const dateA = a.paymentDate ? new Date(a.paymentDate) : new Date(0);
        const dateB = b.paymentDate ? new Date(b.paymentDate) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [tasks]);
  
 const totalPaid = useMemo(() => {
    return paidExpenses.reduce((sum, group) => sum + group.totalAmount, 0);
  }, [paidExpenses]);

  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' MAD';
  };
  
  const handleView = (batchId: string) => {
    router.push(`/depenses/view/${batchId}`);
  };

  if (!isClient || isLoadingTasks) {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2 mb-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Montant total des lots de dépenses soldés.</p>
          </CardContent>
        </Card>
        
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Historique de Facturation</h2>
        <p className="text-muted-foreground">
            Liste des lots de dépenses qui ont été entièrement payés.
        </p>
      </div>

       {paidExpenses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paidExpenses.map((group) => (
                <Card key={group.id}>
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <CardTitle className="text-base break-words">{formatDate(group.processedDate, "dd-MM-yyyy")}</CardTitle>
                        <Button variant="outline" size="icon" onClick={() => handleView(group.id)} className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground p-4 pt-0">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Payé le: {formatDate(group.paymentDate, "dd/MM/yy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Tag className="h-4 w-4" />
                             <span className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
                                {group.status}
                             </span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            <span>{formatCurrency(group.totalAmount)}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <h3 className="text-lg font-semibold">Aucune facture trouvée</h3>
            <p className="text-muted-foreground mt-2">Il n'y a aucune dépense payée à afficher pour le moment.</p>
        </div>
      )}
    </div>
  );
}
