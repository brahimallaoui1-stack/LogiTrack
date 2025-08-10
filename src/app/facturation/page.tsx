
"use client";

import { useMemo, useState, useEffect } from "react";
import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { DollarSign, Banknote, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense } from "@/lib/types";
import { useRouter } from "next/navigation";

type GroupedExpense = {
  id: string; // The date 'yyyy-MM-dd'
  totalAmount: number;
  status: 'Payé';
  paymentDate?: string;
};

export default function FacturationPage() {
  const router = useRouter();
  const { tasks, isLoading: isLoadingTasks, fetchTasks } = useTaskStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if(tasks.length === 0) fetchTasks();
  }, [fetchTasks, tasks.length]);
  
  const paidExpenses = useMemo(() => {
    const grouped: Record<string, GroupedExpense> = {};

    tasks.forEach(task => {
      task.expenses?.forEach(expense => {
        if (expense.status === 'Payé' && expense.processedDate) {
          const dateKey = format(new Date(expense.processedDate), 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = { 
                id: dateKey, 
                totalAmount: 0, 
                status: 'Payé',
            };
          }
          grouped[dateKey].totalAmount += expense.montant;
          if (expense.payment?.paymentDate) {
             grouped[dateKey].paymentDate = expense.payment.paymentDate;
          }
        }
      });
    });

    return Object.values(grouped).sort((a,b) => new Date(b.id).getTime() - new Date(a.id).getTime());
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
  
  const handleView = (id: string) => {
    router.push(`/depenses/view/${id}`);
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

      <Card>
        <CardHeader>
          <CardTitle>Historique de Facturation</CardTitle>
          <CardDescription>Liste des lots de dépenses qui ont été entièrement payés.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date du lot</TableHead>
                <TableHead>Date de paiement</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paidExpenses.map((group) => {
                return (
                  <TableRow key={group.id}>
                    <TableCell className="hidden md:table-cell">{formatDate(group.id)}</TableCell>
                    <TableCell className="md:hidden">{formatDate(group.id, "dd/MM")}</TableCell>
                    <TableCell>{formatDate(group.paymentDate)}</TableCell>
                    <TableCell>{formatCurrency(group.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full bg-green-100 text-green-800`}>
                        {group.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => handleView(group.id)} className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    
