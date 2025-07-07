
"use client";

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppData } from '@/hooks/use-app-data';
import { Scale, TrendingUp, TrendingDown, Wallet, Boxes, Landmark, Banknote } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subMonths, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

const chartConfigBase = {
  value: {
    label: "Valor",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

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
    const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartConfig, setChartConfig] = useState<ChartConfig>(chartConfigBase);
    const [selectedMetric, setSelectedMetric] = useState<{ title: string; description: string; hasHistory: boolean; currentValue: number } | null>(null);

    const summaryData = useMemo(() => {
        const totalIncomeAllTime = incomes.reduce((acc, income) => acc + income.totalAmount, 0);
        const totalExpensesAllTime = expenses.reduce((acc, expense) => acc + expense.amount, 0);
        const netBalance = totalIncomeAllTime - totalExpensesAllTime;
        
        const productsValue = products.reduce((acc, product) => acc + (product.salePriceWholesale * product.stock), 0);
        const rawMaterialsValue = rawMaterials.reduce((acc, material) => acc + (material.purchasePrice * material.stock), 0);
        const inventoryValue = productsValue + rawMaterialsValue;
        
        const accountsReceivable = incomes
            .filter(i => i.balance > 0.01)
            .reduce((acc, income) => acc + income.balance, 0);
            
        const currentAssets = inventoryValue + accountsReceivable;

        const realizedNetIncome = netBalance - accountsReceivable;

        return {
            totalIncomeAllTime,
            totalExpensesAllTime,
            netBalance,
            inventoryValue,
            accountsReceivable,
            currentAssets,
            realizedNetIncome
        };
    }, [incomes, expenses, products, rawMaterials]);
    
    const handleCardClick = (metric: string, title: string, description: string, currentValue: number) => {
        const today = new Date();
        const historicalData: { month: string; value: number }[] = [];
        let hasHistory = true;

        const monthlyMetrics: { [key: string]: { income: number, expense: number, realizedIncome: number, realizedExpense: number } } = {};
        
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(today, i);
            const key = format(d, 'yyyy-MM');
            monthlyMetrics[key] = { income: 0, expense: 0, realizedIncome: 0, realizedExpense: 0 };
        }

        incomes.forEach(income => {
            const incomeMonthKey = format(new Date(income.date + 'T00:00:00'), 'yyyy-MM');
            if (monthlyMetrics[incomeMonthKey]) {
                monthlyMetrics[incomeMonthKey].income += income.totalAmount;
                if (income.paymentMethod === 'contado') {
                    monthlyMetrics[incomeMonthKey].realizedIncome += income.totalAmount;
                }
            }
            income.payments.forEach(payment => {
                const paymentMonthKey = format(new Date(payment.date + 'T00:00:00'), 'yyyy-MM');
                 if (monthlyMetrics[paymentMonthKey]) {
                    monthlyMetrics[paymentMonthKey].realizedIncome += payment.amount;
                }
            });
        });

        expenses.forEach(expense => {
            const expenseMonthKey = format(new Date(expense.date + 'T00:00:00'), 'yyyy-MM');
            if (monthlyMetrics[expenseMonthKey]) {
                monthlyMetrics[expenseMonthKey].expense += expense.amount;
                 if (expense.paymentMethod === 'contado') {
                    monthlyMetrics[expenseMonthKey].realizedExpense += expense.amount;
                }
            }
            expense.payments.forEach(payment => {
                const paymentMonthKey = format(new Date(payment.date + 'T00:00:00'), 'yyyy-MM');
                 if (monthlyMetrics[paymentMonthKey]) {
                    monthlyMetrics[paymentMonthKey].realizedExpense += payment.amount;
                }
            });
        });

        if (['realizedNetIncome', 'netBalance', 'totalIncomeAllTime', 'totalExpensesAllTime'].includes(metric)) {
             for (let i = 5; i >= 0; i--) {
                const d = subMonths(today, i);
                const monthKey = format(d, 'yyyy-MM');
                const monthLabel = format(d, 'MMM', { locale: es });
                
                let value = 0;
                switch(metric) {
                    case 'realizedNetIncome':
                        value = monthlyMetrics[monthKey].realizedIncome - monthlyMetrics[monthKey].realizedExpense;
                        break;
                    case 'netBalance':
                        value = monthlyMetrics[monthKey].income - monthlyMetrics[monthKey].expense;
                        break;
                    case 'totalIncomeAllTime':
                        value = monthlyMetrics[monthKey].income;
                        break;
                    case 'totalExpensesAllTime':
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
                const totalOwed = creditIncomesUpToMonth.reduce((sum, inc) => sum + inc.totalAmount, 0);
                const paymentsMadeUpToMonth = creditIncomesUpToMonth.flatMap(inc => inc.payments)
                    .filter(p => new Date(p.date + 'T00:00:00') <= endOfMonthDate)
                    .reduce((sum, p) => sum + p.amount, 0);
                
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Balance General</h1>
                <p className="text-muted-foreground">
                    Un resumen financiero completo de tu negocio a lo largo del tiempo.
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <BalanceCard
                    title="Ingresos Netos Realizados"
                    value={summaryData.realizedNetIncome}
                    description="Balance total menos las cuentas por cobrar."
                    icon={Banknote}
                    isLoading={loading}
                    colorBasedOnValue={true}
                    onClick={() => handleCardClick('realizedNetIncome', 'Ingresos Netos Realizados', 'Evolución mensual de los ingresos que realmente han entrado a tu negocio.', summaryData.realizedNetIncome)}
                />
                <BalanceCard
                    title="Balance Neto Total"
                    value={summaryData.netBalance}
                    description="Ingresos totales menos egresos totales."
                    icon={Scale}
                    isLoading={loading}
                    onClick={() => handleCardClick('netBalance', 'Balance Neto Total', 'Diferencia mensual entre ingresos y egresos totales.', summaryData.netBalance)}
                />
                 <BalanceCard
                    title="Activos Circulantes"
                    value={summaryData.currentAssets}
                    description="Valor de inventario más cuentas por cobrar."
                    icon={Landmark}
                    isLoading={loading}
                    onClick={() => handleCardClick('currentAssets', 'Activos Circulantes', 'Valor de inventario más cuentas por cobrar.', summaryData.currentAssets)}
                />
                <BalanceCard
                    title="Cuentas por Cobrar"
                    value={summaryData.accountsReceivable}
                    description="Total de dinero pendiente de pago por clientes."
                    icon={Wallet}
                    isLoading={loading}
                    onClick={() => handleCardClick('accountsReceivable', 'Cuentas por Cobrar', 'Evolución del saldo total pendiente de pago por clientes al final de cada mes.', summaryData.accountsReceivable)}
                />
                <BalanceCard
                    title="Ingresos Totales (Histórico)"
                    value={summaryData.totalIncomeAllTime}
                    description="Suma de todos los ingresos registrados."
                    icon={TrendingUp}
                    isLoading={loading}
                    onClick={() => handleCardClick('totalIncomeAllTime', 'Ingresos Totales', 'Suma de todos los ingresos registrados en cada mes.', summaryData.totalIncomeAllTime)}
                />
                <BalanceCard
                    title="Egresos Totales (Histórico)"
                    value={summaryData.totalExpensesAllTime}
                    description="Suma de todos los egresos registrados."
                    icon={TrendingDown}
                    isLoading={loading}
                    onClick={() => handleCardClick('totalExpensesAllTime', 'Egresos Totales', 'Suma de todos los egresos registrados en cada mes.', summaryData.totalExpensesAllTime)}
                />
                <BalanceCard
                    title="Valor Total de Inventario"
                    value={summaryData.inventoryValue}
                    description="Suma del valor de productos y materia prima."
                    icon={Boxes}
                    isLoading={loading}
                    onClick={() => handleCardClick('inventoryValue', 'Valor Total de Inventario', 'Suma del valor de productos y materia prima.', summaryData.inventoryValue)}
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
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
