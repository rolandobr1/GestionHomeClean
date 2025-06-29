import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <img src="/logohomeclean.png" alt="QuimioGest Logo" width="120" height="40" className="object-contain" />
          <span className="sr-only">QuimioGest</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="space-y-4 max-w-2xl flex flex-col items-center">
          <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
            Gestión de Inventario y Finanzas
          </div>
          <img src="/logohomeclean.png" alt="QuimioGest Logo" width="300" height="100" className="object-contain" />
          <p className="text-lg text-muted-foreground md:text-xl">
            La solución todo-en-uno para administrar eficientemente tu negocio de productos químicos. Controla tu inventario, ingresos, egresos y cuentas por cobrar desde un solo lugar.
          </p>
        </div>
        <div className="flex flex-col gap-4 min-[400px]:flex-row mt-8">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <LogIn className="mr-2 h-5 w-5" />
              Entrar al Dashboard
            </Link>
          </Button>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 QuimioGest. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
