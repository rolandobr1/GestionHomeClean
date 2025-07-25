
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, CircleDollarSign, FlaskConical, AlertTriangle, PlusCircle, Clock, Wallet } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useAppData } from '@/hooks/use-app-data';
import type { Income, Expense, Product, Payment } from '@/components/app-provider';
import { subMonths, format, getMonth, getYear, startOfMonth, endOfMonth, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { IncomeForm } from '@/components/income-form';
import { ExpenseForm } from '@/components/expense-form';

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Egresos",
    color: "hsl(var(--chart-2))",
  },
} as const;

type IncomeTransaction = Income & { type: 'income' };
type ExpenseTransaction = Expense & { type: 'expense' };
type PaymentTransaction = {
    type: 'payment';
    id: string;
    parent: Income;
    payment: Payment;
};
type ExpensePaymentTransaction = {
    type: 'expense_payment';
    id: string;
    parent: Expense;
    payment: Payment;
};
type Transaction = IncomeTransaction | ExpenseTransaction | PaymentTransaction | ExpensePaymentTransaction;


export default function DashboardPage({ params, searchParams }: { params: any; searchParams: any; }) {
  const { incomes, expenses, products, clients, suppliers } = useAppData();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addIncome, addExpense } = useAppData();
  
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [accountsReceivable, setAccountsReceivable] = useState({ total: 0, count: 0 });
  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<{ month: string, income: number, expense: number }[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);
    
    const currentMonthIncome = incomes
      .filter(i => {
        const incomeDate = new Date(i.date + "T00:00:00");
        return incomeDate >= firstDayOfMonth && incomeDate <= lastDayOfMonth;
      })
      .reduce((acc, income) => acc + income.totalAmount, 0);
    setTotalIncome(currentMonthIncome);

    const receivableIncomes = incomes.filter(i => i.balance > 0.01);
    const arTotal = receivableIncomes.reduce((acc, income) => acc + income.balance, 0);
    setAccountsReceivable({ total: arTotal, count: receivableIncomes.length });

    const currentMonthExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date + "T00:00:00");
        return expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth;
      })
      .reduce((acc, expense) => acc + expense.amount, 0);
    setTotalExpenses(currentMonthExpenses);

    const monthlyData: { [key: string]: { income: number, expense: number } } = {};
    const monthLabels: { [key: string]: string } = {};

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(today, i);
      const year = getYear(d);
      const month = getMonth(d);
      const key = `${year}-${month}`;
      monthlyData[key] = { income: 0, expense: 0 };
      monthLabels[key] = format(d, 'MMM', { locale: es });
    }

    incomes.forEach(income => {
      const incomeDate = new Date(income.date + "T00:00:00");
      const year = getYear(incomeDate);
      const month = getMonth(incomeDate);
      const key = `${year}-${month}`;
      if (monthlyData[key]) {
        monthlyData[key].income += income.totalAmount;
      }
    });

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date + "T00:00:00");
      const year = getYear(expenseDate);
      const month = getMonth(expenseDate);
      const key = `${year}-${month}`;
      if (monthlyData[key]) {
        monthlyData[key].expense += expense.amount;
      }
    });
    
    const formattedChartData = Object.keys(monthLabels).map(key => ({
      month: monthLabels[key].charAt(0).toUpperCase() + monthLabels[key].slice(1),
      ...monthlyData[key],
    }));

    setChartData(formattedChartData);

    const calculatedInventoryValue = products.reduce((acc, product) => acc + (product.salePriceWholesale * product.stock), 0);
    setInventoryValue(calculatedInventoryValue);
    
    const lowStock = products.filter(p => p.stock <= p.reorderLevel);
    setLowStockItems(lowStock);
    
    const incomeTransactions: IncomeTransaction[] = incomes.map(i => ({ ...i, type: 'income' }));
    const expenseTransactions: ExpenseTransaction[] = expenses.map(e => ({ ...e, type: 'expense' }));
    
    const incomePaymentTransactions: PaymentTransaction[] = incomes.flatMap(income => 
        (income.payments || []).map(payment => ({
            type: 'payment' as const,
            id: `${income.id}-${payment.id}`,
            parent: income,
            payment: payment
        }))
    );

    const expensePaymentTransactions: ExpensePaymentTransaction[] = expenses.flatMap(expense => 
        (expense.payments || []).map(payment => ({
            type: 'expense_payment' as const,
            id: `${expense.id}-${payment.id}`,
            parent: expense,
            payment: payment
        }))
    );

    const combinedTransactions: Transaction[] = [
        ...incomeTransactions,
        ...expenseTransactions,
        ...incomePaymentTransactions,
        ...expensePaymentTransactions,
    ];

    const getSortableDate = (tx: Transaction): Date => {
        let paymentObject: Payment | undefined;
        let mainObject: Income | Expense | undefined;

        switch(tx.type) {
            case 'payment':
                paymentObject = tx.payment;
                break;
            case 'expense_payment':
                paymentObject = tx.payment;
                break;
            case 'income':
            case 'expense':
                mainObject = tx;
                break;
        }

        if (paymentObject) {
            if (paymentObject.createdAt && typeof paymentObject.createdAt.toDate === 'function') {
                return paymentObject.createdAt.toDate();
            }
            // Fallback for payments without createdAt
            return new Date(paymentObject.date + 'T23:59:58');
        }
        
        if (mainObject) {
            if (mainObject.createdAt && typeof mainObject.createdAt.toDate === 'function') {
                return mainObject.createdAt.toDate();
            }
            // Fallback for main transactions without createdAt
            return new Date(mainObject.date + 'T23:59:59');
        }
        
        return new Date(); // Should not happen
    };
    
    const sortedTransactions = combinedTransactions.sort((a, b) => {
        return getSortableDate(b).getTime() - getSortableDate(a).getTime();
    });
    
    setRecentTransactions(sortedTransactions.slice(0, 5));

  }, [incomes, expenses, products]);

  const allClients = useMemo(() => [
    { id: 'generic', name: 'Cliente Genérico', code: 'CLI-000', email: '', phone: '', address: '' },
    ...clients
  ], [clients]);
  
  const allSuppliers = useMemo(() => [
    { id: 'generic', name: 'Suplidor Genérico', code: 'SUP-000', email: '', phone: '', address: '' },
    ...suppliers
  ], [suppliers]);


  const handleSaveIncome = async (incomeData: Omit<Income, 'id' | 'balance' | 'payments' | 'recordedBy'>) => {
    if (!user) {
        toast({ title: "Error", description: "No se ha identificado al usuario.", variant: "destructive"});
        return;
    }
    try {
        await addIncome({ ...incomeData, recordedBy: user.name });
        toast({
            title: "Ingreso Registrado",
            description: `Se ha añadido un ingreso por RD$${incomeData.totalAmount.toFixed(2)}.`,
        });
        setIsIncomeDialogOpen(false);
    } catch (error: any) {
         toast({ title: "Error al registrar ingreso", description: error.message, variant: "destructive"});
    }
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, 'id' | 'balance' | 'payments' | 'recordedBy'>) => {
    if (!user) {
        toast({ title: "Error", description: "No se ha identificado al usuario.", variant: "destructive"});
        return;
    }
    try {
        await addExpense({ ...expenseData, recordedBy: user.name });
        toast({
            title: "Egreso Registrado",
            description: `Se ha añadido un egreso por RD$${expenseData.amount.toFixed(2)}.`,
        });
        setIsExpenseDialogOpen(false);
    } catch (error: any) {
        toast({ title: "Error al registrar egreso", description: error.message, variant: "destructive"});
    }
  };


  return (
    <div className="flex flex-col gap-6">
       <div className="flex w-full items-center gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-primary-foreground"
              onClick={() => setIsIncomeDialogOpen(true)}
            >
                <PlusCircle className="mr-2 h-5 w-5"/>
                Ingreso
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => setIsExpenseDialogOpen(true)}
            >
                <PlusCircle className="mr-2 h-5 w-5"/>
                Egreso
            </Button>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card onClick={() => router.push('/dashboard/registros/ingresos')} className="cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">RD${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de ingresos este mes</p>
          </CardContent>
        </Card>
        <Card onClick={() => router.push('/dashboard/registros/egresos')} className="cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos (Mes)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">RD${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de egresos este mes</p>
          </CardContent>
        </Card>
        <Card onClick={() => router.push('/dashboard/inventario/productos')} className="cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">RD${inventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor a precio por mayor</p>
          </CardContent>
        </Card>
        <Card onClick={() => router.push('/dashboard/cuentas/por-cobrar')} className="cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">RD${accountsReceivable.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{accountsReceivable.count} cuentas pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Rendimiento Financiero</CardTitle>
            <CardDescription>Ingresos vs. Egresos en los últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `RD$${Number(value) / 1000}k`}
                  />
                  <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="var(--color-income)"
                    fillOpacity={1} 
                    fill="url(#colorIncome)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="var(--color-expense)"
                    fillOpacity={1} 
                    fill="url(#colorExpense)"
                    strokeWidth={2}
                  />
                </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="min-w-0">
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
                    <TableHead className="text-right hidden sm:table-cell">Nivel de Reorden</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lowStockItems.map((item) => (
                    <TableRow key={item.sku}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">
                            <Badge variant="destructive">{item.stock} {item.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{item.reorderLevel} {item.unit}</TableCell>
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
      
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5"/> Actividad Reciente
              </CardTitle>
              <CardDescription>Últimas transacciones registradas en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
              {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                      {recentTransactions.map(tx => {
                        if (tx.type === 'payment') {
                            const client = allClients.find(c => c.id === tx.parent.clientId);
                            return (
                                <div key={tx.id} className="flex items-center">
                                    <Wallet className="h-6 w-6 text-green-500" />
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Abono de {client?.name || 'Cliente Genérico'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Factura {tx.parent.id.slice(-6).toUpperCase()} &middot; {tx.payment.createdAt?.toDate ? formatDistanceToNow(tx.payment.createdAt.toDate(), { addSuffix: true, locale: es }) : format(new Date(tx.payment.date + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-green-600">
                                        +RD${tx.payment.amount.toFixed(2)}
                                    </div>
                                </div>
                            )
                        }

                        if (tx.type === 'expense_payment') {
                            const supplier = allSuppliers.find(s => s.id === tx.parent.supplierId);
                            return (
                                <div key={tx.id} className="flex items-center">
                                    <Wallet className="h-6 w-6 text-red-500" />
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Pago a {supplier?.name || 'Suplidor Genérico'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Egreso {tx.parent.id.slice(-6).toUpperCase()} &middot; {tx.payment.createdAt?.toDate ? formatDistanceToNow(tx.payment.createdAt.toDate(), { addSuffix: true, locale: es }) : format(new Date(tx.payment.date + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-red-600">
                                        -RD${tx.payment.amount.toFixed(2)}
                                    </div>
                                </div>
                            )
                        }

                        const isIncome = tx.type === 'income';
                        return (
                          <div key={tx.id} className="flex items-center">
                              {isIncome ? (
                                  <ArrowUpCircle className="h-6 w-6 text-green-500" />
                              ) : (
                                  <ArrowDownCircle className="h-6 w-6 text-red-500" />
                              )}
                              <div className="ml-4 space-y-1">
                                  <p className="text-sm font-medium leading-none">
                                      {isIncome ? allClients.find(c => c.id === tx.clientId)?.name || 'Venta a Cliente Genérico' : tx.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                      {tx.createdAt?.toDate ? formatDistanceToNow(tx.createdAt.toDate(), { addSuffix: true, locale: es }) : format(new Date(tx.date + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
                                  </p>
                              </div>
                              <div className={`ml-auto font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                  {isIncome ? '+' : '-'}RD${(isIncome ? tx.totalAmount : tx.amount).toFixed(2)}
                              </div>
                          </div>
                        )
                      })}
                  </div>
              ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay transacciones recientes.</p>
              )}
          </CardContent>
      </Card>

      <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Añadir Ingreso</DialogTitle>
                  <DialogDescription>
                      Añade un nuevo ingreso a tus registros.
                  </DialogDescription>
              </DialogHeader>
              <IncomeForm onSave={handleSaveIncome} onClose={() => setIsIncomeDialogOpen(false)} />
          </DialogContent>
      </Dialog>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Añadir Egreso</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo egreso a tus registros.
                  </DialogDescription>
              </DialogHeader>
              <ExpenseForm onSave={handleSaveExpense} onClose={() => setIsExpenseDialogOpen(false)} />
          </DialogContent>
      </Dialog>
    </div>
  );
}
