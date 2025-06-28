import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CircleDollarSign } from "lucide-react";

export default function CuentasPage() {
  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <CircleDollarSign className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4">Cuentas por Cobrar</CardTitle>
          <CardDescription>Esta sección está en construcción.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrás gestionar las deudas de tus clientes, marcar pagos y ver estados de cuenta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
