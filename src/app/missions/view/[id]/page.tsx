
"use client";

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTaskStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { MissionFormDialog } from '@/components/MissionFormDialog';
import { Separator } from '@/components/ui/separator';
import type { SubMission, ExpenseStatus, Task } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ViewMissionPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { id } = params;
    const { tasks, updateExpenseStatus, deleteTask } = useTaskStore((state) => ({
        tasks: state.tasks,
        updateExpenseStatus: state.updateExpenseStatus,
        deleteTask: state.deleteTask,
    }));
    const task = tasks.find((t) => t.id === id);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const cameFromDepenses = searchParams.get('from') === 'depenses';
    const hasUnprocessedExpenses = task?.expenses?.some(exp => exp.status === 'Sans compte');
    const showProcessExpenseButton = cameFromDepenses && hasUnprocessedExpenses;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };
    
    const totalExpenses = task?.expenses?.reduce((sum, exp) => sum + exp.montant, 0) ?? 0;
    const isCasablancaMission = task?.city === 'Casablanca';

    const handleProcessExpense = () => {
        if (task) {
            updateExpenseStatus(task.id, 'Comptabilisé');
            toast({
                title: "Dépense traitée",
                description: "La dépense a été marquée comme comptabilisée.",
            });
            setIsConfirmDialogOpen(false);
            router.push('/depenses');
        }
    };
    
    const handleEdit = (task: Task) => {
        setIsEditDialogOpen(true);
    };

    const handleDelete = () => {
        if (task) {
            deleteTask(task.id);
            setIsDeleteDialogOpen(false);
            router.push('/missions');
        }
    };


    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>Mission non trouvée</CardTitle>
                        <CardDescription>La mission que vous recherchez n'existe pas ou a été supprimée.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => router.push('/missions')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour à la liste
                        </Button>
                    </CardContent>
                 </Card>
            </div>
        );
    }

    const renderSubMissionDetails = (subMission: SubMission, index: number) => (
        <div key={subMission.id} className="p-4 border rounded-lg space-y-4">
             <h3 className="font-bold text-xl">Étape {index + 1}</h3>
             <div className="grid md:grid-cols-3 gap-4">
                <div><span className="font-semibold">Date:</span> {formatDate(subMission.date)}</div>
                <div><span className="font-semibold">Réservation:</span> {subMission.reservation || 'N/A'}</div>
                <div><span className="font-semibold">Type de Mission:</span> {subMission.typeMission || 'N/A'}</div>
                <div><span className="font-semibold">Ville:</span> {subMission.city || 'N/A'}</div>
                <div><span className="font-semibold">Client:</span> {subMission.entreprise || 'N/A'}</div>
                <div><span className="font-semibold">Gestionnaire:</span> {subMission.gestionnaire || 'N/A'}</div>
            </div>
            <Separator/>
             <div className="space-y-2">
                 <h4 className="font-semibold text-lg">Informations sur le véhicule</h4>
                <div><span className="font-semibold">Marque de véhicule:</span> {subMission.marqueVehicule || 'N/A'}</div>
                <div><span className="font-semibold">Immatriculation:</span> {subMission.immatriculation || 'N/A'}</div>
                 <div>
                    <h5 className="font-semibold mb-1">Remarque</h5>
                    <p className="text-sm text-muted-foreground">{subMission.remarque || 'Aucune remarque'}</p>
                </div>
            </div>
        </div>
    );
    
    return (
        <>
        <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <div className="flex gap-2">
                    {showProcessExpenseButton && (
                         <Button variant="secondary" onClick={() => setIsConfirmDialogOpen(true)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Dépense traitée
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(task)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Détails de la mission : {task.label}</CardTitle>
                    <CardDescription>Informations complètes sur la mission.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isCasablancaMission ? (
                        <div className="grid gap-6">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div><span className="font-semibold">Date:</span> {formatDate(task.date)}</div>
                                <div><span className="font-semibold">Réservation:</span> {task.reservation || 'N/A'}</div>
                                <div><span className="font-semibold">Type de Mission:</span> {task.typeMission || 'N/A'}</div>
                                <div><span className="font-semibold">Ville:</span> {task.city || 'N/A'}</div>
                                <div><span className="font-semibold">Client:</span> {task.entreprise || 'N/A'}</div>
                                <div><span className="font-semibold">Gestionnaire:</span> {task.gestionnaire || 'N/A'}</div>
                            </div>

                            <Separator/>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-lg mb-4">Informations sur le véhicule</h4>
                                    <div className="space-y-2">
                                        <div><span className="font-semibold">Marque de véhicule:</span> {task.marqueVehicule || 'N/A'}</div>
                                        <div><span className="font-semibold">Immatriculation:</span> {task.immatriculation || 'N/A'}</div>
                                        <div>
                                            <h5 className="font-semibold mb-1">Remarque</h5>
                                            <p className="text-sm text-muted-foreground">{task.remarque || 'Aucune remarque'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-6">
                            {task.subMissions?.map((sub, index) => renderSubMissionDetails(sub, index))}
                         </div>
                    )}
                    
                    {!isCasablancaMission && task.expenses && task.expenses.length > 0 && (
                        <div>
                            <Separator className="my-6"/>
                            <h4 className="font-semibold text-lg mb-2">Dépenses</h4>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Montant</TableHead>
                                            <TableHead>Remarque</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {task.expenses.map((expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell>{expense.typeDepense}</TableCell>
                                                <TableCell>{formatCurrency(expense.montant)}</TableCell>
                                                <TableCell>{expense.remarque}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                                <div className="text-right font-semibold pr-4 mt-2">
                                Total des dépenses: {formatCurrency(totalExpenses)}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <MissionFormDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            task={task}
            prefilledCity={task.city === 'Casablanca' ? 'Casablanca' : undefined}
        />
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer le traitement</AlertDialogTitle>
                    <AlertDialogDescription>
                        Êtes-vous sûr de vouloir marquer cette dépense comme traitée ? Cette action la déplacera vers la liste des dépenses comptabilisées.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleProcessExpense}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Cela supprimera définitivement la mission.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}

    