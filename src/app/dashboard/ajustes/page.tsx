import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileCog } from "lucide-react";

export default function AjustesPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Ajustes y Exportación</h1>
            <p className="text-muted-foreground">Gestiona tu cuenta y tus datos.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCog className="h-5 w-5"/>Exportar/Importar Datos</CardTitle>
                <CardDescription>Exporta tus registros a formato CSV o importa datos masivamente.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 flex flex-col items-center text-center gap-2">
                    <Download className="h-8 w-8 text-primary"/>
                    <h3 className="font-semibold">Exportar Datos</h3>
                    <p className="text-sm text-muted-foreground">Descarga tus ingresos, egresos, inventario y cuentas por cobrar.</p>
                    <Button variant="outline" className="mt-2">Exportar Todo (CSV)</Button>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center gap-2">
                    <Upload className="h-8 w-8 text-primary"/>
                    <h3 className="font-semibold">Importar Datos</h3>
                    <p className="text-sm text-muted-foreground">Sube un archivo CSV para añadir productos o registros en bloque.</p>
                    <Button variant="outline" className="mt-2">Importar Archivo (CSV)</Button>
                </Card>
            </CardContent>
        </Card>
    </div>
  );
}
