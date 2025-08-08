"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTaskStore } from '@/lib/store';
import { categorizeExpense } from '@/ai/flows/categorize-expense';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from 'lucide-react';

const formSchema = z.object({
  date: z.string().min(1, "La date est requise."),
  city: z.string().min(1, "La ville est requise."),
  taskNumber: z.string().min(1, "Le numéro de tâche est requis."),
  company: z.string().min(1, "L'entreprise est requise."),
  deliveryVehicleType: z.string().min(1, "Le type de véhicule de livraison est requis."),
  deliveryVehiclePlate: z.string().min(1, "L'immatriculation du véhicule de livraison est requise."),
  returnVehicleType: z.string().min(1, "Le type de véhicule de retour est requis."),
  returnVehiclePlate: z.string().min(1, "L'immatriculation du véhicule de retour est requise."),
  expenseType: z.string().min(1, "Le type de dépense est requis."),
  expenseAmount: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0."),
  receipt: z.custom<FileList>().optional(),
});

export default function NewTaskClient() {
  const router = useRouter();
  const { toast } = useToast();
  const addTask = useTaskStore((state) => state.addTask);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCategorizing, setIsCategorizing] = React.useState(false);
  const [suggestedCategories, setSuggestedCategories] = React.useState<string[]>([]);
  const [receiptFilename, setReceiptFilename] = React.useState<string | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      city: '',
      taskNumber: '',
      company: '',
      deliveryVehicleType: '',
      deliveryVehiclePlate: '',
      returnVehicleType: '',
      returnVehiclePlate: '',
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
    const newExpenseId = `exp-${Date.now()}`;
    const newTaskId = `task-${Date.now()}`;

    const newExpense = {
      id: newExpenseId,
      type: values.expenseType,
      amount: values.expenseAmount,
      receiptUrl: receiptDataUrl ?? undefined,
      receiptFilename: receiptFilename ?? undefined,
      suggestedCategories: suggestedCategories,
    };

    const newTask = {
      id: newTaskId,
      ...values,
      status: 'unbilled' as 'unbilled' | 'billed',
      expenses: [newExpense],
    };

    addTask(newTask);

    toast({
      title: "Tâche ajoutée",
      description: `La tâche ${values.taskNumber} a été créée avec succès.`,
    });
    
    router.push('/unbilled');
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Ajouter une nouvelle tâche</h1>
        <p className="text-muted-foreground">Saisir les détails de la tâche et la dépense initiale.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informations sur la tâche</CardTitle>
              <CardDescription>Détails concernant la mission de livraison.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>Ville</FormLabel><FormControl><Input placeholder="ex: Paris" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="taskNumber" render={({ field }) => (
                <FormItem><FormLabel>Numéro de la tâche</FormLabel><FormControl><Input placeholder="ex: T-12345" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem><FormLabel>Entreprise</FormLabel><FormControl><Input placeholder="ex: Global Logistics" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="deliveryVehicleType" render={({ field }) => (
                <FormItem><FormLabel>Type véhicule livraison</FormLabel><FormControl><Input placeholder="ex: Van" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="deliveryVehiclePlate" render={({ field }) => (
                <FormItem><FormLabel>Immatriculation livraison</FormLabel><FormControl><Input placeholder="ex: AB-123-CD" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="returnVehicleType" render={({ field }) => (
                <FormItem><FormLabel>Type véhicule retour</FormLabel><FormControl><Input placeholder="ex: Van" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="returnVehiclePlate" render={({ field }) => (
                <FormItem><FormLabel>Immatriculation retour</FormLabel><FormControl><Input placeholder="ex: AB-123-CD" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dépense initiale</CardTitle>
              <CardDescription>Ajoutez la première dépense associée à cette tâche.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="expenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de dépense</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCategorizing && <SelectItem value="loading" disabled>Chargement des suggestions...</SelectItem>}
                        {suggestedCategories.length > 0 && suggestedCategories.map(cat => (
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
              <FormField control={form.control} name="expenseAmount" render={({ field }) => (
                <FormItem><FormLabel>Montant</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField
                control={form.control}
                name="receipt"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Joindre un reçu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Button type="button" variant="outline" className="w-full justify-start text-left font-normal" onClick={() => document.getElementById('receipt-upload')?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            {receiptFilename || 'Télécharger une image'}
                        </Button>
                        <Input id="receipt-upload" type="file" accept="image/*" {...fileRef} onChange={handleReceiptChange} className="hidden" />
                        {isCategorizing && <Loader2 className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
                      </div>
                    </FormControl>
                    <FormDescription>L'IA suggérera une catégorie à partir de votre reçu.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting || isCategorizing}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer la tâche
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
