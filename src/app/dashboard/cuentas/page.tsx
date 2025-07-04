
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

export default function CuentasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.includes("/por-pagar") ? "por-pagar" : "por-cobrar";

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/cuentas/${value}`);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Cuentas</h1>
        <p className="text-muted-foreground">
          Administra tus cuentas por cobrar y por pagar.
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="por-cobrar">Cuentas por Cobrar</TabsTrigger>
          <TabsTrigger value="por-pagar">Cuentas por Pagar</TabsTrigger>
        </TabsList>
        <div className="mt-4">
            {children}
        </div>
      </Tabs>
    </div>
  );
}

    