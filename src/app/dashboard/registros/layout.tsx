"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

export default function RegistrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.includes("/egresos") ? "egresos" : "ingresos";

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/registros/${value}`);
  };

  return (
    <div className="space-y-6 w-full">
        <div>
            <h1 className="text-2xl font-bold">Gestión de Registros</h1>
            <p className="text-muted-foreground">Administra tus ingresos y egresos.</p>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
                <TabsTrigger value="egresos">Egresos</TabsTrigger>
            </TabsList>
            <div className="pt-4">
                {children}
            </div>
        </Tabs>
    </div>
  );
}
