
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTaskStore, useCityStore, useManagerStore, useMissionTypeStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, Expense } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "./ui/separator";

interface MissionFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    task?: Task | null;
    prefilledCity?: string;
}

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
}

const initialFormState = {
  date: "",
  reservation: "",
  ville: "",
  entreprise: "",
  gestionnaire: "",
  typeMission: "",
  marqueVehiculeLivraison: "",
  immatriculationLivraison: "",
  remarqueLivraison: "",
  marqueVehiculeRecuperation: "",
  immatriculationRecuperation: "",
  remarqueRecuperation: "",
  label: "",
  expenses: [] as Expense[],
};

const expenseTypes = ["Hôtel", "Transport", "Panier"];

function ExpenseFormDialog({ isOpen, onOpenChange, onSave }: ExpenseFormDialogProps) {
  const [typeDepense, setTypeDepense] = useState('');
  const [montant, setMontant] = useState('');
  const [remarque, setRemarque] = useState('');

  const handleAddExpense = () => {
    if (!typeDepense || !montant) return;
    onSave({
      typeDepense,
      montant: parseFloat(montant) || 0,
      remarque,
    });
    // Reset fields for next entry
    setTypeDepense('');
    setMontant('');
    setRemarque('');
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter des frais</DialogTitle>
          <DialogDescription>Saisissez les détails des coûts.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="typeDepense">Type de dépense</Label>
                <Select value={typeDepense} onValueChange={setTypeDepense}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                        {expenseTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="montant">Montant</Label>
                <Input id="montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="remarqueFrais">Remarque</Label>
                <Textarea id="remarqueFrais" value={remarque} onChange={(e) => setRemarque(e.target.value)} />
            </div>
        </div>
        <DialogFooter className="justify-between">
          <Button onClick={() => onOpenChange(false)}>Terminé</Button>
          <Button onClick={handleAddExpense}>
            <Plus className="h-4 w-4 mr-2"/>
            Ajouter le frais
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function MissionFormDialog({ isOpen, onOpenChange, task: editingTask, prefilledCity }: MissionFormDialogProps) {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  
  const { cities } = useCityStore();
  const { managers } = useManagerStore();
  const { missionTypes } = useMissionTypeStore();

  const [formState, setFormState] = useState(initialFormState);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  const isCasablancaMission = formState.ville === 'Casablanca';

  useEffect(() => {
    if (isOpen) {
        if (editingTask) {
          setFormState({
            date: editingTask.date || "",
            reservation: editingTask.reservation || "",
            ville: editingTask.city || "",
            entreprise: editingTask.entreprise || "",
            gestionnaire: editingTask.gestionnaire || "",
            typeMission: editingTask.typeMission || "",
            marqueVehiculeLivraison: editingTask.marqueVehiculeLivraison || "",
            immatriculationLivraison: editingTask.immatriculationLivraison || "",
            remarqueLivraison: editingTask.remarqueLivraison || "",
            marqueVehiculeRecuperation: editingTask.marqueVehiculeRecuperation || "",
            immatriculationRecuperation: editingTask.immatriculationRecuperation || "",
            remarqueRecuperation: editingTask.remarqueRecuperation || "",
            label: editingTask.label || "",
            expenses: editingTask.expenses || [],
          });
        } else {
            setFormState({...initialFormState, ville: prefilledCity || "" });
        }
    } else {
         setFormState(initialFormState);
    }
  }, [editingTask, isOpen, prefilledCity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSaveExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: `expense-${Date.now()}-${Math.random()}` };
    setFormState(prevState => ({
      ...prevState,
      expenses: [...prevState.expenses, newExpense],
    }));
  };
  
  const handleRemoveExpense = (expenseId: string) => {
     setFormState(prevState => ({
      ...prevState,
      expenses: prevState.expenses.filter(exp => exp.id !== expenseId),
    }));
  }

  const handleSave = () => {
    const taskData: Omit<Task, 'id'> = {
        label: formState.typeMission || 'Nouvelle mission',
        city: formState.ville,
        date: formState.date,
        reservation: formState.reservation,
        entreprise: formState.entreprise,
        gestionnaire: formState.gestionnaire,
        typeMission: formState.typeMission,
        marqueVehiculeLivraison: formState.marqueVehiculeLivraison,
        immatriculationLivraison: formState.immatriculationLivraison,
        remarqueLivraison: formState.remarqueLivraison,
    };
    
    if (!isCasablancaMission) {
        taskData.marqueVehiculeRecuperation = formState.marqueVehiculeRecuperation;
        taskData.immatriculationRecuperation = formState.immatriculationRecuperation;
        taskData.remarqueRecuperation = formState.remarqueRecuperation;
        taskData.expenses = formState.expenses;
    } else {
        taskData.expenses = [];
        taskData.marqueVehiculeRecuperation = "";
        taskData.immatriculationRecuperation = "";
        taskData.remarqueRecuperation = "";
    }


    if (editingTask) {
      updateTask({ ...editingTask, ...taskData });
    } else {
      addTask(taskData);
    }

    onOpenChange(false);
  };
  
  const totalExpenses = formState.expenses.reduce((sum, exp) => sum + exp.montant, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
     <>
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-3xl">
         <DialogHeader>
           <DialogTitle>{editingTask ? "Modifier la mission" : "Ajouter une mission"}</DialogTitle>
           <DialogDescription>
             {editingTask ? "Mettez à jour les détails de la mission." : "Remplissez les détails de la nouvelle mission ci-dessous."}
           </DialogDescription>
         </DialogHeader>
         <ScrollArea className="max-h-[70vh] p-4">
          <div className="grid gap-6 py-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={formState.date} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="reservation">Réservation</Label>
                    <Input id="reservation" value={formState.reservation} onChange={handleInputChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="typeMission">Types de Mission</Label>
                     <Select value={formState.typeMission} onValueChange={(value) => handleSelectChange('typeMission', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de mission" />
                        </SelectTrigger>
                        <SelectContent>
                            {missionTypes.map(type => (
                                <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="ville">Ville</Label>
                     <Select value={formState.ville} onValueChange={(value) => handleSelectChange('ville', value)} disabled={!!prefilledCity}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une ville" />
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map(city => (
                                <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="entreprise">Client</Label>
                    <Input id="entreprise" value={formState.entreprise} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="gestionnaire">Gestionnaire</Label>
                     <Select value={formState.gestionnaire} onValueChange={(value) => handleSelectChange('gestionnaire', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un gestionnaire" />
                        </SelectTrigger>
                        <SelectContent>
                            {managers.map(manager => (
                                <SelectItem key={manager.id} value={manager.name}>{manager.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>

            <Separator className="my-4"/>
            
            <div className={`grid ${!isCasablancaMission ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-x-8 gap-y-4`}>
                <div>
                     {!isCasablancaMission && <h4 className="font-semibold mb-4 text-center">Livraison</h4>}
                     <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="marqueVehiculeLivraison">Marque de véhicule</Label>
                            <Input id="marqueVehiculeLivraison" value={formState.marqueVehiculeLivraison} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="immatriculationLivraison">Immatriculation</Label>
                            <Input id="immatriculationLivraison" value={formState.immatriculationLivraison} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="remarqueLivraison">Remarque</Label>
                          <Textarea id="remarqueLivraison" value={formState.remarqueLivraison} onChange={handleInputChange} />
                      </div>
                     </div>
                </div>
                {!isCasablancaMission && (
                <div>
                     <h4 className="font-semibold mb-4 text-center">Récupération</h4>
                     <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="marqueVehiculeRecuperation">Marque de véhicule</Label>
                            <Input id="marqueVehiculeRecuperation" value={formState.marqueVehiculeRecuperation} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="immatriculationRecuperation">Immatriculation</Label>
                            <Input id="immatriculationRecuperation" value={formState.immatriculationRecuperation} onChange={handleInputChange} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="remarqueRecuperation">Remarque</Label>
                            <Textarea id="remarqueRecuperation" value={formState.remarqueRecuperation} onChange={handleInputChange} />
                        </div>
                     </div>
                </div>
                )}
            </div>

              {!isCasablancaMission && formState.expenses.length > 0 && (
                <div className="grid gap-2 pt-4">
                    <Label>Frais</Label>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Montant</TableHead>
                                    <TableHead>Remarque</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {formState.expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{expense.typeDepense}</TableCell>
                                        <TableCell>{formatCurrency(expense.montant)} MAD</TableCell>
                                        <TableCell className="truncate max-w-[100px]">{expense.remarque}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveExpense(expense.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-right font-semibold pr-4">
                        Total des frais: {formatCurrency(totalExpenses)} MAD
                    </div>
                </div>
              )}
          </div>
        </ScrollArea>
         <DialogFooter className="sm:justify-between gap-2 pt-4">
           {!isCasablancaMission ? 
            <Button type="button" variant="secondary" onClick={() => setIsExpenseDialogOpen(true)}>Ajouter des frais</Button> 
            : <div></div>}
           <div className="flex gap-2 justify-end">
            <Button type="submit" onClick={() => handleSave()}>Enregistrer</Button>
           </div>
         </DialogFooter>
       </DialogContent>
     </Dialog>
     <ExpenseFormDialog
        isOpen={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSave={handleSaveExpense}
      />
    </>
  );
}
