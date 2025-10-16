
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTaskStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, MoreVertical, Pencil, Trash2, CheckSquare } from 'lucide-react';
import { MissionFormDialog } from '@/components/MissionFormDialog';
import { Separator } from '@/components/ui/separator';
import type { SubMission, Task } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';

export default function ViewMissionPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { id } = params;
    const { tasks, isLoading, fetchTasks, deleteTask, processMissionExpenses } = useTaskStore();
    
    useEffect(() => {
        if(tasks.length === 0) {
            fetchTasks();
        }
    }, [fetchTasks, tasks.length]);

    const task = tasks.find((t) => t.id === id);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount) + ' MAD';
    };
    
    const unprocessedExpenses = task?.expenses?.filter(e => e.status === 'Sans compte') ?? [];
    
    const handleEdit = () => {
        setIsEditDialogOpen(true);
    };

    const handleDelete = async () => {
        if (task) {
            await deleteTask(task.id);
            setIsDeleteDialogOpen(false);
            router.push('/missions');
        }
    };
    
    const handleProcessExpenses = async () => {
        if (task && unprocessedExpenses.length > 0) {
            await processMissionExpenses([task.id]);
            toast({
                title: "Dépenses traitées",
                description: "Les dépenses de cette mission ont été ajoutées au lot actif.",
            });
            router.push('/depenses');
        } else {
            toast({
                variant: 'destructive',
                title: "Aucune dépense à traiter",
                description: "Cette mission n'a aucune dépense non traitée.",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-20" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
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
    
    const isCasablancaMission = task.city === 'Casablanca';

    const renderSubMissionDetails = (subMission: SubMission, index: number) => (
        <Card key={subMission.id}>
            <CardHeader>
                <CardTitle>Étape {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm md:text-base">
                    <div><span className="font-semibold text-muted-foreground">Date:</span> {formatDate(subMission.date, "dd-MM-yyyy")}</div>
                    <div><span className="font-semibold text-muted-foreground">Réservation:</span> {subMission.reservation || 'N/A'}</div>
                    <div><span className="font-semibold text-muted-foreground">Type:</span> {subMission.typeMission || 'N/A'}</div>
                    <div><span className="font-semibold text-muted-foreground">Ville:</span> {subMission.city || 'N/A'}</div>
                    <div><span className="font-semibold text-muted-foreground">Client:</span> {subMission.entreprise || 'N/A'}</div>
                    <div><span className="font-semibold text-muted-foreground">Gestionnaire:</span> {subMission.gestionnaire || 'N/A'}</div>
                </div>
                <Separator/>
                <div className="space-y-4">
                    <h4 className="font-semibold text-base md:text-lg">Informations sur le véhicule</h4>
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm md:text-base">
                        <div><span className="font-semibold text-muted-foreground">Marque:</span> {subMission.marqueVehicule || 'N/A'}</div>
                        <div><span className="font-semibold text-muted-foreground">Immat.:</span> {subMission.immatriculation || 'N/A'}{subMission.typeMission === 'Link' ? ' VHP' : ''}</div>
                    </div>
                </div>
                <div>
                    <h5 className="font-semibold mb-1 text-base md:text-lg">Remarque</h5>
                    <p className="text-sm text-muted-foreground break-words">{subMission.remarque || 'Aucune remarque'}</p>
                </div>
            </CardContent>
        </Card>
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
                    {unprocessedExpenses.length > 0 && (
                        <Button onClick={handleProcessExpenses}>
                            <CheckSquare className="mr-2 h-4 w-4" />
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
                            <DropdownMenuItem onClick={handleEdit}>
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
                    <CardTitle className="text-lg md:text-2xl">Détails: {task.label}</CardTitle>
                    <CardDescription>Informations complètes sur la mission.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isCasablancaMission ? (
                        <div className="space-y-6">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm md:text-base">
                                <div><span className="font-semibold text-muted-foreground">Date:</span> {formatDate(task.date, "dd-MM-yyyy")}</div>
                                <div><span className="font-semibold text-muted-foreground">Réservation:</span> {task.reservation || 'N/A'}</div>
                                <div><span className="font-semibold text-muted-foreground">Type:</span> {task.typeMission || 'N/A'}</div>
                                <div><span className="font-semibold text-muted-foreground">Ville:</span> {task.city || 'N/A'}</div>
                                <div><span className="font-semibold text-muted-foreground">Client:</span> {task.entreprise || 'N/A'}</div>
                                <div><span className="font-semibold text-muted-foreground">Gestionnaire:</span> {task.gestionnaire || 'N/A'}</div>
                            </div>

                            <Separator/>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-base md:text-lg">Informations sur le véhicule</h4>
                                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm md:text-base">
                                    <div><span className="font-semibold text-muted-foreground">Marque:</span> {task.marqueVehicule || 'N/A'}</div>
                                    <div><span className="font-semibold text-muted-foreground">Immat.:</span> {task.immatriculation || 'N/A'}{task.typeMission === 'Link' ? ' VHP' : ''}</div>
                                </div>
                             </div>
                             <div>
                                <h5 className="font-semibold mb-1 text-base md:text-lg">Remarque</h5>
                                <p className="text-sm text-muted-foreground break-words">{task.remarque || 'Aucune remarque'}</p>
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-6">
                            {task.subMissions?.map((sub, index) => renderSubMissionDetails(sub, index))}
                         </div>
                    )}
                    
                    {task.expenses && task.expenses.length > 0 && (
                        <div>
                            <Separator className="my-6"/>
                            <h4 className="font-semibold text-base md:text-lg mb-4">Dépenses</h4>
                            <div className="rounded-md border overflow-x-auto">
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
                                                <TableCell>{expense.remarque || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                                <div className="text-right font-semibold pr-4 mt-2">
                                Total: {formatCurrency(task.expenses.reduce((sum, exp) => sum + exp.montant, 0))}
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

    

    