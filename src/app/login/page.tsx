
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp, error, isLoading } = useAuthStore();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
    // Only push if there's no error
    if (!error) {
       router.push("/");
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Briefcase className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="text-2xl">LogiTrack</CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Créez un compte pour commencer à suivre vos missions."
              : "Veuillez entrer vos identifiants pour accéder à votre espace."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@exemple.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>{isSignUp ? "Erreur d'inscription" : "Erreur de connexion"}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                    ? (isSignUp ? "Création du compte..." : "Connexion en cours...") 
                    : (isSignUp ? "S'inscrire" : "Se connecter")
                }
             </Button>
          </form>
        </CardContent>
         <CardFooter className="flex justify-center text-sm">
            <p>
              {isSignUp ? "Vous avez déjà un compte ?" : "Vous n'avez pas de compte ?"}
              <Button variant="link" onClick={toggleMode} className="p-1">
                {isSignUp ? "Se connecter" : "S'inscrire"}
              </Button>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
