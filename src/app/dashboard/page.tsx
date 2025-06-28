import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, CircleDollarSign, FlaskConical, AlertTriangle } from "lucide-react";

const chartData = [
  { month: "Ene", income: 1860, expense: 800 },
  { month: "Feb", income: 3050, expense: 2000 },
  { month: "Mar", income: 2370, expense: 1200 },
  { month: "Abr", income: 730, expense: 1900 },
  { month: "May", income: 2090, expense: 1300 },
  { month: "Jun", income: 2140, expense: 1100 },
];

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Egresos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const lowStockItems = [
    { name: "Ácido Sulfúrico", sku: "AS-001", stock: 5, reorderLevel: 10, unit: "Litros" },
    { name: "Sosa Cáustica", sku: "SC-002", stock: 8, reorderLevel: 15, unit: "Kg" },
    { name: "Cloro Granulado", sku: "CG-003", stock: 12, reorderLevel: 20, unit: "Kg" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos (Mes)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,105.43</div>
            <p className="text-xs text-muted-foreground">+5.2% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$89,540.00</div>
            <p className="text-xs text-muted-foreground">Valor de costo total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,750.50</div>
            <p className="text-xs text-muted-foreground">5 cuentas pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento Financiero</CardTitle>
            <CardDescription>Ingresos vs. Egresos en los últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                  </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-accent h-5 w-5"/> Alertas de Inventario
            </CardTitle>
            <CardDescription>Productos con bajo nivel de stock que requieren atención.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Nivel de Reorden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant="destructive">{item.stock} {item.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.reorderLevel} {item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
