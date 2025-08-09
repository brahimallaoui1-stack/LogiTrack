import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ParametresGestionnairesPage() {
  return (
    <Card>
      <div className="flex justify-between items-center p-6 pb-0">
        <CardHeader className="p-0">
          <CardTitle>Paramètres des Gestionnaires</CardTitle>
          <CardDescription>
            Gérez les paramètres des gestionnaires à partir d'ici.
          </CardDescription>
        </CardHeader>
        <Button>Ajouter</Button>
      </div>
      <CardContent>
        <p className="pt-6">Le contenu de la page des paramètres de gestionnaires sera bientôt disponible.</p>
      </CardContent>
    </Card>
  );
}
