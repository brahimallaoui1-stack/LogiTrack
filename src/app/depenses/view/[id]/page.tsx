
"use client";

import { useTaskStore, useFacturationStore } from "@/lib/store";
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
    const { id } = params; // This can be a date string 'yyyy-MM-dd'

    const { tasks, fetchTasks, updateExpensesStatusByProcessedDate } = useTaskStore();
    const { updatePaymentInfo } = useFacturationStore();

    useEffect(() => {
        if (tasks.length === 0) {
            fetchTasks();
        }
    }, [tasks, fetchTasks]);

    const isDateId = useMemo(() => {
      const date = parse(id as string, 'yyyy-MM-dd', new Date());
      return isValid(date);
    }, [id])

    const { processedExpenses, expenseStatus, paymentDetails } = useMemo(() => {
      if (!isDateId) return { processedExpenses: [], expenseStatus: null, paymentDetails: {} };

      let status: Expense['status'] | null = null;
      const allExpenses: EnrichedExpense[] = [];
      let paymentData = {};
      
      tasks.forEach(task => {
        task.expenses
            ?.filter(exp => {
                 const isMatch = (exp.status === 'Comptabilisé' || exp.status === 'Confirmé' || exp.status === 'Payé') &&
                                exp.processedDate && 
                                format(new Date(exp.processedDate), 'yyyy-MM-dd') === id;
                if(isMatch) {
                    if (!status || exp.status === 'Confirmé' || exp.status === 'Payé') {
                       status = exp.status;
                    }
                    if (exp.payment) {
                        paymentData = { ...paymentData, ...exp.payment };
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
      return { processedExpenses: allExpenses, expenseStatus: status, paymentDetails: paymentData };

    }, [tasks, id, isDateId]);

     const totalAmount = useMemo(() => {
        return processedExpenses.reduce((total, expense) => total + expense.montant, 0);
    }, [processedExpenses]);
    
    const [suggestedAmount, setSuggestedAmount] = useState<number | ''>('');
    const [accountantFees, setAccountantFees] = useState<number | ''>('');
    const [advance, setAdvance] = useState<number | ''>('');
    
    useEffect(() => {
        setSuggestedAmount(paymentDetails.suggestedAmount ?? '');
        setAccountantFees(paymentDetails.accountantFees ?? '');
        setAdvance(paymentDetails.advance ?? '');
    }, [paymentDetails]);


    const remainder = useMemo(() => {
        const sugg = typeof suggestedAmount === 'number' ? suggestedAmount : 0;
        const adv = typeof advance === 'number' ? advance : 0;
        const fees = typeof accountantFees === 'number' ? accountantFees : 0;
        return sugg - adv - fees;
    }, [suggestedAmount, advance, accountantFees]);

    const handleMarkAsConfirmed = async () => {
        await updateExpensesStatusByProcessedDate(id as string, 'Confirmé', {
            suggestedAmount: typeof suggestedAmount === 'number' ? suggestedAmount : 0,
            accountantFees: typeof accountantFees === 'number' ? accountantFees : 0,
            advance: typeof advance === 'number' ? advance : 0,
        });
        toast({
            title: "Dépenses confirmées",
            description: "Le lot de dépenses a été marqué comme confirmé et transféré à la facturation.",
        });
        router.push('/facturation');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };
    
    const isPaymentFinalized = expenseStatus === 'Confirmé' || expenseStatus === 'Payé';

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
    const pageDescription = isPaymentFinalized
      ? 'Voici le récapitulatif des dépenses qui ont été confirmées ou payées.'
      : 'Finalisez le paiement ou mettez à jour les montants.';


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
                    <CardDescription>{pageDescription}</CardDescription>
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

                {(expenseStatus === 'Comptabilisé' || isPaymentFinalized) && (
                  <>
                  <Separator className="my-6" />
                  <CardContent className="grid gap-6">
                      <div className="grid md:grid-cols-3 gap-6">
                          <div className="grid gap-2">
                              <Label htmlFor="suggestedAmount">Montant suggéré</Label>
                              <Input 
                                  id="suggestedAmount" 
                                  type="number" 
                                  value={suggestedAmount} 
                                  onChange={(e) => setSuggestedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  disabled={isPaymentFinalized}
                                  placeholder="Entrer le montant"
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="advance">Avance (Tasbiq)</Label>
                              <Input 
                                  id="advance" 
                                  type="number" 
                                  value={advance} 
                                  onChange={(e) => setAdvance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  disabled={isPaymentFinalized}
                                   placeholder="Entrer l'avance"
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="accountantFees">Honoraires du comptable</Label>
                              <Input 
                                  id="accountantFees" 
                                  type="number" 
                                  value={accountantFees} 
                                  onChange={(e) => setAccountantFees(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  disabled={isPaymentFinalized}
                                   placeholder="Entrer les honoraires"
                              />
                          </div>
                      </div>
                      <Card className="bg-muted/50 p-4 md:p-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                  <Banknote className="h-8 w-8 text-muted-foreground" />
                                  <div>
                                      <p className="font-semibold">Reste à verser</p>
                                      <p className="text-sm text-muted-foreground">Le montant final à déposer sur le compte bancaire.</p>
                                  </div>
                              </div>
                              <p className="text-2xl font-bold self-end md:self-center">{formatCurrency(remainder)}</p>
                          </div>
                      </Card>
                  </CardContent>
                  {expenseStatus === 'Comptabilisé' && (
                    <CardFooter>
                        <Button className="w-full" onClick={handleMarkAsConfirmed}>
                            <Landmark className="mr-2 h-4 w-4" />
                            Marquer comme confirmé
                        </Button>
                    </CardFooter>
                  )}
                </>
                )}
            </Card>
        </div>
    )
}
