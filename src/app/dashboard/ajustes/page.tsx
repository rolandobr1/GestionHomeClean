"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileCog } from "lucide-react";
import { useFinancialData } from '@/hooks/use-financial-data';
import { useToast } from "@/hooks/use-toast";
import { allClients } from '../registros/ingresos/page';

export default function AjustesPage() {
    const { incomes, expenses } = useFinancialData();
    const { toast } = useToast();

    const convertArrayOfObjectsToCSV = (data: any[]) => {
        if (data.length === 0) return '';
        const columnDelimiter = ',';
        const lineDelimiter = '\n';
        const keys = Object.keys(data[0]);

        let result = keys.join(columnDelimiter) + lineDelimiter;

        data.forEach(item => {
            let ctr = 0;
            keys.forEach(key => {
                if (ctr > 0) result += columnDelimiter;
                let value = item[key] ?? '';
                if (typeof value === 'string' && value.includes('"')) {
                   value = value.replace(/"/g, '""');
                }
                if (typeof value === 'string' && value.includes(columnDelimiter)) {
                   value = `"${value}"`;
                }
                result += value;
                ctr++;
            });
            result += lineDelimiter;
        });

        return result;
    }

    const downloadCSV = (csvStr: string, fileName: string) => {
        const blob = new Blob([`\uFEFF${csvStr}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleExport = () => {
        if (incomes.length === 0 && expenses.length === 0) {
            toast({ title: 'No hay datos', description: 'No hay registros para exportar.', variant: 'destructive' });
            return;
        }

        if (incomes.length > 0) {
            const flattenedIncomes = incomes.flatMap(income => {
                const client = allClients.find(c => c.id === income.clientId)?.name || 'N/A';
                return income.products.map(product => ({
                    'ID Transaccion': income.id,
                    'Fecha': income.date,
                    'Cliente': client,
                    'Metodo de Pago': income.paymentMethod,
                    'Producto': product.name,
                    'Cantidad': product.quantity,
                    'Precio Unitario': product.price,
                    'Subtotal Producto': (product.quantity * product.price).toFixed(2),
                    'Total Factura': income.totalAmount.toFixed(2),
                }));
            });
            const csvString = convertArrayOfObjectsToCSV(flattenedIncomes);
            downloadCSV(csvString, 'ingresos.csv');
        }

        if (expenses.length > 0) {
             const flattenedExpenses = expenses.map(expense => ({
                'ID Transaccion': expense.id,
                'Fecha': expense.date,
                'Descripcion': expense.description,
                'Categoria': expense.category,
                'Monto': expense.amount,
            }));
            const csvString = convertArrayOfObjectsToCSV(flattenedExpenses);
            downloadCSV(csvString, 'egresos.csv');
        }

        toast({ title: 'Exportación Exitosa', description: 'Tus registros han sido descargados.' });
    };

    const handleImportClick = () => {
        toast({
            title: 'Función no disponible',
            description: 'La importación de datos masivos no está implementada en este prototipo.',
        });
    };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Ajustes y Exportación</h1>
            <p className="text-muted-foreground">Gestiona tu cuenta y tus datos.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCog className="h-5 w-5"/>Exportar/Importar Datos</CardTitle>
                <CardDescription>Exporta tus registros a formato CSV o importa datos masivamente.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 flex flex-col items-center text-center gap-2">
                    <Download className="h-8 w-8 text-primary"/>
                    <h3 className="font-semibold">Exportar Datos</h3>
                    <p className="text-sm text-muted-foreground">Descarga tus ingresos, egresos, inventario y cuentas por cobrar.</p>
                    <Button variant="outline" className="mt-2" onClick={handleExport}>Exportar Todo (CSV)</Button>
                </Card>
                <Card className="p-4 flex flex-col items-center text-center gap-2">
                    <Upload className="h-8 w-8 text-primary"/>
                    <h3 className="font-semibold">Importar Datos</h3>
                    <p className="text-sm text-muted-foreground">Sube un archivo CSV para añadir productos o registros en bloque.</p>
                    <Button variant="outline" className="mt-2" onClick={handleImportClick}>Importar Archivo (CSV)</Button>
                </Card>
            </CardContent>
        </Card>
    </div>
  );
}
