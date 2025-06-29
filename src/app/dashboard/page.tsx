"use client";

import React, { useState, useEffect } from 'react';
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
import { initialProducts } from './inventario/productos/page';
import { useFinancialData } from '@/hooks/use-financial-data';
import type { Income, Expense } from '@/components/financial-provider';

const chartData: { month: string, income: number, expense: number }[] = [];

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

const lowStockItems: { name: string, sku: string, stock: number, reorderLevel: number, unit: string }[] = [];

type Client = {
  id: string;
  name: string;
};
const initialClients: Client[] = [
  { id: '1', name: 'Laboratorios Alfa' },
  { id: '2', name: 'Farmacia San José' },
  { id: '3', name: 'Industrias del Caribe' },
];
const allClients = [
    { id: 'generic', name: 'Cliente Genérico' },
    ...initialClients
];

const IncomeForm = ({ onSave }: { onSave: (income: Omit<Income, 'id'>) => void }) => {
    const [formData, setFormData] = useState({
        amount: 0, date: new Date().toISOString().split('T')[0], category: 'Venta de Producto',
        clientId: 'generic', paymentMethod: 'contado' as 'credito' | 'contado', productId: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (field: keyof typeof formData) => (value: string) => {
        if (field === 'productId') {
            const product = initialProducts.find(p => p.id === value);
            setFormData(prev => ({
                ...prev,
                productId: value,
                amount: product ? product.salePrice : 0
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="productId" className="text-right">Producto</Label>
                    <Select onValueChange={handleSelectChange('productId')} defaultValue={formData.productId} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                        <SelectContent>
                            {initialProducts.map(product => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clientId" className="text-right">Cliente</Label>
                    <Select onValueChange={handleSelectChange('clientId')} defaultValue={formData.clientId}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {allClients.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentMethod" className="text-right">Método Pago</Label>
                    <Select onValueChange={handleSelectChange('paymentMethod')} defaultValue={formData.paymentMethod}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona un método" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="contado">Contado</SelectItem>
                            <SelectItem value="credito">Crédito</SelectItem>
                        </SelectContent>
                    </Select>
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
                    <Select onValueChange={handleSelectChange('category')} defaultValue={formData.category}>
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

const ExpenseForm = ({ onSave }: { onSave: (expense: Omit<Expense, 'id'>) => void }) => {
    const [formData, setFormData] = useState({
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
        onSave(formData);
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
  const { incomes, expenses, addIncome, addExpense } = useFinancialData();

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const today = new Date();
    const currentMonthIncome = incomes
      .filter(i => {
        const incomeDate = new Date(i.date);
        return incomeDate.getUTCMonth() === today.getUTCMonth() && incomeDate.getUTCFullYear() === today.getUTCFullYear();
      })
      .reduce((acc, income) => acc + income.amount, 0);
    setTotalIncome(currentMonthIncome);
  }, [incomes]);

  useEffect(() => {
    const today = new Date();
    const currentMonthExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getUTCMonth() === today.getUTCMonth() && expenseDate.getUTCFullYear() === today.getUTCFullYear();
      })
      .reduce((acc, expense) => acc + expense.amount, 0);
    setTotalExpenses(currentMonthExpenses);
  }, [expenses]);

  const handleIncomeSave = (income: Omit<Income, 'id'>) => {
      addIncome(income);
      setIsIncomeDialogOpen(false);
      toast({
          title: "Ingreso Registrado",
          description: `Se ha añadido un ingreso por RD$${income.amount.toFixed(2)}.`,
      });
  };

  const handleExpenseSave = (expense: Omit<Expense, 'id'>) => {
      addExpense(expense);
      setIsExpenseDialogOpen(false);
      toast({
          title: "Egreso Registrado",
          description: `Se ha añadido un egreso por RD$${expense.amount.toFixed(2)}.`,
      });
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground"
              onClick={() => setIsIncomeDialogOpen(true)}
            >
                <PlusCircle className="mr-2 h-5 w-5"/>
                Registrar Ingreso
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="w-full"
              onClick={() => setIsExpenseDialogOpen(true)}
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
            <div className="text-2xl font-bold">RD${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de ingresos este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos (Mes)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de egresos este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$0.00</div>
            <p className="text-xs text-muted-foreground">Valor de costo total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$0.00</div>
            <p className="text-xs text-muted-foreground">0 cuentas pendientes</p>
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
            {lowStockItems.length > 0 ? (
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
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay alertas de inventario.</p>
            )}
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
              <IncomeForm onSave={handleIncomeSave} />
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
              <ExpenseForm onSave={handleExpenseSave} />
          </DialogContent>
      </Dialog>
    </div>
  );
}
