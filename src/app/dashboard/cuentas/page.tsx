"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CircleDollarSign, CheckCircle, MoreHorizontal } from "lucide-react";
import { useFinancialData } from '@/hooks/use-financial-data';
import { allClients } from '../registros/ingresos/page';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Income } from '@/components/financial-provider';

export default function CuentasPage() {
  const { incomes, updateIncome } = useFinancialData();

  const accountsReceivable = incomes.filter(income => income.paymentMethod === 'credito');

  const handleMarkAsPaid = (income: Income) => {
    updateIncome({ ...income, paymentMethod: 'contado' });
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Cuentas por Cobrar</h1>
            <p className="text-muted-foreground">Gestiona las facturas pendientes de pago de tus clientes.</p>
        </div>

      <Card>
          <CardHeader>
              <CardTitle>Facturas a Crédito Pendientes</CardTitle>
              <CardDescription>Un listado de todas las ventas a crédito que no han sido saldadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {accountsReceivable.length > 0 ? (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Detalle</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {accountsReceivable.map((income) => {
                          const client = allClients.find(c => c.id === income.clientId);
                          return (
                              <TableRow key={income.id}>
                                  <TableCell className="font-medium">{client?.name || 'N/A'}</TableCell>
                                  <TableCell>Venta de {income.products.length} producto(s)</TableCell>
                                  <TableCell>{format(new Date(income.date), 'PPP', { locale: es })}</TableCell>
                                  <TableCell className="text-right">RD${income.totalAmount.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4" /> Marcar como Pagado</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>¿Confirmar pago?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción marcará la factura como pagada. El registro se moverá de cuentas por cobrar a ingresos contados. ¿Estás seguro?
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleMarkAsPaid(income)}>Confirmar Pago</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                  </TableCell>
                              </TableRow>
                          )
                      })}
                  </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                  <CircleDollarSign className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Todo al día</h3>
                  <p className="mt-1 text-sm text-muted-foreground">No tienes cuentas por cobrar pendientes.</p>
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
