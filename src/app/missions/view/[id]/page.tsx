
"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTaskStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { MissionFormDialog } from '@/components/MissionFormDialog';
import { Separator } from '@/components/ui/separator';

export default function ViewMissionPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const tasks = useTaskStore((state) => state.tasks);
    const task = tasks.find((t) => t.id === id);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount) + ' MAD';
    };
    
    const totalExpenses = task?.expenses?.reduce((sum, exp) => sum + exp.montant, 0) ?? 0;
    const isCasablancaMission = task?.city === 'Casablanca';

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
    
    return (
        <>
        <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <Button onClick={() => setIsEditDialogOpen(true)}>Modifier la mission</Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Détails de la mission : {task.label}</CardTitle>
                    <CardDescription>Informations complètes sur la mission.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div><span className="font-semibold">Date:</span> {task.date || 'N/A'}</div>
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
                        
                        {!isCasablancaMission && task.expenses && task.expenses.length > 0 && (
                            <div>
                                <Separator className="my-4"/>
                                <h4 className="font-semibold text-lg mb-2">Frais</h4>
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
                                    Total des frais: {formatCurrency(totalExpenses)}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        <MissionFormDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            task={task}
            prefilledCity={task.city === 'Casablanca' ? 'Casablanca' : undefined}
        />
        </>
    );
}
