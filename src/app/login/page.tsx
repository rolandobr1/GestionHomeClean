"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, isConfigured, firebaseConfig } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical } from "lucide-react";
import { FirebaseConfigStatus } from "@/components/config-status";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth!, email, password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo a QuimioGest.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      let description = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          description = "Credenciales incorrectas. Por favor, verifica tu correo y contraseña.";
          break;
        case "auth/invalid-api-key":
          description = "La clave de API de Firebase no es válida. Revisa tus credenciales en el archivo .env.local.";
          break;
        case "auth/configuration-not-found":
          description = "La configuración de Firebase no se encontró. Asegúrate de que tu archivo .env.local esté completo y reinicia el servidor.";
          break;
        case "auth/network-request-failed":
          description = "Error de red. Por favor, comprueba tu conexión a internet.";
          break;
        default:
          console.error("Firebase login error:", error);
      }
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return <FirebaseConfigStatus config={firebaseConfig} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
           <div className="flex justify-center mb-4">
             <Link href="/" className="flex items-center gap-2">
                <FlaskConical className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-primary font-headline">QuimioGest</span>
             </Link>
           </div>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
