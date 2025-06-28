import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowDownCircle } from "lucide-react";

export default function EgresosPage() {
  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <ArrowDownCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4">Gestión de Egresos</CardTitle>
          <CardDescription>Esta sección está en construcción.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrás registrar, ver, editar y eliminar todos tus gastos y compras.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
