"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { ExpenseForm } from '@/components/ExpenseForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export default function TaskDetailsClient({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { getTaskById, setTaskBilled, isInitialized } = useTaskStore();
  const [open, setOpen] = React.useState(false);
  
  const task = getTaskById(taskId);

  const handleBillTask = () => {
    setTaskBilled(taskId);
    toast({
      title: "Comptabilité effectuée",
      description: `La tâche ${task?.taskNumber} a été marquée comme facturée.`,
    });
    router.push('/billed');
  };

  if (!isInitialized) {
    return <Skeleton className="h-[600px] w-full" />;
  }
  
  if (!task) {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold">Tâche non trouvée</h1>
            <p className="text-muted-foreground">Impossible de trouver la tâche avec l'ID fourni.</p>
            <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
        </div>
    );
  }
  
  const totalExpenses = task.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <Button onClick={() => router.back()} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
      </Button>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Détails de la tâche</h1>
          <p className="text-muted-foreground">{task.taskNumber} - {task.company}</p>
        </div>
        {task.status === 'unbilled' && (
             <Button size="lg" onClick={handleBillTask}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Effectuer la comptabilité
            </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Dépenses</CardTitle>
                    <CardDescription>Total des dépenses pour cette tâche: {totalExpenses.toFixed(2)} €</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead className="text-center">Reçu</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {task.expenses.map(exp => (
                                <TableRow key={exp.id}>
                                    <TableCell className="font-medium">{exp.type}</TableCell>
                                    <TableCell className="text-right">{exp.amount.toFixed(2)} €</TableCell>
                                    <TableCell className="text-center">
                                        {exp.receiptUrl && (
                                            <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                <ImageIcon className="h-5 w-5 mx-auto text-primary hover:text-primary/80" />
                                            </a>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
             <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter une dépense
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Ajouter une nouvelle dépense</DialogTitle>
                    <DialogDescription>
                        Remplissez les détails de la nouvelle dépense pour cette tâche.
                    </DialogDescription>
                    </DialogHeader>
                    <ExpenseForm taskId={task.id} onFinished={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Informations sur la tâche</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between"><span>Date:</span> <span className="font-medium">{new Date(task.date).toLocaleDateString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span>Ville:</span> <span className="font-medium">{task.city}</span></div>
                    <Separator />
                    <p className="font-medium">Véhicule de livraison</p>
                    <div className="flex justify-between text-muted-foreground"><span>Type:</span> <span className="font-medium text-foreground">{task.deliveryVehicleType}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Plaque:</span> <span className="font-medium text-foreground">{task.deliveryVehiclePlate}</span></div>
                    <Separator />
                    <p className="font-medium">Véhicule de retour</p>
                    <div className="flex justify-between text-muted-foreground"><span>Type:</span> <span className="font-medium text-foreground">{task.returnVehicleType}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Plaque:</span> <span className="font-medium text-foreground">{task.returnVehiclePlate}</span></div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
