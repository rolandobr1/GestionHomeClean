"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, FileText, Share2, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { initialProducts } from '../../inventario/productos/page';
import { useFinancialData } from '@/hooks/use-financial-data';
import type { Income, SoldProduct } from '@/components/financial-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toJpeg, toBlob } from 'html-to-image';
import { InvoiceTemplate } from '@/components/invoice-template';
import { useToast } from "@/hooks/use-toast";


type Client = {
  id: string;
  name: string;
};

const initialClients: Client[] = [
  { id: '1', name: 'Laboratorios Alfa' },
  { id: '2', name: 'Farmacia San José' },
  { id: '3', name: 'Industrias del Caribe' },
];

export const allClients = [
    { id: 'generic', name: 'Cliente Genérico' },
    ...initialClients
];

const IncomeForm = ({ income, onSave }: { income: Income | null, onSave: (income: Income) => void }) => {
    const [clientId, setClientId] = useState('generic');
    const [paymentMethod, setPaymentMethod] = useState<'contado' | 'credito'>('contado');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
    
    const [currentProduct, setCurrentProduct] = useState('');
    const [currentQuantity, setCurrentQuantity] = useState(1);
    const [currentPriceType, setCurrentPriceType] = useState<'retail' | 'wholesale'>('retail');

    useEffect(() => {
        if (income) {
            setClientId(income.clientId);
            setPaymentMethod(income.paymentMethod);
            setDate(income.date);
            setSoldProducts(income.products);
        } else {
            setClientId('generic');
            setPaymentMethod('contado');
            setDate(new Date().toISOString().split('T')[0]);
            setSoldProducts([]);
        }
    }, [income]);

    const handleAddProduct = () => {
        const product = initialProducts.find(p => p.id === currentProduct);
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
        
        setCurrentProduct('');
        setCurrentQuantity(1);
        setCurrentPriceType('retail');
    };

    const handleRemoveProduct = (productId: string) => {
        setSoldProducts(soldProducts.filter(p => p.productId !== productId));
    };

    const totalAmount = soldProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (soldProducts.length === 0) {
             alert("Debes agregar al menos un producto.");
            return;
        }

        onSave({
            id: income?.id || '',
            clientId,
            paymentMethod,
            date,
            products: soldProducts,
            totalAmount,
            category: 'Venta de Producto',
        });
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="clientId">Cliente</Label>
                        <Select onValueChange={setClientId} value={clientId}>
                            <SelectTrigger id="clientId">
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {allClients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Método Pago</Label>
                        <Select onValueChange={(value: 'contado' | 'credito') => setPaymentMethod(value)} value={paymentMethod}>
                            <SelectTrigger id="paymentMethod">
                                <SelectValue placeholder="Selecciona un método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contado">Contado</SelectItem>
                                <SelectItem value="credito">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-2">
                    <Label>Añadir Productos</Label>
                    <Card className="p-4 space-y-4 bg-muted/50">
                        <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2 col-span-2">
                                <Label htmlFor="productId-form">Producto</Label>
                                <Select onValueChange={setCurrentProduct} value={currentProduct}>
                                    <SelectTrigger id="productId-form">
                                        <SelectValue placeholder="Selecciona un producto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {initialProducts.map(product => (
                                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="quantity">Cantidad</Label>
                                <Input id="quantity" type="number" value={currentQuantity} onChange={e => setCurrentQuantity(Number(e.target.value))} min="1" />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Tipo de Precio</Label>
                            <RadioGroup value={currentPriceType} onValueChange={(value: 'retail' | 'wholesale') => setCurrentPriceType(value)} className="flex gap-4">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="retail" id="retail" /><Label htmlFor="retail">Detalle</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="wholesale" id="wholesale" /><Label htmlFor="wholesale">Por Mayor</Label></div>
                            </RadioGroup>
                        </div>
                        <Button type="button" onClick={handleAddProduct} className="w-full" disabled={!currentProduct}>Añadir Producto a la Venta</Button>
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
                                            {soldProducts.map(p => (
                                                <TableRow key={p.productId}>
                                                    <TableCell>{p.name}</TableCell>
                                                    <TableCell className="text-center">{p.quantity}</TableCell>
                                                    <TableCell className="text-right">RD${p.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">RD${(p.quantity * p.price).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(p.productId)}>
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="md:hidden space-y-3 p-3">
                                    {soldProducts.map(p => (
                                        <div key={p.productId} className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold pr-2">{p.name}</p>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveProduct(p.productId)}>
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
            <div className="pt-4 mt-4 border-t">
                <div className="text-right text-xl font-bold">
                    Total: RD${totalAmount.toFixed(2)}
                </div>
            </div>
            <DialogFooter className="pt-4">
                <DialogClose asChild>
                     <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar</Button>
            </DialogFooter>
        </form>
    );
};

export default function IngresosPage() {
    const { incomes, addIncome, deleteIncome, updateIncome } = useFinancialData();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [selectedIncomeForInvoice, setSelectedIncomeForInvoice] = useState<Income | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handleEdit = (income: Income) => {
        setEditingIncome(income);
        setIsDialogOpen(true);
    };

    const handleDelete = (incomeId: string) => {
        deleteIncome(incomeId);
    };

    const handleSave = (income: Income) => {
        if (editingIncome) {
            updateIncome(income);
        } else {
            const { id, ...newIncomeData } = income;
            addIncome(newIncomeData);
        }
        setEditingIncome(null);
        setIsDialogOpen(false);
    };

    const handleGenerateInvoice = (income: Income) => {
        setSelectedIncomeForInvoice(income);
        setIsInvoiceOpen(true);
    };

    const handleDownloadJpg = async () => {
        if (!invoiceRef.current || !selectedIncomeForInvoice) return;

        try {
            const dataUrl = await toJpeg(invoiceRef.current, { backgroundColor: 'white', pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `factura-${selectedIncomeForInvoice.id.slice(-6)}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error al Descargar',
                description: 'No se pudo generar el archivo JPG.',
            });
        }
    };

    const handleShare = async () => {
        if (!invoiceRef.current || !selectedIncomeForInvoice) return;
        if (!navigator.share) {
          toast({
            variant: 'destructive',
            title: 'No Soportado',
            description: 'Tu navegador no soporta la función de compartir.',
          });
          return;
        }
    
        try {
          const blob = await toBlob(invoiceRef.current, { backgroundColor: 'white', pixelRatio: 2 });
          if (!blob) {
            throw new Error('No se pudo generar la imagen.');
          }
          const file = new File([blob], `factura-${selectedIncomeForInvoice.id.slice(-6)}.jpg`, { type: 'image/jpeg' });
          
          await navigator.share({
            title: 'Factura QuimioGest',
            text: `Aquí está tu factura de QuimioGest.`,
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

    return (
        <div className="space-y-6">
             <div className="flex justify-end items-start">
                <Button onClick={() => { setEditingIncome(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Ingreso
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Ingresos</CardTitle>
                    <CardDescription>Un listado de todas tus transacciones de ingresos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Productos</TableHead>
                                <TableHead className="hidden sm:table-cell">Método</TableHead>
                                <TableHead className="text-right">Monto Total</TableHead>
                                <TableHead className="text-right hidden md:table-cell">Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incomes.map((income) => {
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
                                    <TableCell className="text-right">RD${income.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right hidden md:table-cell">{format(new Date(income.date), 'PPP', { locale: es })}</TableCell>
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
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este ingreso?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del ingreso.
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
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingIncome(null); setIsDialogOpen(isOpen);}}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingIncome ? 'Editar Ingreso' : 'Añadir Ingreso'}</DialogTitle>
                        <DialogDescription>
                            {editingIncome ? 'Actualiza los detalles de tu ingreso.' : 'Añade un nuevo ingreso a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <IncomeForm income={editingIncome} onSave={handleSave} />
                </DialogContent>
            </Dialog>

            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogContent className="max-w-4xl p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Vista Previa de Factura</DialogTitle>
                        <DialogDescription>
                            Puedes descargar la factura como imagen o compartirla directamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-2">
                       {selectedIncomeForInvoice && <InvoiceTemplate ref={invoiceRef} income={selectedIncomeForInvoice} />}
                    </div>
                    <DialogFooter className="p-6 bg-muted/50 flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Button variant="outline" onClick={handleDownloadJpg}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar JPG
                        </Button>
                        <Button onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
