
"use client";

import { useMemo, useState, useEffect } from "react";
import { useTaskStore, useFacturationStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { DollarSign, Banknote, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense } from "@/lib/types";
import { useRouter } from "next/navigation";

type GroupedExpense = {
  id: string; // The date 'yyyy-MM-dd'
  totalAmount: number;
  status: 'Confirmé' | 'Payé';
  payment?: Expense['payment'];
};

export default function FacturationPage() {
  const router = useRouter();
  const { tasks, isLoading: isLoadingTasks, fetchTasks } = useTaskStore();
  const { updatePaymentInfo, markAsPaid } = useFacturationStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if(tasks.length === 0) fetchTasks();
  }, [fetchTasks, tasks.length]);
  
  const [receivedAmounts, setReceivedAmounts] = useState<Record<string, number | "">>({});

  const confirmedAndPaidExpenses = useMemo(() => {
    const grouped: Record<string, GroupedExpense> = {};

    tasks.forEach(task => {
      task.expenses?.forEach(expense => {
        if ((expense.status === 'Confirmé' || expense.status === 'Payé') && expense.processedDate) {
          const dateKey = format(new Date(expense.processedDate), 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = { id: dateKey, totalAmount: 0, status: 'Confirmé', payment: {} };
          }
          grouped[dateKey].totalAmount += expense.montant;
          // The whole group status is determined by the most "advanced" status
          if (expense.status === 'Payé') {
            grouped[dateKey].status = 'Payé';
          }
          if (expense.payment) {
             grouped[dateKey].payment = {...grouped[dateKey].payment, ...expense.payment};
          }
        }
      });
    });

    return Object.values(grouped).sort((a,b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  }, [tasks]);
  
 const totals = useMemo(() => {
    let totalDue = 0;
    let totalPaidOff = 0;

    confirmedAndPaidExpenses.forEach(e => {
        const received = e.payment?.receivedAmount ?? 0;
        if (e.status === 'Payé') {
            totalPaidOff += e.totalAmount;
        } else { // 'Confirmé'
            totalDue += e.totalAmount - received;
        }
        totalPaidOff += received;
    });

    return {
        totalDue: totalDue,
        totalReceived: totalPaidOff,
    }
  }, [confirmedAndPaidExpenses]);

  const handleAmountChange = (id: string, value: string) => {
    setReceivedAmounts(prev => ({ ...prev, [id]: value === '' ? '' : parseFloat(value) }));
  };

  const handleSaveReceivedAmount = async (group: GroupedExpense) => {
    const amount = receivedAmounts[group.id];
    if (typeof amount === 'number' && amount > 0) {
      const currentReceived = group.payment?.receivedAmount ?? 0;
      const newReceivedAmount = currentReceived + amount;
      
      await updatePaymentInfo(group.id, { receivedAmount: newReceivedAmount });
      
      if (newReceivedAmount >= group.totalAmount) {
        await markAsPaid(group.id);
      }
      setReceivedAmounts(prev => ({ ...prev, [group.id]: '' }));
    }
  };
  
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Dû</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalDue)}</div>
            <p className="text-xs text-muted-foreground">Montant total en attente de paiement.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reçu</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalReceived)}</div>
            <p className="text-xs text-muted-foreground">Montant total déjà perçu.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturation</CardTitle>
          <CardDescription>Suivi des paiements pour les dépenses confirmées.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Dû</TableHead>
                <TableHead>Reçu</TableHead>
                <TableHead>Solde</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confirmedAndPaidExpenses.map((group) => {
                const receivedAmount = group.payment?.receivedAmount ?? 0;
                const balance = group.totalAmount - receivedAmount;
                return (
                  <TableRow key={group.id}>
                    <TableCell className="hidden md:table-cell">{formatDate(group.id)}</TableCell>
                    <TableCell className="md:hidden">{formatDate(group.id, "dd/MM")}</TableCell>
                    <TableCell>{formatCurrency(group.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(receivedAmount)}</TableCell>
                    <TableCell className={balance <= 0 ? 'text-green-600' : 'text-destructive'}>{formatCurrency(balance)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${group.status === 'Payé' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {group.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex flex-col sm:flex-row gap-2 justify-end items-center">
                          <Button variant="outline" size="icon" onClick={() => handleView(group.id)} className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {group.status === 'Confirmé' && (
                            <div className="flex flex-col sm:flex-row gap-2 justify-end">
                              <Input
                                type="number"
                                placeholder="Montant"
                                className="w-full sm:w-24 h-8"
                                value={receivedAmounts[group.id] ?? ''}
                                onChange={(e) => handleAmountChange(group.id, e.target.value)}
                              />
                              <Button onClick={() => handleSaveReceivedAmount(group)} className="w-full sm:w-auto h-8">
                                Enregistrer
                              </Button>
                            </div>
                          )}
                        </div>
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
