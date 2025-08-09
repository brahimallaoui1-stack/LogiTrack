
"use client";

import { useMemo, useState } from "react";
import { useTaskStore, useFacturationStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";
import { format } from "date-fns";
import { DollarSign, Banknote } from "lucide-react";

type GroupedExpense = {
  id: string; // The date 'yyyy-MM-dd'
  totalAmount: number;
  status: 'Confirmé' | 'Payé';
};

export default function FacturationPage() {
  const { tasks } = useTaskStore();
  const { invoices, updateInvoice } = useFacturationStore();
  const [receivedAmounts, setReceivedAmounts] = useState<Record<string, number | "">>({});

  const confirmedAndPaidExpenses = useMemo(() => {
    const grouped: Record<string, { totalAmount: number; status: 'Confirmé' | 'Payé' }> = {};

    tasks.forEach(task => {
      task.expenses?.forEach(expense => {
        if ((expense.status === 'Confirmé' || expense.status === 'Payé') && expense.processedDate) {
          const dateKey = format(new Date(expense.processedDate), 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = { totalAmount: 0, status: 'Confirmé' };
          }
          grouped[dateKey].totalAmount += expense.montant;
          // If any expense in the group is paid, the whole group is considered paid
          if (expense.status === 'Payé') {
            grouped[dateKey].status = 'Payé';
          }
        }
      });
    });

    return Object.entries(grouped).map(([id, data]) => ({
      id,
      ...data,
    })).sort((a,b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  }, [tasks]);
  
 const totals = useMemo(() => {
    let totalDue = 0;
    let totalPaidOff = 0;

    confirmedAndPaidExpenses.forEach(e => {
        if (e.status === 'Payé') {
            totalPaidOff += e.totalAmount;
        } else { // 'Confirmé'
            totalDue += e.totalAmount;
        }
    });

    const totalReceivedFromInvoices = Object.values(invoices).reduce((sum, inv) => {
        // Only sum received amounts for invoices that are not yet fully paid
        const correspondingExpense = confirmedAndPaidExpenses.find(e => e.id === inv.id);
        if (correspondingExpense && correspondingExpense.status !== 'Payé') {
            return sum + inv.receivedAmount;
        }
        return sum;
    }, 0);

    return {
        totalDue: totalDue - totalReceivedFromInvoices,
        totalReceived: totalPaidOff + totalReceivedFromInvoices,
    }
  }, [confirmedAndPaidExpenses, invoices]);

  const handleAmountChange = (id: string, value: string) => {
    setReceivedAmounts(prev => ({ ...prev, [id]: value === '' ? '' : parseFloat(value) }));
  };

  const handleSaveReceivedAmount = (id: string, totalDue: number) => {
    const amount = receivedAmounts[id];
    if (typeof amount === 'number' && amount > 0) {
      updateInvoice(id, amount, totalDue);
      setReceivedAmounts(prev => ({ ...prev, [id]: '' }));
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' MAD';
  };

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
                <TableHead>Date de Traitement</TableHead>
                <TableHead>Montant Dû</TableHead>
                <TableHead>Montant Reçu</TableHead>
                <TableHead>Solde Restant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Encaisser un paiement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confirmedAndPaidExpenses.map((group) => {
                const invoice = invoices[group.id];
                const receivedAmount = invoice?.receivedAmount ?? 0;
                const balance = group.totalAmount - receivedAmount;
                return (
                  <TableRow key={group.id}>
                    <TableCell>{formatDate(group.id)}</TableCell>
                    <TableCell>{formatCurrency(group.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(receivedAmount)}</TableCell>
                    <TableCell className={balance <= 0 ? 'text-green-600' : 'text-orange-600'}>{formatCurrency(balance)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${group.status === 'Payé' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {group.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {group.status === 'Confirmé' && (
                        <div className="flex gap-2 justify-end">
                          <Input
                            type="number"
                            placeholder="Montant"
                            className="w-32"
                            value={receivedAmounts[group.id] ?? ''}
                            onChange={(e) => handleAmountChange(group.id, e.target.value)}
                          />
                          <Button onClick={() => handleSaveReceivedAmount(group.id, group.totalAmount)}>
                            Enregistrer
                          </Button>
                        </div>
                      )}
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