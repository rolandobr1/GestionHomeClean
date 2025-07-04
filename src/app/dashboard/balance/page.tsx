"use client";

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppData } from '@/hooks/use-app-data';
import { Scale, TrendingUp, TrendingDown, Wallet, Boxes, Landmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const BalanceCard = ({ title, value, description, icon: Icon, isLoading, formatAsCurrency = true }: { title: string, value: number, description: string, icon: React.ElementType, isLoading: boolean, formatAsCurrency?: boolean }) => (
    <Card>
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
                    <div className="text-2xl font-bold truncate">
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

export default function BalancePage() {
    const { incomes, expenses, products, rawMaterials, loading } = useAppData();

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

        return {
            totalIncomeAllTime,
            totalExpensesAllTime,
            netBalance,
            inventoryValue,
            accountsReceivable,
            currentAssets
        };
    }, [incomes, expenses, products, rawMaterials]);
    
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
                    title="Balance Neto Total"
                    value={summaryData.netBalance}
                    description="Ingresos totales menos egresos totales."
                    icon={Scale}
                    isLoading={loading}
                />
                 <BalanceCard
                    title="Activos Circulantes"
                    value={summaryData.currentAssets}
                    description="Valor de inventario más cuentas por cobrar."
                    icon={Landmark}
                    isLoading={loading}
                />
                <BalanceCard
                    title="Cuentas por Cobrar"
                    value={summaryData.accountsReceivable}
                    description="Total de dinero pendiente de pago por clientes."
                    icon={Wallet}
                    isLoading={loading}
                />
                <BalanceCard
                    title="Ingresos Totales (Histórico)"
                    value={summaryData.totalIncomeAllTime}
                    description="Suma de todos los ingresos registrados."
                    icon={TrendingUp}
                    isLoading={loading}
                />
                <BalanceCard
                    title="Egresos Totales (Histórico)"
                    value={summaryData.totalExpensesAllTime}
                    description="Suma de todos los egresos registrados."
                    icon={TrendingDown}
                    isLoading={loading}
                />
                <BalanceCard
                    title="Valor Total de Inventario"
                    value={summaryData.inventoryValue}
                    description="Suma del valor de productos y materia prima."
                    icon={Boxes}
                    isLoading={loading}
                />
            </div>
        </div>
    );
}
