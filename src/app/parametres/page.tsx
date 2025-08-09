import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ParametresPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres</CardTitle>
        <CardDescription>
          Gérez les paramètres de l'application à partir d'ici.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Veuillez sélectionner une catégorie de paramètres dans le menu latéral.</p>
      </CardContent>
    </Card>
  );
}
