"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
import { FirebaseConfigStatus } from "@/components/config-status";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [clientAuth, setClientAuth] = useState<{isConfigured: boolean; config: any} | null>(null);

  useEffect(() => {
    // This check runs only on the client to avoid hydration errors.
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const isConfigured = !!(config.apiKey && config.authDomain && config.projectId && config.storageBucket && config.messagingSenderId && config.appId);
    setClientAuth({ isConfigured, config });
  }, []);

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
        case "auth/configuration-not-found":
          description = "La configuración de Firebase es incorrecta. Por favor, revisa estos 3 puntos: 1) Las claves en .env.local son correctas. 2) Has reiniciado el servidor. 3) El proveedor de 'Correo/Contraseña' está HABILITADO en la consola de Firebase.";
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

  if (!clientAuth) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="mx-auto max-w-sm w-full p-6">
            <div className="flex flex-col space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-6 pt-4">
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                  <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </Card>
      </div>
    )
  }

  if (!clientAuth.isConfigured) {
    return <FirebaseConfigStatus config={clientAuth.config} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
           <div className="flex justify-center mb-4">
             <Link href="/" className="flex items-center gap-2">
                <img src="https://placehold.co/180x60.png" alt="QuimioGest Logo" width="180" height="60" className="object-contain" />
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
