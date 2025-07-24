
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wallet, MoreHorizontal, X, Info, Sigma, Download, Share2, ChevronsUpDown, Trash2 } from "lucide-react";
import { useAppData } from '@/hooks/use-app-data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Expense, Supplier } from '@/components/app-provider';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaymentForm } from '@/components/payment-form';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

export default function CuentasPorPagarPage() {
  const { expenses, suppliers, invoiceSettings, deletePaymentFromExpense } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [recordedByFilter, setRecordedByFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [historyExpense, setHistoryExpense] = useState<Expense | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const allSuppliers = useMemo(() => [
    { id: 'generic', name: 'Suplidor Genérico', email: '', phone: '', address: '' },
    ...suppliers
  ], [suppliers]);

  const allUsers = useMemo(() => {
    const users = new Set(expenses.map(i => i.recordedBy));
    return Array.from(users);
  }, [expenses]);

  const filteredAccounts = useMemo(() => {
    let filtered = expenses.filter(expense => expense.balance > 0.01);

    filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date + 'T00:00:00');
        
        if (dateRange?.from && dateRange?.to) {
            const fromDate = new Date(dateRange.from.setHours(0,0,0,0));
            const toDate = new Date(dateRange.to.setHours(23,59,59,999));
            if (expenseDate < fromDate || expenseDate > toDate) return false;
        }
        
        if (supplierSearchTerm) {
            const supplier = suppliers.find(s => s.id === expense.supplierId);
            if (!supplier || !supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())) {
                return false;
            }
        }

        if (recordedByFilter && expense.recordedBy !== recordedByFilter) return false;
        
        return true;
    });

    return [...filtered].sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'supplierName') {
            aValue = allSuppliers.find(s => s.id === a.supplierId)?.name || '';
            bValue = allSuppliers.find(s => s.id === b.supplierId)?.name || '';
        } else {
            aValue = a[sortConfig.key as keyof Expense];
            bValue = b[sortConfig.key as keyof Expense];
        }

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return (aValue - bValue) * directionMultiplier;
        }
        if (sortConfig.key === 'date') {
            return (new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()) * directionMultiplier;
        }
        return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
    });

  }, [expenses, dateRange, supplierSearchTerm, recordedByFilter, suppliers, sortConfig, allSuppliers]);

  const filteredTotal = useMemo(() => {
    return filteredAccounts.reduce((acc, expense) => acc + expense.balance, 0);
  }, [filteredAccounts]);

  const clearFilters = () => {
    setDateRange(undefined);
    setSupplierSearchTerm('');
    setRecordedByFilter('');
  };
  
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddPaymentClick = (expense: Expense) => {
    setPaymentExpense(expense);
    setIsPaymentDialogOpen(true);
  };
  
  const handleOpenHistory = (expense: Expense) => {
    setHistoryExpense(expense);
    setIsHistoryDialogOpen(true);
  };

  const generatePdfDoc = () => {
    const doc = new jsPDF();
    const { companyName } = invoiceSettings;

    // Header
    doc.setFontSize(20);
    doc.text(companyName, 14, 22);
    doc.setFontSize(12);
    doc.text("Reporte de Cuentas por Pagar", 14, 30);
    doc.setFontSize(8);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 14, 35);
    
    // Filter Details
    doc.setFontSize(10);
    doc.text("Filtros Aplicados:", 14, 45);
    let filterY = 50;
    
    doc.text(`- Suplidor: ${supplierSearchTerm || 'Todos'}`, 14, filterY);
    filterY += 5;

    const dateRangeString = dateRange?.from 
        ? `${format(dateRange.from, 'P', { locale: es })} - ${dateRange.to ? format(dateRange.to, 'P', { locale: es }) : ''}`
        : 'Cualquier fecha';
    doc.text(`- Rango de Fechas: ${dateRangeString}`, 14, filterY);
    filterY += 5;

    doc.text(`- Usuario Registrador: ${recordedByFilter || 'Todos'}`, 14, filterY);
    filterY += 10;

    // Table
    const tableData = filteredAccounts.map(expense => [
        allSuppliers.find(s => s.id === expense.supplierId)?.name || 'N/A',
        expense.description,
        format(new Date(expense.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }),
        `RD$${expense.amount.toFixed(2)}`,
        `RD$${expense.balance.toFixed(2)}`,
        expense.recordedBy
    ]);
    
    autoTable(doc, {
        startY: filterY,
        head: [['Suplidor', 'Descripción', 'Fecha', 'Monto Total', 'Saldo Pendiente', 'Registrado por']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] } // Tailwind red-500
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || filterY + tableData.length * 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Filtrado:', 14, finalY + 15);
    doc.text(`RD$${filteredTotal.toFixed(2)}`, doc.internal.pageSize.getWidth() - 14, finalY + 15, { align: 'right' });

    return doc;
  };

  const handleExportPdf = () => {
    if (filteredAccounts.length === 0) {
        toast({
            variant: "destructive",
            title: "No hay datos para exportar",
            description: "No hay cuentas que coincidan con los filtros seleccionados.",
        });
        return;
    }

    const doc = generatePdfDoc();
    doc.save(`reporte-cuentas-por-pagar-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    toast({
        title: "Exportación Exitosa",
        description: "El reporte de cuentas por pagar ha sido generado.",
    });
  };

  const handleShare = async () => {
    if (filteredAccounts.length === 0) {
        toast({
            variant: "destructive",
            title: "No hay datos para compartir",
        });
        return;
    }

    if (!navigator.share) {
        toast({ variant: 'destructive', title: 'No Soportado' });
        return;
    }

    const doc = generatePdfDoc();
    try {
      const pdfBlob = doc.output('blob');
      const fileName = `reporte-cuentas-por-pagar-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await navigator.share({
        title: `Reporte de Cuentas por Pagar - ${invoiceSettings.companyName}`,
        text: `Aquí está el reporte de cuentas por pagar de ${invoiceSettings.companyName}.`,
        files: [file],
      });
    } catch (error: any) {
        if (error.name !== 'AbortError') {
             toast({ variant: 'destructive', title: 'Error al Compartir' });
        }
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!historyExpense) return;
    try {
        await deletePaymentFromExpense(historyExpense.id, paymentId);
        toast({ title: 'Abono Eliminado', description: 'El registro del abono ha sido eliminado.' });
        
        const updatedExpense = expenses.find(i => i.id === historyExpense.id);
        if (updatedExpense) {
            setHistoryExpense(updatedExpense);
            if (updatedExpense.payments.length === 0) setIsHistoryDialogOpen(false);
        } else {
            setIsHistoryDialogOpen(false);
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el abono.' });
    }
  };

  useEffect(() => {
    if (!isPaymentDialogOpen) {
      setPaymentExpense(null);
    }
  }, [isPaymentDialogOpen]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            
            <Input
              placeholder="Buscar por suplidor..."
              value={supplierSearchTerm}
              onChange={(e) => setSupplierSearchTerm(e.target.value)}
              className="w-full md:w-[240px]"
            />

            <Select value={recordedByFilter || 'all'} onValueChange={(value) => setRecordedByFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Filtrar por usuario..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {allUsers.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Limpiar Filtros</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Filtrado</CardTitle>
          <Sigma className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">RD${filteredTotal.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Suma de los saldos pendientes según los filtros aplicados.
          </p>
        </CardContent>
      </Card>

      <Card>
          <Collapsible defaultOpen={true}>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Egresos a Crédito Pendientes</CardTitle>
                    <CardDescription>Un listado de todas las compras a crédito con saldo pendiente de pago.</CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                    <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="h-4 w-4" /><span className="hidden sm:inline">Compartir</span></Button>
                    <Button onClick={handleExportPdf} variant="outline" size="sm"><Download className="h-4 w-4" /><span className="hidden sm:inline">Exportar</span></Button>
                    <CollapsibleTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronsUpDown className="h-4 w-4" /><span className="sr-only">Toggle</span></Button></CollapsibleTrigger>
                </div>
            </CardHeader>
            <CollapsibleContent>
                <CardContent>
                    {filteredAccounts.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => handleSort('supplierName')} className="cursor-pointer">Suplidor</TableHead>
                                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                                <TableHead className="hidden sm:table-cell text-right">Monto Total</TableHead>
                                <TableHead onClick={() => handleSort('balance')} className="text-right cursor-pointer">Saldo Pendiente</TableHead>
                                <TableHead className="hidden lg:table-cell">Registrado por</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAccounts.map((expense) => {
                                const supplier = allSuppliers.find(s => s.id === expense.supplierId);
                                return (
                                    <TableRow key={expense.id}>
                                        <TableCell className="font-medium">{supplier?.name || 'N/A'}</TableCell>
                                        <TableCell className="hidden md:table-cell">{expense.description}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-right">RD${expense.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-semibold">RD${expense.balance.toFixed(2)}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{expense.recordedBy}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Menú</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleAddPaymentClick(expense)}><Wallet className="mr-2 h-4 w-4" /> Registrar Pago</DropdownMenuItem>
                                                    {expense.payments && expense.payments.length > 0 && (
                                                        <DropdownMenuItem onClick={() => handleOpenHistory(expense)}>
                                                            <Info className="mr-2 h-4 w-4" /> Ver Abonos
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                    ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                        <Wallet className="h-16 w-16 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">Todo al día</h3>
                        <p className="mt-1 text-sm text-muted-foreground">No se encontraron cuentas por pagar.</p>
                    </div>
                    )}
                </CardContent>
            </CollapsibleContent>
          </Collapsible>
      </Card>
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago a Egreso</DialogTitle>
            <DialogDescription>Añade un nuevo abono a la cuenta pendiente.</DialogDescription>
          </DialogHeader>
          {paymentExpense && <PaymentForm expense={paymentExpense} onClose={() => setIsPaymentDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
      
       <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Historial de Pagos</DialogTitle>
                  <DialogDescription>
                      Egreso para {allSuppliers.find(c => c.id === historyExpense?.supplierId)?.name}
                  </DialogDescription>
              </DialogHeader>
              {historyExpense && (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                      <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Monto Total:</span><span className="font-medium">RD${historyExpense.amount.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Abonado:</span><span className="font-medium text-green-600">RD${(historyExpense.amount - historyExpense.balance).toFixed(2)}</span></div>
                          <Separator/>
                           <div className="flex justify-between text-base"><span className="font-semibold">Saldo Pendiente:</span><span className="font-bold">RD${historyExpense.balance.toFixed(2)}</span></div>
                      </div>

                      {historyExpense.payments.length > 0 && (
                          <div>
                              <h4 className="font-semibold mb-2 text-sm">Abonos Realizados</h4>
                              <div className="border rounded-md">
                                  <Table>
                                      <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Monto</TableHead><TableHead>Por</TableHead><TableHead className="text-right"></TableHead></TableRow></TableHeader>
                                      <TableBody>
                                          {historyExpense.payments.map(p => (
                                              <TableRow key={p.id}>
                                                  <TableCell>{format(new Date(p.date + 'T00:00:00'), 'dd/MM/yy', { locale: es })}</TableCell>
                                                  <TableCell>RD${p.amount.toFixed(2)}</TableCell>
                                                  <TableCell>{p.recordedBy}</TableCell>
                                                  <TableCell className="text-right">
                                                      {user?.role === 'admin' && (
                                                      <AlertDialog>
                                                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                              <AlertDialogHeader><AlertDialogTitle>¿Eliminar este abono?</AlertDialogTitle><AlertDialogDescription>Se eliminará el pago de RD${p.amount.toFixed(2)} y el monto se sumará de nuevo al saldo pendiente. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePayment(p.id)} className="bg-destructive hover:bg-destructive/90">Eliminar Abono</AlertDialogAction></AlertDialogFooter>
                                                          </AlertDialogContent>
                                                      </AlertDialog>
                                                      )}
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                      </TableBody>
                                  </Table>
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
