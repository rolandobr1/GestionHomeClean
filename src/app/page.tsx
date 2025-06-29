"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export default function UserSelectionPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleSelectUser = (name: "Rolando" | "Mikel") => {
    login(name);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
       <header className="absolute top-0 px-4 lg:px-6 h-14 flex items-center w-full">
         <img src="/logohomeclean.png" alt="QuimioGest Logo" width="120" height="40" className="object-contain" />
         <span className="sr-only">QuimioGest</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="space-y-6 max-w-sm w-full">
            <h1 className="text-2xl font-bold">¿Quién está registrando?</h1>
            <p className="text-muted-foreground">
                Selecciona tu usuario para continuar.
            </p>
            <div className="flex flex-col gap-4">
                <Button size="lg" className="h-12 text-lg" onClick={() => handleSelectUser("Rolando")}>
                    <User className="mr-2 h-5 w-5" />
                    Rolando
                </Button>
                <Button size="lg" className="h-12 text-lg" onClick={() => handleSelectUser("Mikel")}>
                    <User className="mr-2 h-5 w-5" />
                    Mikel
                </Button>
            </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 QuimioGest. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
