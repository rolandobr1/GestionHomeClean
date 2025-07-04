
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, FileText, Share2, Download, X, Upload, ChevronsUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppData } from '@/hooks/use-app-data';
import type { Income, SoldProduct, Client, Payment } from '@/components/app-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InvoiceTemplate } from '@/components/invoice-template';
import { useToast } from "@/hooks/use-toast";
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { useAuth } from '@/hooks/use-auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const IncomeForm = ({ income, onSave, clients, onClose }: { income: Income | null, onSave: (income: Income | Omit<Income, 'id'>) => Promise<void>, clients: Client[], onClose: () => void }) => {
    const { products: allProducts, invoiceSettings } = useAppData();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [clientId, setClientId] = useState('generic');
    const [paymentMethod, setPaymentMethod] = useState<'contado' | 'credito'>('contado');
    const [paymentType, setPaymentType] = useState(invoiceSettings.paymentMethods[0] || '');
    const [date, setDate] = useState('');
    const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
    
    const [currentProduct, setCurrentProduct] = useState('');
    const [currentQuantity, setCurrentQuantity] = useState(1);
    const [currentPriceType, setCurrentPriceType] = useState<'retail' | 'wholesale'>('retail');

    const [genericProductName, setGenericProductName] = useState('');
    const [genericProductPrice, setGenericProductPrice] = useState<number | string>('');

    useEffect(() => {
        if (income) {
            setClientId(income.clientId);
            setPaymentMethod(income.paymentMethod);
            setPaymentType(income.paymentType || (invoiceSettings.paymentMethods[0] || ''));
            setDate(format(new Date(income.date + 'T00:00:00'), 'yyyy-MM-dd'));
            setSoldProducts(income.products);
        } else {
            setClientId('generic');
            setPaymentMethod('contado');
            setPaymentType(invoiceSettings.paymentMethods[0] || '');
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setSoldProducts([]);
        }
    }, [income, invoiceSettings.paymentMethods]);

    const handleAddProduct = () => {
        if (currentProduct === 'generic') {
            if (Number(genericProductPrice) <= 0 || currentQuantity <= 0) {
                 toast({
                    variant: "destructive",
                    title: "Datos Inválidos",
                    description: "Por favor, ingresa un precio y cantidad mayor a cero.",
                });
                return;
            }
            const newProduct: SoldProduct = {
                productId: `generic_${Date.now()}`,
                name: genericProductName || 'Venta General',
                quantity: currentQuantity,
                price: Number(genericProductPrice),
            };
            setSoldProducts([...soldProducts, newProduct]);
            setGenericProductName('');
            setGenericProductPrice('');
        } else {
            const product = allProducts.find(p => p.id === currentProduct);
            if (!product || currentQuantity <= 0) return;

            const price = currentPriceType === 'retail' ? product.salePriceRetail : product.salePriceWholesale;
            
            const existingProduct = soldProducts.find(p => p.productId === product.id && p.price === price);

            if (existingProduct) {
                setSoldProducts(soldProducts.map(p => 
                    p.productId === product.id && p.price === price
                    ? { ...p, quantity: p.quantity + currentQuantity } 
                    : p
                ));
            } else {
                setSoldProducts([...soldProducts, {
                    productId: product.id,
                    name: product.name,
                    quantity: currentQuantity,
                    price: price,
                }]);
            }
        }
        
        setCurrentProduct('');
        setCurrentQuantity(1);
        setCurrentPriceType('retail');
    };

    const handleRemoveProduct = (productId: string) => {
        setSoldProducts(soldProducts.filter(p => p.productId !== productId));
    };

    const totalAmount = soldProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (soldProducts.length === 0) {
             toast({
                variant: "destructive",
                title: "Venta Vacía",
                description: "Debes agregar al menos un producto.",
            });
            return;
        }
        setIsSaving(true);
        try {
            const dataToSave = {
                clientId,
                paymentMethod,
                paymentType: paymentMethod === 'contado' ? paymentType : undefined,
                date,
                products: soldProducts,
                totalAmount,
                category: 'Venta de Producto',
            };

            if (income) {
                 await onSave({
                    ...income,
                    ...dataToSave,
                });
            } else {
                await onSave({
                    ...dataToSave,
                    recordedBy: '', // Will be set in the provider
                });
            }
            onClose();
        } finally {
            setIsSaving(false);
        }
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="clientId">Cliente</Label>
                        <Select onValueChange={setClientId} value={clientId} disabled={isSaving}>
                            <SelectTrigger id="clientId">
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={isSaving} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Condición de Pago</Label>
                        <Select onValueChange={(value: 'contado' | 'credito') => setPaymentMethod(value)} value={paymentMethod} disabled={isSaving}>
                            <SelectTrigger id="paymentMethod">
                                <SelectValue placeholder="Selecciona una condición" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contado">Contado</SelectItem>
                                <SelectItem value="credito">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {paymentMethod === 'contado' && (
                        <div className="space-y-2">
                            <Label htmlFor="paymentType">Método de Pago</Label>
                            <Select onValueChange={setPaymentType} value={paymentType} disabled={isSaving}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un método" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoiceSettings.paymentMethods.map(method => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                
                <Separator />

                <div className="space-y-2">
                    <Label>Añadir Productos</Label>
                    <Card className="p-4 space-y-4 bg-muted/50">
                        <div className="space-y-2">
                            <Label htmlFor="productId-form">Producto</Label>
                            <Select onValueChange={setCurrentProduct} value={currentProduct}>
                                <SelectTrigger id="productId-form">
                                    <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="generic">-- Producto Genérico (Entrada Manual) --</SelectItem>
                                    {allProducts.map(product => (
                                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {currentProduct === 'generic' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="generic-name">Nombre del Producto</Label>
                                    <Input id="generic-name" value={genericProductName} onChange={e => setGenericProductName(e.target.value)} placeholder="Ej: Vaso Desechable" disabled={isSaving}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="generic-price">Precio Unitario</Label>
                                    <Input id="generic-price" type="number" value={genericProductPrice} onChange={e => setGenericProductPrice(e.target.value)} placeholder="0.00" inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
                                </div>
                            </div>
                        ) : (
                            currentProduct && (
                                <div className="space-y-2">
                                    <Label>Tipo de Precio</Label>
                                    <RadioGroup value={currentPriceType} onValueChange={(value: 'retail' | 'wholesale') => setCurrentPriceType(value)} className="flex gap-4" disabled={isSaving}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="retail" id="retail" /><Label htmlFor="retail">{invoiceSettings.priceLabels.retail}</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="wholesale" id="wholesale" /><Label htmlFor="wholesale">{invoiceSettings.priceLabels.wholesale}</Label></div>
                                    </RadioGroup>
                                </div>
                            )
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Cantidad</Label>
                            <Input id="quantity" type="number" value={currentQuantity} onChange={e => setCurrentQuantity(Number(e.target.value))} min="1" inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
                        </div>

                        <Button type="button" onClick={handleAddProduct} className="w-full" disabled={!currentProduct || isSaving}>Añadir Producto a la Venta</Button>
                    </Card>
                </div>

                {soldProducts.length > 0 && (
                     <div className="space-y-2">
                        <Label>Productos en la Venta</Label>
                        <Card>
                            <CardContent className="p-0">
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center">Cant.</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {soldProducts.map((p, index) => (
                                                <TableRow key={p.productId + index}>
                                                    <TableCell>{p.name}</TableCell>
                                                    <TableCell className="text-center">{p.quantity}</TableCell>
                                                    <TableCell className="text-right">RD${p.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">RD${(p.quantity * p.price).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(p.productId)} disabled={isSaving}>
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="md:hidden space-y-3 p-3">
                                    {soldProducts.map((p, index) => (
                                        <div key={p.productId + index} className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold pr-2">{p.name}</p>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveProduct(p.productId)} disabled={isSaving}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>Cant: {p.quantity}</span>
                                                <span>Precio: RD${p.price.toFixed(2)}</span>
                                                <span className="font-medium text-foreground">RD${(p.quantity * p.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                )}
            </div>
            <DialogFooter className="pt-4 mt-4 border-t flex-col sm:flex-row sm:justify-between sm:items-center">
                 <div className="text-right sm:text-left text-xl font-bold">
                    Total: RD${totalAmount.toFixed(2)}
                </div>
                <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                         <Button type="button" variant="secondary" disabled={isSaving}>Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </DialogFooter>
        </form>
    );
};

export default function IngresosPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { incomes, addIncome, deleteIncome, updateIncome, products, clients, addMultipleIncomes, invoiceSettings, addClient } = useAppData();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [selectedIncomeForInvoice, setSelectedIncomeForInvoice] = useState<Income | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 90),
        to: new Date(),
    });
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    const allClients = useMemo(() => [
        { id: 'generic', name: 'Cliente Genérico', code: 'CLI-000', email: '', phone: '', address: '' },
        ...clients
    ], [clients]);

    const filteredIncomes = useMemo(() => {
        let filtered = incomes.filter(income => {
            const incomeDate = new Date(income.date + 'T00:00:00');
            
            if (dateRange?.from && dateRange?.to) {
                const fromDate = new Date(dateRange.from.setHours(0,0,0,0));
                const toDate = new Date(dateRange.to.setHours(23,59,59,999));
                if (incomeDate < fromDate || incomeDate > toDate) {
                    return false;
                }
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
            if (key === 'date') {
                return (new Date(a.date).getTime() - new Date(b.date).getTime()) * directionMultiplier;
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * directionMultiplier;
            }
            return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
        });

    }, [incomes, dateRange, clientSearchTerm, productSearchTerm, allClients, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const clearFilters = () => {
        setDateRange({ from: undefined, to: undefined });
        setClientSearchTerm('');
        setProductSearchTerm('');
    };

    const handleEdit = (income: Income) => {
        setEditingIncome(income);
        setIsDialogOpen(true);
    };

    const handleDelete = async (incomeId: string) => {
        await deleteIncome(incomeId);
    };

    const handleSave = async (incomeData: Income | Omit<Income, 'id'>) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
            return;
        }
        
        if ('id' in incomeData && incomeData.id) {
            await updateIncome(incomeData as Income);
        } else {
            const incomeToSave = { ...incomeData, recordedBy: user.name };
            await addIncome(incomeToSave);
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
            title: 'Factura HOMECLEAN',
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
                const requiredHeaders = ['cantidad', 'preciounitario'];
                const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
                if (missingHeaders.length > 0) {
                    throw new Error(`Faltan las siguientes columnas obligatorias en el CSV: ${missingHeaders.join(', ')}`);
                }

                const transactionsMap = new Map<string, any[]>();
                const rowsWithoutId: any[] = [];

                // Group rows by transaction ID
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(delimiter);
                    const rowData: any = {};
                    headers.forEach((header, index) => {
                        rowData[header] = values[index]?.trim() || '';
                    });

                    const transactionId = rowData.idtransaccion?.trim();

                    if (transactionId) {
                        if (!transactionsMap.has(transactionId)) {
                            transactionsMap.set(transactionId, []);
                        }
                        transactionsMap.get(transactionId)!.push(rowData);
                    } else {
                        // Each row without an ID is its own transaction
                        rowsWithoutId.push(rowData);
                    }
                }
                
                rowsWithoutId.forEach((rowData, index) => {
                    transactionsMap.set(`new_transaction_${Date.now()}_${index}`, [rowData]);
                });
                
                const newIncomes: Omit<Income, 'id'>[] = [];
                const newClientsCache = new Map<string, Client>();
                let allClientsCurrentList = [...allClients];
                
                for (const [transactionId, rows] of transactionsMap.entries()) {
                    if (rows.length === 0) continue;

                    const firstRow = rows[0];
                    const date = firstRow.fecha || format(new Date(), 'yyyy-MM-dd');
                    const clientName = (firstRow.cliente || 'Cliente Genérico').trim();
                    const paymentMethodRaw = (firstRow.metododepago || 'contado').toLowerCase();
                    const paymentMethod = (paymentMethodRaw === 'credito' || paymentMethodRaw === 'contado') ? paymentMethodRaw : 'contado';
                    const recordedBy = firstRow.registradopor?.trim() || user.name;
                    
                    const totalFacturaFromFile = firstRow.totalfactura ? parseFloat(firstRow.totalfactura) : null;
                    if (totalFacturaFromFile !== null && isNaN(totalFacturaFromFile)) {
                        throw new Error(`El Total Factura para la transacción ${transactionId.startsWith('new_transaction_') ? 'nueva' : transactionId} no es un número válido.`);
                    }

                    // Validate data consistency across rows of the same transaction
                    for (const row of rows) {
                        if (row.fecha && row.fecha !== date) throw new Error(`Fechas inconsistentes para transacción ${transactionId}.`);
                        if (row.cliente && row.cliente !== clientName) throw new Error(`Clientes inconsistentes para transacción ${transactionId}.`);
                        if (row.metododepago && row.metododepago.toLowerCase() !== paymentMethod) throw new Error(`Métodos de pago inconsistentes para transacción ${transactionId}.`);
                        if (row.registradopor && row.registradopor.trim() !== recordedBy) throw new Error(`Registradores inconsistentes para transacción ${transactionId}.`);
                    }
                    
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

                    if (!client) {
                        throw new Error(`No se pudo encontrar o crear el cliente "${clientName}" para la transacción ${transactionId}.`);
                    }
                    
                    const soldProducts: SoldProduct[] = [];
                    let calculatedTotal = 0;
                    let rowIndex = 0;

                    for (const row of rows) {
                        rowIndex++;
                        const quantityStr = row.cantidad;
                        const unitPriceStr = row.preciounitario;
                        
                        // A row is only valid if it has quantity and price.
                        if (!quantityStr || !unitPriceStr) {
                            continue;
                        }

                        const quantity = parseFloat(quantityStr);
                        const unitPrice = parseFloat(unitPriceStr);
                        
                        // Check if parsing was successful and values are valid.
                        if (isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice < 0) {
                            continue;
                        }

                        // Default to 'Venta General' if product name is empty
                        const productName = row.producto?.trim() || 'Venta General';
                        
                        const existingProduct = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
                        const productId = existingProduct ? existingProduct.id : `generic_${transactionId}_${rowIndex}`;
                        
                        const subtotalFromFile = row.subtotalproducto ? parseFloat(row.subtotalproducto) : null;
                        if (subtotalFromFile !== null) {
                            if(isNaN(subtotalFromFile)) {
                                throw new Error(`Subtotal para "${productName}" en transacción ${transactionId} no es un número válido.`);
                            }
                            const calculatedSubtotal = quantity * unitPrice;
                            if (Math.abs(calculatedSubtotal - subtotalFromFile) > 0.01) {
                                throw new Error(`Subtotal para "${productName}" (${subtotalFromFile.toFixed(2)}) no coincide con el cálculo (${calculatedSubtotal.toFixed(2)}) en transacción ${transactionId}.`);
                            }
                        }

                        soldProducts.push({
                            productId: productId,
                            name: productName,
                            quantity,
                            price: unitPrice,
                        });
                        calculatedTotal += (quantity * unitPrice);
                    }
                    
                    if (soldProducts.length === 0) {
                        continue;
                    }

                    if (totalFacturaFromFile !== null && Math.abs(calculatedTotal - totalFacturaFromFile) > 0.01) {
                        throw new Error(`Total Factura (${totalFacturaFromFile.toFixed(2)}) no coincide con la suma de subtotales (${calculatedTotal.toFixed(2)}) en transacción ${transactionId}.`);
                    }
                    
                    const isNewTransaction = transactionId.startsWith('new_transaction_');

                    const balance = paymentMethod === 'credito' ? calculatedTotal : 0;
                    const payments: Payment[] = paymentMethod === 'contado' ? [{
                        id: `payment_${Date.now()}`,
                        amount: calculatedTotal,
                        date: date,
                        recordedBy: recordedBy,
                    }] : [];

                    newIncomes.push({
                        id: isNewTransaction ? '' : transactionId,
                        clientId: client.id,
                        paymentMethod: paymentMethod as 'credito' | 'contado',
                        date,
                        products: soldProducts,
                        totalAmount: calculatedTotal,
                        category: 'Venta de Producto',
                        recordedBy: recordedBy,
                        balance: balance,
                        payments: payments
                    });
                }
                
                if (newIncomes.length === 0) {
                    throw new Error("No se encontraron transacciones válidas para importar en el archivo. Verifica el formato y los datos.");
                }

                await addMultipleIncomes(newIncomes as Income[], importMode);

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
                    <CardDescription>Filtra los ingresos por fecha, cliente o producto.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                        
                        <Input
                            placeholder="Buscar por cliente..."
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                            className="w-full md:w-[280px]"
                        />
                        
                        <Input 
                            placeholder="Buscar por producto..." 
                            value={productSearchTerm} 
                            onChange={(e) => setProductSearchTerm(e.target.value)} 
                            className="w-full md:w-[280px]" 
                        />
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
                                        <TableRow key={income.id}>
                                            <TableCell className="font-medium">{client?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <span className="cursor-pointer underline-dashed">{income.products.length} producto(s)</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                        <ul className="list-disc pl-4">
                                                                {income.products.map(p => (
                                                                    <li key={p.productId}>{p.quantity} x {p.name} @ RD${p.price.toFixed(2)}</li>
                                                                ))}
                                                        </ul>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell className="capitalize hidden sm:table-cell">{income.paymentMethod}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{income.recordedBy}</TableCell>
                                            <TableCell className="text-right">RD${income.totalAmount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right hidden md:table-cell">{format(new Date(income.date + 'T00:00:00'), 'PPP', { locale: es })}</TableCell>
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
                    <IncomeForm income={editingIncome} onSave={handleSave} clients={allClients} onClose={() => handleDialogChange(false)} />
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
        </div>
    );
}
