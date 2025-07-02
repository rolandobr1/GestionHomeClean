
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
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Contactos</h1>
        <p className="text-muted-foreground">
          Administra tus clientes y suplidores.
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="suplidores">Suplidores</TabsTrigger>
        </TabsList>
        <div className="mt-4">{children}</div>
      </Tabs>
    </div>
  );
}
