"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTaskStore } from '@/lib/store';
import { categorizeExpense } from '@/ai/flows/categorize-expense';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from 'lucide-react';

const formSchema = z.object({
  expenseType: z.string().min(1, "Le type de dépense est requis."),
  expenseAmount: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0."),
  receipt: z.custom<FileList>().optional(),
});

interface ExpenseFormProps {
  taskId: string;
  onFinished: () => void;
}

export function ExpenseForm({ taskId, onFinished }: ExpenseFormProps) {
  const { toast } = useToast();
  const addExpenseToTask = useTaskStore((state) => state.addExpenseToTask);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCategorizing, setIsCategorizing] = React.useState(false);
  const [suggestedCategories, setSuggestedCategories] = React.useState<string[]>([]);
  const [receiptFilename, setReceiptFilename] = React.useState<string | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expenseType: '',
      expenseAmount: 0,
    },
  });

  const fileRef = form.register("receipt");

  const handleReceiptChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setReceiptFilename(file.name);
    setIsCategorizing(true);
    setSuggestedCategories([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      setReceiptDataUrl(dataUri);
      try {
        const result = await categorizeExpense({ receiptDataUri: dataUri });
        setSuggestedCategories(result.suggestedCategories);
        if (result.suggestedCategories.length > 0) {
          form.setValue('expenseType', result.suggestedCategories[0]);
        }
      } catch (error) {
        console.error("AI categorization failed:", error);
        toast({
          variant: "destructive",
          title: "Erreur de l'IA",
          description: "La catégorisation automatique a échoué. Veuillez choisir manuellement.",
        });
      } finally {
        setIsCategorizing(false);
      }
    };
    reader.readAsDataURL(file);
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const newExpense = {
      id: `exp-${Date.now()}`,
      type: values.expenseType,
      amount: values.expenseAmount,
      receiptUrl: receiptDataUrl ?? undefined,
      receiptFilename: receiptFilename ?? undefined,
      suggestedCategories: suggestedCategories,
    };

    addExpenseToTask(taskId, newExpense);

    toast({
      title: "Dépense ajoutée",
      description: `La nouvelle dépense de ${values.expenseAmount}€ a été ajoutée.`,
    });
    
    setIsSubmitting(false);
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="expenseType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de dépense</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isCategorizing && <SelectItem value="loading" disabled>Chargement...</SelectItem>}
                  {suggestedCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  {suggestedCategories.length > 0 && <hr className="my-1"/>}
                  <SelectItem value="Repas">Repas</SelectItem>
                  <SelectItem value="Taxi">Taxi</SelectItem>
                  <SelectItem value="Hébergement">Hébergement</SelectItem>
                  <SelectItem value="Carburant">Carburant</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expenseAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="receipt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Joindre un reçu</FormLabel>
              <FormControl>
                <div className="relative">
                  <Button type="button" variant="outline" className="w-full justify-start text-left font-normal" onClick={() => document.getElementById('expense-receipt-upload')?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {receiptFilename || 'Télécharger une image'}
                  </Button>
                  <Input id="expense-receipt-upload" type="file" accept="image/*" {...fileRef} onChange={handleReceiptChange} className="hidden" />
                  {isCategorizing && <Loader2 className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isCategorizing}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter la dépense
          </Button>
        </div>
      </form>
    </Form>
  );
}
