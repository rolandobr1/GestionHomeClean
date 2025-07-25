
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, FileText, Share2, Download, X, Upload, ChevronsUpDown, User, Calendar, Tag, Banknote, Sigma, Wallet, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppData } from '@/hooks/use-app-data';
import type { Income, Client, Payment, SoldProduct } from '@/components/app-provider';
import { InvoiceTemplate } from '@/components/invoice-template';
import { useToast } from "@/hooks/use-toast";
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { useAuth } from '@/hooks/use-auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IncomeForm } from '@/components/income-form';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentForm } from '@/components/payment-form';
import { Separator } from '@/components/ui/separator';

export default function IngresosPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { incomes, addIncome, deleteIncome, updateIncome, products, clients, addMultipleIncomes, invoiceSettings, addClient, deletePayment } = useAppData();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [selectedIncomeForInvoice, setSelectedIncomeForInvoice] = useState<Income | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [detailsIncome, setDetailsIncome] = useState<Income | null>(null);
    
    const [paymentIncome, setPaymentIncome] = useState<Income | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    
    const [historyIncome, setHistoryIncome] = useState<Income | null>(null);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);


    const allClients = useMemo(() => [
        { id: 'generic', name: 'Cliente Genérico', code: 'CLI-000', email: '', phone: '', address: '' },
        ...clients
    ], [clients]);

    const filteredIncomes = useMemo(() => {
        let filtered = incomes.filter(income => {
            const incomeDate = new Date(income.date + 'T00:00:00');
            
            if (dateRange?.from) {
                const fromDate = new Date(dateRange.from.setHours(0,0,0,0));
                if (incomeDate < fromDate) return false;
            }
            if (dateRange?.to) {
                const toDate = new Date(dateRange.to.setHours(23,59,59,999));
                if (incomeDate > toDate) return false;
            }
            
            if (clientSearchTerm) {
                const client = allClients.find(c => c.id === income.clientId);
                if (!client || !client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())) {
                    return false;
                }
            }

            if (productSearchTerm) {
                const lowerCaseSearchTerm = productSearchTerm.toLowerCase();
                const inProducts = income.products.some(p => p.name.toLowerCase().includes(lowerCaseSearchTerm));
                if (!inProducts) {
                    return false;
                }
            }
            
            if (paymentStatusFilter !== 'all') {
                switch (paymentStatusFilter) {
                    case 'contado':
                        if (income.paymentMethod !== 'contado') return false;
                        break;
                    case 'credito_pagado':
                        if (income.paymentMethod !== 'credito' || income.balance > 0.01) return false;
                        break;
                    case 'credito_pendiente':
                        if (income.paymentMethod !== 'credito' || income.balance <= 0.01) return false;
                        break;
                    default:
                        break;
                }
            }

            return true;
        });
        
        return [...filtered].sort((a, b) => {
            const key = sortConfig.key;
            let aValue, bValue;

            if (key === 'clientId') {
                aValue = allClients.find(c => c.id === a.clientId)?.name || '';
                bValue = allClients.find(c => c.id === b.clientId)?.name || '';
            } else {
                aValue = a[key as keyof Income];
                bValue = b[key as keyof Income];
            }
            
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
            
            if (key === 'updatedAt' && a.updatedAt && b.updatedAt) {
                return (b.updatedAt.toMillis() - a.updatedAt.toMillis()) * directionMultiplier;
            }
            if (key === 'date') {
                return (new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()) * directionMultiplier;
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * directionMultiplier;
            }
            return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
        });

    }, [incomes, dateRange, clientSearchTerm, productSearchTerm, paymentStatusFilter, allClients, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const clearFilters = () => {
        setDateRange(undefined);
        setClientSearchTerm('');
        setProductSearchTerm('');
        setPaymentStatusFilter('all');
    };

    const handleEdit = (income: Income) => {
        setEditingIncome(income);
        setIsDialogOpen(true);
    };

    const handleDelete = async (incomeId: string) => {
        try {
            await deleteIncome(incomeId);
            toast({ title: 'Ingreso Eliminado' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el ingreso.' });
        }
    };

    const handleSave = async (incomeData: Omit<Income, 'id' | 'balance' | 'payments' | 'recordedBy' | 'createdAt' | 'updatedAt'> | Income) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
            return;
        }
        
        try {
            if ('id' in incomeData && incomeData.id) {
                await updateIncome(incomeData as Income);
                 toast({ title: "Ingreso Actualizado", description: "El registro ha sido actualizado." });
            } else {
                const incomeToSave = { ...incomeData, recordedBy: user.name };
                await addIncome(incomeToSave as Omit<Income, 'id' | 'balance' | 'payments' | 'createdAt' | 'updatedAt'>);
                toast({ title: "Ingreso Registrado", description: "El nuevo ingreso ha sido guardado." });
            }
            setIsDialogOpen(false);
        } catch (error: any) {
             toast({ title: "Error al registrar ingreso", description: error.message, variant: "destructive"});
        }
    };
    
    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingIncome(null);
        }
    };

    const handleGenerateInvoice = (income: Income) => {
        setSelectedIncomeForInvoice(income);
        setIsInvoiceOpen(true);
    };

    const generatePdfDoc = (incomeToExport: Income | null) => {
        if (!incomeToExport) return null;

        const client = allClients.find(c => c.id === incomeToExport.clientId);
        const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(invoiceSettings.companyName, margin, 60);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(invoiceSettings.companyAddress, margin, 75);
        doc.text(`RNC: ${invoiceSettings.companyRNC}`, margin, 85);

        doc.setFontSize(14);
        doc.text("Factura", pageWidth - margin, 60, { align: 'right' });

        doc.setFontSize(10);
        doc.text(`Nº: ${incomeToExport.id.slice(-6).toUpperCase()}`, pageWidth - margin, 75, { align: 'right' });
        doc.text(`Fecha: ${format(new Date(incomeToExport.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}`, pageWidth - margin, 85, { align: 'right' });
        
        doc.setLineWidth(1);
        doc.line(margin, 110, pageWidth - margin, 110);
        doc.setFont('helvetica', 'bold');
        doc.text("Facturar a:", margin, 130);
        doc.setFont('helvetica', 'normal');
        doc.text(client?.name || 'Cliente Genérico', margin, 145);

        doc.setFont('helvetica', 'bold');
        doc.text("Método de Pago:", pageWidth / 2, 130);
        doc.setFont('helvetica', 'normal');
        doc.text(incomeToExport.paymentMethod, pageWidth / 2, 145);
        doc.line(margin, 160, pageWidth - margin, 160);

        const tableData = incomeToExport.products.map(p => ([
            p.name,
            p.quantity.toString(),
            `RD$${p.price.toFixed(2)}`,
            `RD$${(p.quantity * p.price).toFixed(2)}`
        ]));

        autoTable(doc, {
            startY: 180,
            head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
            body: tableData,
            theme: 'striped',
            styles: { cellPadding: 8, fontSize: 10 },
            headStyles: { fillColor: [241, 245, 249] },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        const totalXPos = pageWidth - margin - 180;

        doc.setFontSize(10);
        doc.text('Subtotal:', totalXPos, finalY + 30);
        doc.text(`RD$${incomeToExport.totalAmount.toFixed(2)}`, pageWidth - margin, finalY + 30, { align: 'right' });
        doc.text('ITBIS (0%):', totalXPos, finalY + 45);
        doc.text('RD$0.00', pageWidth - margin, finalY + 45, { align: 'right' });

        doc.setLineWidth(1.5);
        doc.line(totalXPos, finalY + 55, pageWidth - margin, finalY + 55);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', totalXPos, finalY + 70);
        doc.text(`RD$${incomeToExport.totalAmount.toFixed(2)}`, pageWidth - margin, finalY + 70, { align: 'right' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('¡Gracias por su compra!', pageWidth / 2, doc.internal.pageSize.getHeight() - 30, { align: 'center' });

        return doc;
    }

    const handleDownloadPdf = () => {
        const doc = generatePdfDoc(selectedIncomeForInvoice);
        if (doc && selectedIncomeForInvoice) {
            doc.save(`factura-${selectedIncomeForInvoice.id.slice(-6)}.pdf`);
        }
    };

    const handleShare = async () => {
        if (!navigator.share) {
          toast({
            variant: 'destructive',
            title: 'No Soportado',
            description: 'Tu navegador no soporta la función de compartir.',
          });
          return;
        }
    
        const doc = generatePdfDoc(selectedIncomeForInvoice);
        if (!doc || !selectedIncomeForInvoice) return;

        try {
          const pdfBlob = doc.output('blob');
          const file = new File([pdfBlob], `factura-${selectedIncomeForInvoice.id.slice(-6)}.pdf`, { type: 'application/pdf' });
          
          await navigator.share({
            title: `Factura ${invoiceSettings.companyName}`,
            text: invoiceSettings.shareMessage,
            files: [file],
          });
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                 toast({
                    variant: 'destructive',
                    title: 'Error al Compartir',
                    description: 'No se pudo compartir la factura.',
                 });
            }
        }
    };
    
    const convertArrayOfObjectsToCSV = (data: any[]) => {
        if (data.length === 0) return '';
        const columnDelimiter = ',';
        const lineDelimiter = '\n';
        const keys = ['idtransaccion', 'fecha', 'cliente', 'metododepago', 'producto', 'cantidad', 'preciounitario', 'subtotalproducto', 'totalfactura', 'registradopor'];

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
        if (filteredIncomes.length === 0) {
            toast({ title: 'No hay datos', description: 'No hay registros para exportar que coincidan con los filtros.', variant: 'destructive' });
            return;
        }

        const flattenedIncomes = filteredIncomes.flatMap(income => {
            const client = allClients.find(c => c.id === income.clientId)?.name || 'N/A';
            return income.products.map(product => ({
                'idtransaccion': income.id,
                'fecha': income.date,
                'cliente': client,
                'metododepago': income.paymentMethod,
                'producto': product.name,
                'cantidad': product.quantity,
                'preciounitario': product.price,
                'subtotalproducto': (product.quantity * product.price).toFixed(2),
                'totalfactura': income.totalAmount.toFixed(2),
                'registradopor': income.recordedBy,
            }));
        });
        const csvString = convertArrayOfObjectsToCSV(flattenedIncomes);
        downloadCSV(csvString, 'ingresos.csv');
        
        toast({ title: 'Exportación Exitosa', description: 'Tus registros han sido descargados.' });
    };

    const handleImportClick = () => {
        setIsImportAlertOpen(true);
    };

    const triggerFileInput = (mode: 'append' | 'replace') => {
        setImportMode(mode);
        fileInputRef.current?.click();
    };


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("El archivo CSV está vacío o solo contiene la cabecera.");

                const headerLine = lines[0];
                const commaCount = (headerLine.match(/,/g) || []).length;
                const semicolonCount = (headerLine.match(/;/g) || []).length;
                const delimiter = semicolonCount > commaCount ? ';' : ',';

                const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
                const requiredHeaders = ['producto', 'cantidad', 'preciounitario'];
                const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
                if (missingHeaders.length > 0) {
                    throw new Error(`Faltan las siguientes columnas obligatorias en el CSV: ${missingHeaders.join(', ')}`);
                }

                const newIncomes: Omit<Income, 'id' | 'balance' | 'payments' | 'createdAt' | 'updatedAt'>[] = [];
                const newClientsCache = new Map<string, Client>();
                let allClientsCurrentList = [...allClients];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(delimiter);
                    const rowData: any = {};
                    headers.forEach((header, index) => {
                        rowData[header] = values[index]?.trim() || '';
                    });
                    
                    const productName = rowData.producto?.trim();
                    const quantityStr = rowData.cantidad;
                    const unitPriceStr = rowData.preciounitario;

                    if (!productName || !quantityStr || !unitPriceStr) {
                        console.warn(`Saltando línea ${i + 1} por datos faltantes.`);
                        continue;
                    }

                    const quantity = parseFloat(quantityStr);
                    const unitPrice = parseFloat(unitPriceStr);

                    if (isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice < 0) {
                        console.warn(`Saltando línea ${i + 1} por valores numéricos inválidos.`);
                        continue;
                    }

                    const clientName = (rowData.cliente || 'Cliente Genérico').trim();
                    let client: Client | undefined;
                    client = allClientsCurrentList.find(c => c.name.toLowerCase() === clientName.toLowerCase());

                    if (!client) {
                        client = newClientsCache.get(clientName.toLowerCase());
                    }

                    if (!client && clientName !== 'Cliente Genérico') {
                        const newClient = await addClient({ name: clientName, email: '', phone: '', address: '' });
                        if (newClient) {
                            client = newClient;
                            newClientsCache.set(clientName.toLowerCase(), newClient);
                            allClientsCurrentList.push(newClient);
                        }
                    }

                    if (!client) {
                        client = allClients.find(s => s.id === 'generic');
                    }
                    if (!client) throw new Error(`No se pudo encontrar o crear el cliente "${clientName}".`);


                    const existingProduct = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
                    
                    const soldProduct: SoldProduct = {
                        productId: existingProduct ? existingProduct.id : `generic_${Date.now()}_${i}`,
                        name: productName,
                        quantity: quantity,
                        price: unitPrice,
                    };
                    
                    const paymentMethodRaw = (rowData.metododepago || 'contado').toLowerCase();
                    const paymentMethod = (paymentMethodRaw === 'credito' || paymentMethodRaw === 'contado') ? paymentMethodRaw : 'contado';
                    
                    newIncomes.push({
                        clientId: client.id,
                        paymentMethod,
                        date: rowData.fecha || format(new Date(), 'yyyy-MM-dd'),
                        products: [soldProduct],
                        totalAmount: soldProduct.quantity * soldProduct.price,
                        category: 'Venta de Producto',
                        recordedBy: rowData.registradopor?.trim() || user.name,
                    });
                }
                
                if (newIncomes.length === 0) {
                    throw new Error("No se encontraron transacciones válidas para importar en el archivo.");
                }

                await addMultipleIncomes(newIncomes, importMode);

                toast({
                    title: "Importación Exitosa",
                    description: `${newIncomes.length} transacciones han sido importadas en modo '${importMode === 'append' ? 'Añadir' : 'Reemplazar'}'.`,
                });
                
                clearFilters();

            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Error de Importación",
                    description: error.message || "No se pudo procesar el archivo CSV.",
                    duration: 10000,
                });
            } finally {
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const getStatusClass = (income: Income) => {
        if (income.paymentMethod === 'contado' || (income.paymentMethod === 'credito' && income.balance <= 0.01)) {
             return 'border-l-4 border-green-500';
        }
        if (income.paymentMethod === 'credito' && income.balance > 0.01) {
            return 'border-l-4 border-amber-500';
        }
        return '';
    };

    const handleAddPaymentClick = (income: Income) => {
        setPaymentIncome(income);
        setIsPaymentDialogOpen(true);
    };

    useEffect(() => {
        if (!isPaymentDialogOpen) {
          setPaymentIncome(null);
        }
    }, [isPaymentDialogOpen]);

    const handleOpenHistory = (income: Income) => {
        setHistoryIncome(income);
        setIsHistoryDialogOpen(true);
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!historyIncome) return;
        try {
            await deletePayment(historyIncome.id, paymentId);
            toast({ title: 'Abono Eliminado', description: 'El registro del abono ha sido eliminado.' });
            
            // Refresh history view
            const updatedIncome = incomes.find(i => i.id === historyIncome.id);
            if (updatedIncome) {
                setHistoryIncome(updatedIncome);
                if (updatedIncome.payments.length === 0) {
                    setIsHistoryDialogOpen(false);
                }
            } else {
                setIsHistoryDialogOpen(false);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el abono.' });
        }
    };


    return (
        <div className="space-y-6">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
             <div className="flex justify-end gap-2">
                {user?.role === 'admin' && (
                  <Button variant="outline" onClick={handleImportClick}>
                      <Upload className="mr-2 h-4 w-4" />
                      Imp.
                  </Button>
                )}
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exp.
                </Button>
                <Button onClick={() => { setEditingIncome(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ingreso
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>Filtra los ingresos por fecha, cliente, producto o estado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                        
                        <Input
                            placeholder="Buscar por cliente..."
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                            className="w-full md:w-[240px]"
                        />
                        
                        <Input 
                            placeholder="Buscar por producto..." 
                            value={productSearchTerm} 
                            onChange={(e) => setProductSearchTerm(e.target.value)} 
                            className="w-full md:w-[240px]" 
                        />
                        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                            <SelectTrigger className="w-full md:w-[240px]">
                                <SelectValue placeholder="Filtrar por estado..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="contado">Contado</SelectItem>
                                <SelectItem value="credito_pagado">Crédito (Pagado)</SelectItem>
                                <SelectItem value="credito_pendiente">Crédito (Pendiente)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4"/>
                        Limpiar Filtros
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <Collapsible defaultOpen={true}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Historial de Ingresos</CardTitle>
                                <CardDescription>Un listado de todas tus transacciones de ingresos.</CardDescription>
                            </div>
                             <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Mostrar/Ocultar</span>
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead onClick={() => handleSort('clientId')} className="cursor-pointer">Cliente</TableHead>
                                            <TableHead>Productos</TableHead>
                                            <TableHead onClick={() => handleSort('paymentMethod')} className="hidden sm:table-cell cursor-pointer">Método</TableHead>
                                            <TableHead onClick={() => handleSort('recordedBy')} className="hidden lg:table-cell cursor-pointer">Registrado por</TableHead>
                                            <TableHead onClick={() => handleSort('totalAmount')} className="text-right cursor-pointer">Monto Total</TableHead>
                                            <TableHead onClick={() => handleSort('date')} className="text-right hidden md:table-cell cursor-pointer">Fecha</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredIncomes.length > 0 ? filteredIncomes.map((income) => {
                                            const client = allClients.find(c => c.id === income.clientId);
                                            
                                            return (
                                            <TableRow key={income.id} className={getStatusClass(income)}>
                                                <TableCell className="font-medium">{client?.name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Button variant="link" size="sm" onClick={() => handleOpenHistory(income)} className="p-0 h-auto">
                                                        {income.products.length} producto(s)
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <Badge variant={
                                                      (income.paymentMethod === 'contado' || income.balance <= 0.01) ? "default" : "destructive"
                                                    } className={cn(
                                                      (income.paymentMethod === 'contado' || income.balance <= 0.01) && "bg-green-600 hover:bg-green-700"
                                                    )}>
                                                        {income.paymentMethod === 'contado' ? 'Contado' : (income.balance <= 0.01 ? 'Pagado' : 'Crédito')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">{income.recordedBy}</TableCell>
                                                <TableCell className="text-right">RD${income.totalAmount.toFixed(2)}</TableCell>
                                                <TableCell className="text-right hidden md:table-cell">{income.updatedAt ? format(income.updatedAt.toDate(), 'PPP', { locale: es }) : format(new Date(income.date + 'T00:00:00'), 'PPP', { locale: es })}</TableCell>
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
                                                                <DropdownMenuItem onClick={() => handleGenerateInvoice(income)}><FileText className="mr-2 h-4 w-4" /> Generar Factura</DropdownMenuItem>
                                                                {income.paymentMethod === 'credito' && income.balance > 0.01 && (
                                                                    <DropdownMenuItem onClick={() => handleAddPaymentClick(income)}>
                                                                        <Wallet className="mr-2 h-4 w-4" /> Registrar Pago
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {income.payments && income.payments.length > 0 && (
                                                                    <DropdownMenuItem onClick={() => handleOpenHistory(income)}>
                                                                        <Info className="mr-2 h-4 w-4" /> Ver Abonos
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleEdit(income)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                                {user?.role === 'admin' && (
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este ingreso?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del ingreso y devolverá los productos al stock.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(income.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        )}) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">
                                                    No se encontraron resultados.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                             {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {filteredIncomes.length > 0 ? filteredIncomes.map(income => {
                                    const client = allClients.find(c => c.id === income.clientId);
                                    return (
                                        <Card key={income.id} className={cn("p-4 relative overflow-hidden", getStatusClass(income))} onClick={() => setDetailsIncome(income)}>
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <p className="font-semibold pr-4">{client?.name || 'N/A'}</p>
                                                    <p className="text-sm text-muted-foreground">{format(new Date(income.date + 'T00:00:00'), 'PPP', { locale: es })}</p>
                                                </div>
                                                <p className="font-bold text-lg">RD${income.totalAmount.toFixed(2)}</p>
                                            </div>
                                        </Card>
                                )}) : (
                                    <div className="text-center p-8 text-muted-foreground">
                                        No se encontraron resultados.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingIncome ? 'Editar Ingreso' : 'Añadir Ingreso'}</DialogTitle>
                        <DialogDescription>
                            {editingIncome ? 'Actualiza los detalles de tu ingreso.' : 'Añade un nuevo ingreso a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <IncomeForm income={editingIncome} onSave={handleSave} onClose={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogContent className="p-0 max-w-4xl w-[95%] h-[90vh] flex flex-col">
                    <DialogHeader className="p-4 pb-2 border-b shrink-0 sm:p-6 sm:pb-4">
                        <DialogTitle>Vista Previa de Factura</DialogTitle>
                        <DialogDescription>
                            Puedes descargar la factura como PDF o compartirla directamente.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedIncomeForInvoice && <InvoiceTemplate income={selectedIncomeForInvoice} clients={allClients} invoiceSettings={invoiceSettings} />}

                    <DialogFooter className="p-4 border-t bg-muted/50 flex-col-reverse shrink-0 sm:flex-row sm:justify-end gap-2 sm:p-6">
                        <Button variant="outline" onClick={handleDownloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                        </Button>
                        <Button onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={!!detailsIncome} onOpenChange={(open) => !open && setDetailsIncome(null)}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalles del Ingreso</DialogTitle>
                    </DialogHeader>
                    {detailsIncome && (
                        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-4">
                            {detailsIncome.paymentMethod === 'credito' ? (
                                <div className="text-sm space-y-1 p-3 rounded-md bg-muted/50">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Monto Total:</span>
                                        <span className="font-medium">RD${detailsIncome.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Abonado:</span>
                                        <span className="font-medium text-green-600">RD${(detailsIncome.totalAmount - detailsIncome.balance).toFixed(2)}</span>
                                    </div>
                                    <Separator/>
                                    <div className="flex justify-between text-base">
                                        <span className="font-semibold">Saldo Pendiente:</span>
                                        <span className="font-bold">RD${detailsIncome.balance.toFixed(2)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-muted-foreground">Monto Total</span>
                                    <span className="font-bold text-lg">RD${detailsIncome.totalAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p><strong className="text-muted-foreground w-24 inline-block">Cliente:</strong> {allClients.find(c => c.id === detailsIncome.clientId)?.name || 'N/A'}</p>
                                <p><strong className="text-muted-foreground w-24 inline-block">Fecha:</strong> {format(new Date(detailsIncome.date + 'T00:00:00'), 'PPP', { locale: es })}</p>
                                <p><strong className="text-muted-foreground w-24 inline-block">Condición:</strong> <span className="capitalize">{detailsIncome.paymentMethod}</span></p>
                                {detailsIncome.paymentMethod === 'contado' && <p><strong className="text-muted-foreground w-24 inline-block">Pagado con:</strong> {detailsIncome.paymentType}</p>}
                                <p><strong className="text-muted-foreground w-24 inline-block">Registrado por:</strong> {detailsIncome.recordedBy}</p>
                            </div>
                            
                            {detailsIncome.payments && detailsIncome.payments.length > 0 && detailsIncome.paymentMethod === 'credito' && (
                                <div>
                                    <h4 className="font-semibold mb-2">Historial de Abonos</h4>
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead className="text-right">Monto</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailsIncome.payments.map(p => (
                                                    <TableRow key={p.id}>
                                                        <TableCell>{format(new Date(p.date + 'T00:00:00'), 'dd/MM/yy', { locale: es })}</TableCell>
                                                        <TableCell className="text-right">RD${p.amount.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="font-semibold mb-2">Productos</h4>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Cant.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {detailsIncome.products.map(p => (
                                                <TableRow key={p.productId}>
                                                    <TableCell>{p.name}</TableCell>
                                                    <TableCell className="text-right">{p.quantity}</TableCell>
                                                    <TableCell className="text-right">RD${(p.quantity * p.price).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                             <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setDetailsIncome(null)}>Cerrar</Button>
                                {detailsIncome.paymentMethod === 'credito' && detailsIncome.balance > 0.01 && (
                                    <Button onClick={() => { setDetailsIncome(null); handleAddPaymentClick(detailsIncome); }}>
                                        <Wallet className="mr-2 h-4 w-4"/>Abonar
                                    </Button>
                                )}
                                <Button onClick={() => { setDetailsIncome(null); handleEdit(detailsIncome); }}> <Edit className="mr-2 h-4 w-4"/>Editar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Historial de Pagos y Productos</DialogTitle>
                        <DialogDescription>
                            Factura {historyIncome?.id.slice(-6).toUpperCase()} para {allClients.find(c => c.id === historyIncome?.clientId)?.name}
                        </DialogDescription>
                    </DialogHeader>
                    {historyIncome && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Monto Total:</span>
                                    <span className="font-medium">RD${historyIncome.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Abonado:</span>
                                    <span className="font-medium text-green-600">RD${(historyIncome.totalAmount - historyIncome.balance).toFixed(2)}</span>
                                </div>
                                <Separator/>
                                <div className="flex justify-between text-base">
                                    <span className="font-semibold">Saldo Pendiente:</span>
                                    <span className="font-bold">RD${historyIncome.balance.toFixed(2)}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Productos Vendidos</h4>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {historyIncome.products.map(p => (
                                                <TableRow key={p.productId}><TableCell>{p.quantity} x {p.name}</TableCell><TableCell className="text-right">RD${(p.quantity * p.price).toFixed(2)}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            {historyIncome.payments.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 text-sm">Abonos Recibidos</h4>
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Monto</TableHead><TableHead>Registrado por</TableHead><TableHead className="text-right"></TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {historyIncome.payments.map(p => (
                                                    <TableRow key={p.id}>
                                                        <TableCell>{format(new Date(p.date + 'T00:00:00'), 'dd/MM/yy', { locale: es })}</TableCell>
                                                        <TableCell>RD${p.amount.toFixed(2)}</TableCell>
                                                        <TableCell>{p.recordedBy}</TableCell>
                                                        <TableCell className="text-right">
                                                            {user?.role === 'admin' && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader><AlertDialogTitle>¿Eliminar este abono?</AlertDialogTitle><AlertDialogDescription>Se eliminará el pago de RD${p.amount.toFixed(2)} y el monto se sumará de nuevo al saldo pendiente de la factura. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
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

            <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Puedes añadir los nuevos ingresos a los existentes o reemplazar todos los datos actuales con los del archivo.
                            <br/>
                            <span className="font-bold text-destructive">¡La opción de reemplazar borrará permanentemente todos los ingresos actuales y ajustará el stock!</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => triggerFileInput('append')}>
                            Añadir a Registros
                        </AlertDialogAction>
                        <AlertDialogAction onClick={() => triggerFileInput('replace')} className="bg-destructive hover:bg-destructive/90">
                            Reemplazar Todo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar Pago a Factura</DialogTitle>
                    <DialogDescription>Añade un nuevo abono a la cuenta pendiente.</DialogDescription>
                </DialogHeader>
                {paymentIncome && <PaymentForm income={paymentIncome} onClose={() => setIsPaymentDialogOpen(false)} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

    

    
