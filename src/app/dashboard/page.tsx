"use client";

import React, { useState } from 'react';
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
import { ArrowUpCircle, ArrowDownCircle, CircleDollarSign, FlaskConical, AlertTriangle, PlusCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";

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

type Income = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
};

const IncomeForm = ({ income, onSave }: { income: Income | null, onSave: (income: Income) => void }) => {
    const [formData, setFormData] = useState(income || {
        description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Venta de Producto'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: income?.id || '' });
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Descripción</Label>
                    <Input id="description" value={formData.description} onChange={handleChange} className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Monto</Label>
                    <Input id="amount" type="number" value={formData.amount} onChange={handleChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Fecha</Label>
                    <Input id="date" type="date" value={formData.date} onChange={handleChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Categoría</Label>
                    <Select onValueChange={handleSelectChange} defaultValue={formData.category}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Venta de Producto">Venta de Producto</SelectItem>
                            <SelectItem value="Servicios">Servicios</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                     <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar</Button>
            </DialogFooter>
        </form>
    );
};

const ExpenseForm = ({ expense, onSave }: { expense: Expense | null, onSave: (expense: Expense) => void }) => {
    const [formData, setFormData] = useState(expense || {
        description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Compra de Material'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: expense?.id || '' });
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Descripción</Label>
                    <Input id="description" value={formData.description} onChange={handleChange} className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Monto</Label>
                    <Input id="amount" type="number" value={formData.amount} onChange={handleChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Fecha</Label>
                    <Input id="date" type="date" value={formData.date} onChange={handleChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Categoría</Label>
                    <Select onValueChange={handleSelectChange} defaultValue={formData.category}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Compra de Material">Compra de Material</SelectItem>
                            <SelectItem value="Salarios">Salarios</SelectItem>
                            <SelectItem value="Servicios Públicos">Servicios Públicos</SelectItem>
                            <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                     <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar</Button>
            </DialogFooter>
        </form>
    );
};


export default function DashboardPage() {
  const { toast } = useToast();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleIncomeSave = (income: Income) => {
      const newIncome = { ...income, id: new Date().toISOString() };
      setIncomes(prev => [...prev, newIncome]); // Although not displayed, we keep state consistent
      setEditingIncome(null);
      setIsIncomeDialogOpen(false);
      toast({
          title: "Ingreso Registrado",
          description: `Se ha añadido un ingreso por RD$${newIncome.amount.toFixed(2)}.`,
      });
  };

  const handleExpenseSave = (expense: Expense) => {
      const newExpense = { ...expense, id: new Date().toISOString() };
      setExpenses(prev => [...prev, newExpense]); // Although not displayed, we keep state consistent
      setEditingExpense(null);
      setIsExpenseDialogOpen(false);
      toast({
          title: "Egreso Registrado",
          description: `Se ha añadido un egreso por RD$${newExpense.amount.toFixed(2)}.`,
      });
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground"
              onClick={() => { setEditingIncome(null); setIsIncomeDialogOpen(true); }}
            >
                <PlusCircle className="mr-2 h-5 w-5"/>
                Registrar Ingreso
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="w-full"
              onClick={() => { setEditingExpense(null); setIsExpenseDialogOpen(true); }}
            >
                <PlusCircle className="mr-2 h-5 w-5"/>
                Registrar Egreso
            </Button>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos (Mes)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$12,105.43</div>
            <p className="text-xs text-muted-foreground">+5.2% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$89,540.00</div>
            <p className="text-xs text-muted-foreground">Valor de costo total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$8,750.50</div>
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

      <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Añadir Ingreso</DialogTitle>
                  <DialogDescription>
                      Añade un nuevo ingreso a tus registros.
                  </DialogDescription>
              </DialogHeader>
              <IncomeForm income={editingIncome} onSave={handleIncomeSave} />
          </DialogContent>
      </Dialog>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Añadir Egreso</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo egreso a tus registros.
                  </DialogDescription>
              </DialogHeader>
              <ExpenseForm expense={editingExpense} onSave={handleExpenseSave} />
          </DialogContent>
      </Dialog>
    </div>
  );
}
