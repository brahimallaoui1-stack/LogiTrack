
"use client";

import { useState, useEffect, useMemo } from "react";
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
import type { Task, Expense, SubMission, ExpenseStatus } from "@/lib/types";
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
  onSave: (expense: Omit<Expense, 'id' | 'status' | 'typeDepense'> & { typeDepense?: string }) => void;
}

const initialSubMissionState: Omit<SubMission, 'id'> = {
  date: "",
  reservation: "",
  city: "",
  entreprise: "",
  gestionnaire: "",
  typeMission: "",
  marqueVehicule: "",
  immatriculation: "",
  remarque: "",
};


const initialFormState: Omit<Task, 'id' | 'label' | 'city'> & { city: string } = {
  city: "",
  date: "",
  reservation: "",
  entreprise: "",
  gestionnaire: "",
  typeMission: "",
  marqueVehicule: "",
  immatriculation: "",
  remarque: "",
  subMissions: [{...initialSubMissionState, id: `sub-${Date.now()}`}],
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
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full sm:w-auto">Terminé</Button>
          <Button onClick={handleAddExpense} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2"/>
            Ajouter la dépense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function MissionFormDialog({ isOpen, onOpenChange, task: editingTask, prefilledCity }: MissionFormDialogProps) {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  
  const { cities, fetchCities } = useCityStore();
  const { managers, fetchManagers } = useManagerStore();
  const { missionTypes, fetchMissionTypes } = useMissionTypeStore();

  const [formState, setFormState] = useState(initialFormState);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  const isCasablancaMission = useMemo(() => prefilledCity === 'Casablanca', [prefilledCity]);

   const availableCities = useMemo(() => {
    if (prefilledCity === 'Casablanca') {
      return cities;
    }
    return cities.filter(city => city.name !== 'Casablanca');
  }, [cities, prefilledCity]);

  const generatedLabel = useMemo(() => {
    if (isCasablancaMission) {
      return formState.typeMission || '';
    } else {
       const missionTypes = formState.subMissions?.map(sub => sub.typeMission).filter(Boolean) || [];
       const uniqueMissionTypes = [...new Set(missionTypes)];
       return uniqueMissionTypes.join(' / ');
    }
  }, [isCasablancaMission, formState.typeMission, formState.subMissions]);

  useEffect(() => {
    fetchCities();
    fetchManagers();
    fetchMissionTypes();
  }, [fetchCities, fetchManagers, fetchMissionTypes]);

  useEffect(() => {
    if (isOpen) {
        if (editingTask) {
           setFormState({
            city: editingTask.city || "",
            date: editingTask.date || "",
            reservation: editingTask.reservation || "",
            entreprise: editingTask.entreprise || "",
            gestionnaire: editingTask.gestionnaire || "",
            typeMission: editingTask.typeMission || "",
            marqueVehicule: editingTask.marqueVehicule || "",
            immatriculation: editingTask.immatriculation || "",
            remarque: editingTask.remarque || "",
            subMissions: editingTask.subMissions && editingTask.subMissions.length > 0 ? editingTask.subMissions : [{...initialSubMissionState, id: `sub-${Date.now()}`}],
            expenses: editingTask.expenses || [],
          });
        } else {
            const cityValue = prefilledCity === 'Casablanca' ? 'Casablanca' : '';
            setFormState({...initialFormState, city: cityValue });
        }
    } else {
         setFormState(initialFormState);
    }
  }, [editingTask, isOpen, prefilledCity]);
  
 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index?: number) => {
    const { id, value } = e.target;
     if (isCasablancaMission) {
       setFormState(prevState => ({ ...prevState, [id]: value }));
    } else if (typeof index === 'number') {
      setFormState(prevState => {
        const newSubMissions = [...(prevState.subMissions ?? [])];
        newSubMissions[index] = { ...newSubMissions[index], [id]: value };
        return { ...prevState, subMissions: newSubMissions };
      });
    } else {
         setFormState(prevState => ({ ...prevState, [id]: value }));
    }
  };

  const handleSelectChange = (id: string, value: string, index?: number) => {
     if (isCasablancaMission) {
       setFormState(prevState => ({ ...prevState, [id]: value }));
    } else if (typeof index === 'number') {
       setFormState(prevState => {
        const newSubMissions = [...(prevState.subMissions ?? [])];
        newSubMissions[index] = { ...newSubMissions[index], [id]: value };
        return { ...prevState, subMissions: newSubMissions };
      });
    } else {
       setFormState(prevState => ({ ...prevState, [id]: value }));
    }
  };
  
  const addSubMission = () => {
    setFormState(prevState => ({
      ...prevState,
      subMissions: [...(prevState.subMissions ?? []), {...initialSubMissionState, id: `sub-${Date.now()}`}]
    }));
  };

  const removeSubMission = (index: number) => {
    setFormState(prevState => ({
      ...prevState,
      subMissions: prevState.subMissions?.filter((_, i) => i !== index)
    }));
  };


  const handleSaveExpense = (expense: Omit<Expense, 'id' | 'status'>) => {
    const newExpense: Expense = { 
      ...expense, 
      id: `expense-${Date.now()}-${Math.random()}`,
      status: 'Sans compte' ,
      typeDepense: expense.typeDepense || 'Non spécifié'
    };
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
      label: generatedLabel,
      city: isCasablancaMission ? 'Casablanca' : 'Hors Casablanca',
    };
  
    if (isCasablancaMission) {
      taskData.date = formState.date;
      taskData.reservation = formState.reservation;
      taskData.entreprise = formState.entreprise;
      taskData.gestionnaire = formState.gestionnaire;
      taskData.typeMission = formState.typeMission;
      taskData.marqueVehicule = formState.marqueVehicule;
      taskData.immatriculation = formState.immatriculation;
      taskData.remarque = formState.remarque;
      taskData.subMissions = [];
      taskData.expenses = [];
    } else {
      taskData.subMissions = formState.subMissions;
      taskData.expenses = formState.expenses;
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
      maximumFractionDigits: 0,
    }).format(amount) + ' MAD';
  };
  
  const renderSubMissionForm = (subMission: SubMission, index: number) => (
     <div key={subMission.id} className="grid gap-6 py-4 border-b pb-8 mb-4 relative">
        { (formState.subMissions?.length ?? 0) > 1 &&
            <div className="flex justify-between items-center">
                 <h4 className="font-semibold text-lg">Étape {index + 1}</h4>
                 <Button variant="ghost" size="icon" onClick={() => removeSubMission(index)} className="text-destructive">
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
        }
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`date-${index}`}>Date</Label>
                <Input id="date" type="date" value={subMission.date} onChange={(e) => handleInputChange(e, index)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`reservation-${index}`}>Réservation</Label>
                <Input id="reservation" value={subMission.reservation} onChange={(e) => handleInputChange(e, index)} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor={`typeMission-${index}`}>Types de Mission</Label>
                 <Select value={subMission.typeMission} onValueChange={(value) => handleSelectChange('typeMission', value, index)}>
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
                <Label htmlFor={`city-${index}`}>Ville</Label>
                 <Select value={subMission.city} onValueChange={(value) => handleSelectChange('city', value, index)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableCities.map(city => (
                            <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`entreprise-${index}`}>Client</Label>
                <Input id="entreprise" value={subMission.entreprise} onChange={(e) => handleInputChange(e, index)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`gestionnaire-${index}`}>Gestionnaire</Label>
                 <Select value={subMission.gestionnaire} onValueChange={(value) => handleSelectChange('gestionnaire', value, index)}>
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
        
        <h4 className="font-semibold text-lg">Informations sur le véhicule</h4>
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`marqueVehicule-${index}`}>Marque de véhicule</Label>
                <Input id="marqueVehicule" value={subMission.marqueVehicule} onChange={(e) => handleInputChange(e, index)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`immatriculation-${index}`}>Immatriculation</Label>
                <Input id="immatriculation" value={subMission.immatriculation} onChange={(e) => handleInputChange(e, index)} />
            </div>
        </div>
         <div className="grid gap-2">
              <Label htmlFor={`remarque-${index}`}>Remarque</Label>
              <Textarea id="remarque" value={subMission.remarque} onChange={(e) => handleInputChange(e, index)} />
          </div>
     </div>
  );

  return (
     <>
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-2xl md:max-w-4xl">
         <DialogHeader>
           <DialogTitle>{editingTask ? "Modifier la mission" : "Ajouter une mission"}</DialogTitle>
           <DialogDescription>
             {editingTask ? "Mettez à jour les détails de la mission." : "Remplissez les détails de la nouvelle mission ci-dessous."}
           </DialogDescription>
         </DialogHeader>
         <ScrollArea className="max-h-[70vh] p-4">
          <div className="grid gap-2">
              <Label htmlFor="label">Libellé de la mission</Label>
              <Input id="label" value={generatedLabel} disabled placeholder={isCasablancaMission ? 'Ex: Livraison' : 'Ex: Livraison / Récupération'}/>
          </div>

          <Separator className="my-6"/>

          {isCasablancaMission ? (
             <div className="grid gap-6 py-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                     <Input id="ville" value="Casablanca" disabled />
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
            
            <div className="grid gap-4">
                <h3 className="font-semibold text-lg">Informations sur le véhicule</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="marqueVehicule">Marque de véhicule</Label>
                        <Input id="marqueVehicule" value={formState.marqueVehicule} onChange={handleInputChange} />
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
             </div>
            </div>
          ) : (
            <>
                {formState.subMissions?.map((sub, index) => renderSubMissionForm(sub, index))}
                
                <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={addSubMission}>
                        <Plus className="h-4 w-4 mr-2"/>
                        Ajouter une étape
                    </Button>
                </div>

                 <Separator className="my-6"/>
                <div className="grid gap-4 pt-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <Label className="text-lg font-semibold">Dépenses</Label>
                         <Button type="button" variant="secondary" onClick={() => setIsExpenseDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter des dépenses
                        </Button>
                    </div>

                    {formState.expenses.length > 0 && (
                        <>
                        <div className="rounded-md border mt-4 overflow-x-auto">
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
                                            <TableCell>{formatCurrency(expense.montant)}</TableCell>
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
                            Total des dépenses: {formatCurrency(totalExpenses)}
                        </div>
                        </>
                    )}
                </div>
            </>
          )}

        </ScrollArea>
         <DialogFooter className="pt-4 border-t">
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
           <Button type="submit" onClick={() => handleSave()}>Enregistrer</Button>
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
