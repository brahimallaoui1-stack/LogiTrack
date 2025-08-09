
"use client";

import { useTaskStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Banknote, Landmark } from "lucide-react";
import type { Expense } from "@/lib/types";
import { parse, isValid, format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type EnrichedExpense = Expense & {
    missionDate?: string;
    ville?: string;
};

export default function ViewProcessedExpensesPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { id } = params; // This can be a taskId or a date string 'yyyy-MM-dd'

    const { tasks, updateExpensesStatusByProcessedDate } = useTaskStore((state) => ({
        tasks: state.tasks,
        updateExpensesStatusByProcessedDate: state.updateExpensesStatusByProcessedDate,
    }));

    const isDateId = useMemo(() => {
      const date = parse(id as string, 'yyyy-MM-dd', new Date());
      return isValid(date);
    }, [id])

    const { processedExpenses, expenseStatus } = useMemo(() => {
      let relevantTasks = [];
      if (isDateId) {
        relevantTasks = tasks.filter(task => 
          task.expenses?.some(exp => 
            (exp.status === 'Comptabilisé' || exp.status === 'Payé') && 
            exp.processedDate && format(new Date(exp.processedDate), 'yyyy-MM-dd') === id
          )
        );
      } else {
        const task = tasks.find(t => t.id === id);
        if (task) {
          relevantTasks.push(task);
        }
      }

      if (relevantTasks.length === 0) return { processedExpenses: [], expenseStatus: null };
      
      const allExpenses: EnrichedExpense[] = [];
      let status: Expense['status'] | null = null;
      relevantTasks.forEach(task => {
        const expenses = task.expenses
            ?.filter(exp => {
                 const isMatch = (exp.status === 'Comptabilisé' || exp.status === 'Payé') &&
                                exp.processedDate && 
                                format(new Date(exp.processedDate), 'yyyy-MM-dd') === id;
                if(isMatch && !status) {
                    status = exp.status;
                }
                return isMatch;
            })
            .map(expense => {
                const missionDate = task.city === 'Casablanca' ? task.date : task.subMissions?.[0]?.date;
                const ville = task.city === 'Casablanca' ? task.city : task.subMissions?.[0]?.city || 'Hors Casablanca';
                return {
                    ...expense,
                    missionDate: missionDate,
                    ville: ville,
                }
            }) || [];
        allExpenses.push(...expenses);
      });
      return { processedExpenses: allExpenses, expenseStatus: status };

    }, [tasks, id, isDateId]);

     const totalAmount = useMemo(() => {
        return processedExpenses.reduce((total, expense) => total + expense.montant, 0);
    }, [processedExpenses]);
    
    const [suggestedAmount, setSuggestedAmount] = useState(totalAmount);
    const [accountantFees, setAccountantFees] = useState(0);

    useEffect(() => {
        setSuggestedAmount(totalAmount);
    }, [totalAmount]);

    const remainder = useMemo(() => {
        return suggestedAmount - accountantFees;
    }, [suggestedAmount, accountantFees]);

    const handleMarkAsPaid = () => {
        updateExpensesStatusByProcessedDate(id as string, 'Payé');
        toast({
            title: "Dépenses payées",
            description: "Le lot de dépenses a été marqué comme payé.",
        });
        router.push('/depenses');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };

    if (processedExpenses.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>Aucune dépense trouvée</CardTitle>
                        <CardDescription>Aucune dépense traitée n'a été trouvée pour cette mission ou cette date.</CardDescription>
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
    
    const pageTitle = isDateId ? `Détail des dépenses du ${formatDate(id as string)}` : "Détail des Dépenses Traitées";

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
                    <CardTitle>{pageTitle}</CardTitle>
                    <CardDescription>
                        Voici le détail des dépenses pour cette sélection.
                    </CardDescription>
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
                        Total: {formatCurrency(totalAmount)}
                    </div>
                </CardContent>

                {isDateId && expenseStatus === 'Comptabilisé' && (
                  <>
                  <Separator className="my-6" />
                  <CardContent className="grid gap-6">
                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="grid gap-2">
                              <Label htmlFor="suggestedAmount">Montant suggéré par le comptable</Label>
                              <Input 
                                  id="suggestedAmount" 
                                  type="number" 
                                  value={suggestedAmount} 
                                  onChange={(e) => setSuggestedAmount(parseFloat(e.target.value) || 0)} 
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="accountantFees">Honoraires du comptable</Label>
                              <Input 
                                  id="accountantFees" 
                                  type="number" 
                                  value={accountantFees} 
                                  onChange={(e) => setAccountantFees(parseFloat(e.target.value) || 0)}
                              />
                          </div>
                      </div>
                      <Card className="bg-muted/50 p-6">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <Banknote className="h-8 w-8 text-muted-foreground" />
                                  <div>
                                      <p className="font-semibold">Reste à verser</p>
                                      <p className="text-sm text-muted-foreground">Le montant final à déposer sur le compte bancaire.</p>
                                  </div>
                              </div>
                              <p className="text-2xl font-bold">{formatCurrency(remainder)}</p>
                          </div>
                      </Card>
                  </CardContent>
                  <CardFooter>
                      <Button className="w-full" onClick={handleMarkAsPaid}>
                          <Landmark className="mr-2 h-4 w-4" />
                          Marquer comme payé
                      </Button>
                  </CardFooter>
                </>
                )}
            </Card>
        </div>
    )
}
