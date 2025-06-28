import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowUpCircle } from "lucide-react";

export default function IngresosPage() {
  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <ArrowUpCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4">Gestión de Ingresos</CardTitle>
          <CardDescription>Esta sección está en construcción.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrás registrar, ver, editar y eliminar todas tus ventas y transacciones de ingresos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
