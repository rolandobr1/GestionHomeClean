"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, isConfigured } from "@/lib/firebase";

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
import { FlaskConical, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth!, email, password);
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      let description = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
      switch (error.code) {
        case "auth/email-already-in-use":
          description = "Este correo electrónico ya está en uso por otra cuenta.";
          break;
        case "auth/weak-password":
          description = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
          break;
        case "auth/invalid-api-key":
          description = "La clave de API de Firebase no es válida. Revisa tus credenciales en el archivo .env.local.";
          break;
        case "auth/network-request-failed":
            description = "Error de red. Por favor, comprueba tu conexión a internet.";
            break;
        case "auth/operation-not-allowed":
            description = "El registro por correo y contraseña no está habilitado en tu proyecto de Firebase.";
            break;
        default:
            console.error("Firebase signup error:", error);
      }
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
             <Card className="mx-auto max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-xl">Configuración Requerida</CardTitle>
                    <CardDescription>
                        La aplicación necesita conectarse a Firebase.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>¡Acción Requerida!</AlertTitle>
                        <AlertDescription>
                            <div className="space-y-2 mt-2">
                                <p>Sigue estos pasos para configurar la aplicación:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                                    <li>Copia tus credenciales del proyecto Firebase.</li>
                                    <li>Pégalas en el archivo <code>.env.local</code>.</li>
                                    <li>Guarda el archivo y <strong>reinicia el servidor</strong>.</li>
                                </ul>
                                <p className="text-xs text-muted-foreground pt-2">
                                    Consulta <code>firebase-instructions.md</code> para ver la guía detallada.
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
             </Card>
        </div>
    )
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
          <CardTitle className="text-xl">Regístrate</CardTitle>
          <CardDescription>
            Ingresa tu información para crear una cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
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
                <Label htmlFor="password">Contraseña</Label>
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
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline">
              Iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
