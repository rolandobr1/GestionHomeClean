
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

export default function InventarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.includes("/materia-prima") ? "materia-prima" : "productos";

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/inventario/${value}`);
  };

  return (
    <div className="w-full space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Gestión de Inventario</h1>
            <p className="text-muted-foreground">Administra tus productos y materias primas.</p>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="productos">Productos Terminados</TabsTrigger>
                <TabsTrigger value="materia-prima">Materia Prima</TabsTrigger>
            </TabsList>
            <div className="mt-4">
                {children}
            </div>
        </Tabs>
    </div>
  );
}
