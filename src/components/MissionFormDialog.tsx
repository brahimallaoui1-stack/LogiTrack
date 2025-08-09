
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

interface MissionFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    task?: Task | null;
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
  typeTache: "",
  typeVehicule: "",
  immatriculation: "",
  remarque: "",
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


export function MissionFormDialog({ isOpen, onOpenChange, task: editingTask }: MissionFormDialogProps) {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  
  const { cities } = useCityStore();
  const { managers } = useManagerStore();
  const { missionTypes } = useMissionTypeStore();

  const [formState, setFormState] = useState(initialFormState);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  useEffect(() => {
    if (editingTask) {
      setFormState({
        date: editingTask.date || "",
        reservation: editingTask.reservation || "",
        ville: editingTask.city || "",
        entreprise: editingTask.entreprise || "",
        gestionnaire: editingTask.gestionnaire || "",
        typeTache: editingTask.typeTache || "",
        typeVehicule: editingTask.typeVehicule || "",
        immatriculation: editingTask.immatriculation || "",
        remarque: editingTask.remarque || "",
        label: editingTask.label || "",
        expenses: editingTask.expenses || [],
      });
    } else {
      setFormState(initialFormState);
    }
  }, [editingTask, isOpen]);

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
    const taskData = {
        label: formState.typeTache || 'Nouvelle mission',
        city: formState.ville,
        date: formState.date,
        reservation: formState.reservation,
        entreprise: formState.entreprise,
        gestionnaire: formState.gestionnaire,
        typeTache: formState.typeTache,
        typeVehicule: formState.typeVehicule,
        immatriculation: formState.immatriculation,
        remarque: formState.remarque,
        expenses: formState.expenses,
    };

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
       <DialogContent className="sm:max-w-2xl">
         <DialogHeader>
           <DialogTitle>{editingTask ? "Modifier la mission" : "Ajouter une mission"}</DialogTitle>
           <DialogDescription>
             {editingTask ? "Mettez à jour les détails de la mission." : "Remplissez les détails de la nouvelle mission ci-dessous."}
           </DialogDescription>
         </DialogHeader>
         <ScrollArea className="max-h-[70vh] p-4">
          <div className="grid gap-6 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={formState.date} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="reservation">Réservation</Label>
                    <Input id="reservation" value={formState.reservation} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="ville">Ville</Label>
                     <Select value={formState.ville} onValueChange={(value) => handleSelectChange('ville', value)}>
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
                <div className="grid gap-2">
                    <Label htmlFor="typeTache">Types de Mission</Label>
                     <Select value={formState.typeTache} onValueChange={(value) => handleSelectChange('typeTache', value)}>
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
                    <Label htmlFor="typeVehicule">Type de véhicule</Label>
                    <Input id="typeVehicule" value={formState.typeVehicule} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="immatriculation">Immatriculation</Label>
                    <Input id="immatriculation" value={formState.immatriculation} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="remarque">Remarque</Label>
                  <Textarea id="remarque" value={formState.remarque} onChange={handleInputChange} />
              </div>

              {formState.expenses.length > 0 && (
                <div className="grid gap-2">
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
         <DialogFooter className="sm:justify-between gap-2">
           <Button type="button" variant="secondary" onClick={() => setIsExpenseDialogOpen(true)}>Ajouter des frais</Button>
           <Button type="submit" onClick={handleSave}>Enregistrer</Button>
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
