
"use client";

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppData } from '@/hooks/use-app-data';
import { Scale, TrendingUp, TrendingDown, Wallet, Boxes, Landmark, Banknote, X, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subMonths, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const chartConfigBase = {
  value: {
    label: "Valor",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const SectionTitle = ({ title, tooltipText }: { title: string; tooltipText: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
);

const BalanceCard = ({ title, value, description, icon: Icon, isLoading, formatAsCurrency = true, colorBasedOnValue = false, onClick }: { title: string, value: number, description: string, icon: React.ElementType, isLoading: boolean, formatAsCurrency?: boolean, colorBasedOnValue?: boolean, onClick?: () => void }) => {
    const valueColorClass = colorBasedOnValue ? (value >= 0 ? 'text-green-600' : 'text-red-600') : '';
    
    return (
        <Card onClick={onClick} className={cn(onClick && 'cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-1" />
                    </>
                ) : (
                    <>
                        <div className={cn("text-2xl font-bold truncate", valueColorClass)}>
                            {formatAsCurrency ? `RD$${value.toFixed(2)}` : value}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
};


export default function BalancePage() {
    const { incomes, expenses, products, rawMaterials, loading } = useAppData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartConfig, setChartConfig] = useState<ChartConfig>(chartConfigBase);
    const [selectedMetric, setSelectedMetric] = useState<{ title: string; description: string; hasHistory: boolean; currentValue: number } | null>(null);

    const filteredData = useMemo(() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return { filteredIncomes: incomes, filteredExpenses: expenses };
        }

        const fromDate = dateRange.from ? new Date(dateRange.from.setHours(0,0,0,0)) : null;
        const toDate = dateRange.to ? new Date(dateRange.to.setHours(23,59,59,999)) : null;

        const filteredIncomes = incomes.filter(i => {
            const incomeDate = new Date(i.date + 'T00:00:00');
            if (fromDate && incomeDate < fromDate) return false;
            if (toDate && incomeDate > toDate) return false;
            return true;
        });

        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date + 'T00:00:00');
            if (fromDate && expenseDate < fromDate) return false;
            if (toDate && expenseDate > toDate) return false;
            return true;
        });

        return { filteredIncomes, filteredExpenses };

    }, [incomes, expenses, dateRange]);

    const summaryData = useMemo(() => {
        const { filteredIncomes, filteredExpenses } = filteredData;
        
        const totalIncome = filteredIncomes.reduce((acc, income) => acc + income.totalAmount, 0);
        const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
        const netBalance = totalIncome - totalExpenses;
        
        const productsValue = products.reduce((acc, product) => acc + (product.salePriceWholesale * product.stock), 0);
        const rawMaterialsValue = rawMaterials.reduce((acc, material) => acc + (material.purchasePrice * material.stock), 0);
        const inventoryValue = productsValue + rawMaterialsValue;
        
        const accountsReceivable = filteredIncomes
            .filter(i => i.paymentMethod === 'credito')
            .reduce((acc, income) => acc + income.balance, 0);

        const realizedNetIncome = netBalance - accountsReceivable;

        return {
            totalIncome,
            totalExpenses,
            netBalance,
            inventoryValue,
            accountsReceivable,
            realizedNetIncome
        };
    }, [filteredData, products, rawMaterials]);
    
    const handleCardClick = (metric: string, title: string, description: string, currentValue: number) => {
        const today = new Date();
        const historicalData: { month: string; value: number }[] = [];
        let hasHistory = true;

        const monthlyMetrics: { [key: string]: { income: number, expense: number, balance: number, receivable: number } } = {};
        
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(today, i);
            const key = format(d, 'yyyy-MM');
            monthlyMetrics[key] = { income: 0, expense: 0, balance: 0, receivable: 0 };
        }

        incomes.forEach(income => {
            const incomeMonthKey = format(new Date(income.date + 'T00:00:00'), 'yyyy-MM');
            if (monthlyMetrics[incomeMonthKey]) {
                monthlyMetrics[incomeMonthKey].income += income.totalAmount;
                if(income.paymentMethod === 'credito') {
                    monthlyMetrics[incomeMonthKey].receivable += income.balance;
                }
            }
        });

        expenses.forEach(expense => {
            const expenseMonthKey = format(new Date(expense.date + 'T00:00:00'), 'yyyy-MM');
            if (monthlyMetrics[expenseMonthKey]) {
                monthlyMetrics[expenseMonthKey].expense += expense.amount;
            }
        });

        Object.keys(monthlyMetrics).forEach(key => {
            monthlyMetrics[key].balance = monthlyMetrics[key].income - monthlyMetrics[key].expense;
        })

        if (['realizedNetIncome', 'netBalance', 'totalIncome', 'totalExpenses'].includes(metric)) {
             for (let i = 5; i >= 0; i--) {
                const d = subMonths(today, i);
                const monthKey = format(d, 'yyyy-MM');
                const monthLabel = format(d, 'MMM', { locale: es });
                
                let value = 0;
                switch(metric) {
                    case 'realizedNetIncome':
                        value = monthlyMetrics[monthKey].balance - monthlyMetrics[monthKey].receivable;
                        break;
                    case 'netBalance':
                        value = monthlyMetrics[monthKey].balance;
                        break;
                    case 'totalIncome':
                        value = monthlyMetrics[monthKey].income;
                        break;
                    case 'totalExpenses':
                        value = monthlyMetrics[monthKey].expense;
                        break;
                }
                historicalData.push({ month: monthLabel, value });
            }
        } else if (metric === 'accountsReceivable') {
            for (let i = 5; i >= 0; i--) {
                const d = subMonths(today, i);
                const monthLabel = format(d, 'MMM', { locale: es });
                const endOfMonthDate = endOfMonth(d);

                const creditIncomesUpToMonth = incomes.filter(inc => 
                    inc.paymentMethod === 'credito' && new Date(inc.date + 'T00:00:00') <= endOfMonthDate
                );
                
                let totalOwed = 0;
                let paymentsMadeUpToMonth = 0;

                creditIncomesUpToMonth.forEach(inc => {
                    totalOwed += inc.totalAmount;
                    (inc.payments || []).forEach(p => {
                         if (new Date(p.date + 'T00:00:00') <= endOfMonthDate) {
                            paymentsMadeUpToMonth += p.amount;
                        }
                    });
                });
                
                historicalData.push({ month: monthLabel, value: totalOwed - paymentsMadeUpToMonth });
            }
        } else {
            hasHistory = false;
        }

        setChartConfig({ value: { label: title, color: "hsl(var(--chart-1))" }});
        setChartData(historicalData);
        setSelectedMetric({ title, description, hasHistory, currentValue });
        setIsChartDialogOpen(true);
    };

    const clearFilters = () => {
        setDateRange(undefined);
    };

    const isFiltered = dateRange?.from || dateRange?.to;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Balance General</h1>
                <p className="text-muted-foreground">
                    Un resumen financiero completo de tu negocio.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                </CardContent>
                {isFiltered && (
                    <CardFooter>
                        <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Limpiar Filtros</Button>
                    </CardFooter>
                )}
            </Card>

            <SectionTitle 
                title="Resumen de Flujo de Caja (Efectivo)"
                tooltipText="Mide el dinero REAL que ha entrado y salido de tu negocio en el período seleccionado."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <BalanceCard
                    title="Ingresos Netos Realizados"
                    value={summaryData.realizedNetIncome}
                    description="Balance Neto - Cuentas por Cobrar."
                    icon={Banknote}
                    isLoading={loading}
                    colorBasedOnValue={true}
                    onClick={() => handleCardClick('realizedNetIncome', 'Ingresos Netos Realizados', 'Dinero total recibido menos dinero total pagado, mensualmente.', summaryData.realizedNetIncome)}
                />
            </div>

            <SectionTitle
                title="Resumen de Rentabilidad (Acumulado)"
                tooltipText="Mide la rentabilidad 'en papel', registrando ventas y gastos cuando se facturan, no cuando se pagan."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <BalanceCard
                    title="Balance Neto"
                    value={summaryData.netBalance}
                    description="Ingresos facturados menos egresos incurridos."
                    icon={Scale}
                    isLoading={loading}
                    colorBasedOnValue={true}
                    onClick={() => handleCardClick('netBalance', 'Balance Neto Total', 'Diferencia mensual entre ingresos y egresos totales.', summaryData.netBalance)}
                />
                <BalanceCard
                    title="Ingresos Totales (Facturado)"
                    value={summaryData.totalIncome}
                    description="Suma de todas las facturas de venta emitidas."
                    icon={TrendingUp}
                    isLoading={loading}
                    onClick={() => handleCardClick('totalIncome', 'Ingresos Totales', 'Suma de todos los ingresos registrados en cada mes.', summaryData.totalIncome)}
                />
                <BalanceCard
                    title="Egresos Totales (Incurrido)"
                    value={summaryData.totalExpenses}
                    description="Suma de todos los gastos registrados."
                    icon={TrendingDown}
                    isLoading={loading}
                    onClick={() => handleCardClick('totalExpenses', 'Egresos Totales', 'Suma de todos los egresos registrados en cada mes.', summaryData.totalExpenses)}
                />
            </div>
            
            <SectionTitle
                title="Resumen de Activos"
                tooltipText="El valor de los recursos que posee tu negocio."
            />
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <BalanceCard
                    title="Valor Total de Inventario"
                    value={summaryData.inventoryValue}
                    description="Suma del valor de productos y materia prima."
                    icon={Boxes}
                    isLoading={loading}
                    onClick={() => handleCardClick('inventoryValue', 'Valor Total de Inventario', 'Suma del valor de productos y materia prima.', summaryData.inventoryValue)}
                />
                <BalanceCard
                    title="Cuentas por Cobrar"
                    value={summaryData.accountsReceivable}
                    description="Total de dinero pendiente de pago de clientes."
                    icon={Wallet}
                    isLoading={loading}
                    onClick={() => handleCardClick('accountsReceivable', 'Cuentas por Cobrar', 'Evolución del saldo total pendiente de pago por clientes al final de cada mes.', summaryData.accountsReceivable)}
                />
            </div>

            <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedMetric?.title}</DialogTitle>
                        <DialogDescription>{selectedMetric?.description}</DialogDescription>
                    </DialogHeader>
                    {selectedMetric?.hasHistory ? (
                        <div className="h-[300px] w-full pt-4">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => `RD$${(Number(value) / 1000).toFixed(0)}k`}
                                    />
                                    <ChartTooltip
                                        cursor={true}
                                        content={<ChartTooltipContent indicator="dot" formatter={(value) => `RD$${Number(value).toFixed(2)}`} />}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--color-value)"
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>
                    ) : (
                        <Card className="mt-4 bg-muted/50">
                            <CardContent className="p-6 text-center">
                                <Boxes className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-sm text-muted-foreground">El historial de 6 meses no está disponible para este indicador, ya que representa un valor instantáneo (snapshot).</p>
                                <div className="text-3xl font-bold mt-2">
                                    {`RD$${selectedMetric?.currentValue.toFixed(2)}`}
                                </div>
                                <p className="text-xs text-muted-foreground">Valor Actual</p>
                            </CardContent>
                        </Card>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

    