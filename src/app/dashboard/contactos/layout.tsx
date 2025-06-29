"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

export default function ContactosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.includes("/suplidores") ? "suplidores" : "clientes";

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/contactos/${value}`);
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Gestión de Contactos</h1>
            <p className="text-muted-foreground">Administra tus clientes y suplidores.</p>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="clientes">Clientes</TabsTrigger>
                <TabsTrigger value="suplidores">Suplidores</TabsTrigger>
            </TabsList>
        </Tabs>
        <div className="pt-4">
            {children}
        </div>
    </div>
  );
}
