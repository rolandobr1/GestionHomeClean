
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Income, SoldProduct, Client } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { ContactForm } from '@/components/contact-form';
import { Combobox } from '@/components/ui/combobox';

interface IncomeFormProps {
  income?: Income | null;
  onSave: (incomeData: Omit<Income, 'id' | 'balance' | 'payments' | 'recordedBy'> | Income) => Promise<void>;
  onClose: () => void;
}

export const IncomeForm = ({ income = null, onSave, onClose }: IncomeFormProps) => {
    const { products: allProducts, clients: allClients, invoiceSettings, addClient } = useAppData();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
    
    // Form state
    const [clientId, setClientId] = useState('generic');
    const [paymentMethod, setPaymentMethod] = useState<'contado' | 'credito'>('contado');
    const [paymentType, setPaymentType] = useState('');
    const [date, setDate] = useState('');
    const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
    
    // Product addition state
    const [currentProduct, setCurrentProduct] = useState('');
    const [currentQuantity, setCurrentQuantity] = useState(1);
    const [currentPriceType, setCurrentPriceType] = useState<'retail' | 'wholesale'>('retail');
    const [genericProductName, setGenericProductName] = useState('');
    const [genericProductPrice, setGenericProductPrice] = useState<number | string>('');

    const clientOptions = useMemo(() => {
        const sortedClients = [...allClients].sort((a, b) => a.name.localeCompare(b.name));
        const options = sortedClients.map(client => ({
            value: client.id,
            label: client.name
        }));
        // Add generic client at the top
        return [{ value: 'generic', label: 'Cliente Genérico' }, ...options];
    }, [allClients]);

    useEffect(() => {
        if (income) {
            setClientId(income.clientId);
            setPaymentMethod(income.paymentMethod);
            setPaymentType(income.paymentType || (invoiceSettings.paymentMethods[0] || ''));
            setDate(format(new Date(income.date + 'T00:00:00'), 'yyyy-MM-dd'));
            setSoldProducts(income.products);
        } else {
            // Reset to default state
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
                name: genericProductName || 'Producto Genérico',
                quantity: currentQuantity,
                price: Number(genericProductPrice),
            };
            setSoldProducts([...soldProducts, newProduct]);
            setGenericProductName('');
            setGenericProductPrice('');
        } else {
            const product = allProducts.find(p => p.id === currentProduct);
            if (!product || currentQuantity <= 0) {
                 toast({ variant: "destructive", title: "Datos Inválidos", description: "Selecciona un producto y una cantidad válida." });
                return;
            }

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
            toast({ variant: "destructive", title: "Venta Vacía", description: "Debes agregar al menos un producto." });
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
                 await onSave({ ...income, ...dataToSave });
            } else {
                await onSave(dataToSave);
            }
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleSaveNewClient = async (clientData: Omit<Client, 'id' | 'code'>) => {
        try {
            const newClient = await addClient(clientData);
            if (newClient) {
                toast({ title: "Cliente Añadido", description: `El cliente "${newClient.name}" ha sido creado y seleccionado.` });
                setClientId(newClient.id); // Automatically select the new client
                setIsClientDialogOpen(false); // Close the dialog
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el nuevo cliente.' });
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="clientId-form">Cliente</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsClientDialogOpen(true)} className="h-7 -mr-2">
                                    <UserPlus className="h-4 w-4 mr-1"/>
                                    Nuevo
                                </Button>
                            </div>
                            <Combobox
                                options={clientOptions}
                                value={clientId}
                                onValueChange={setClientId}
                                placeholder="Selecciona un cliente"
                                searchPlaceholder="Buscar cliente..."
                                emptyMessage="No se encontraron clientes."
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date-form">Fecha</Label>
                            <Input id="date-form" type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod-form">Condición de Pago</Label>
                            <Select onValueChange={(value: 'contado' | 'credito') => setPaymentMethod(value)} value={paymentMethod} disabled={isSaving}>
                                <SelectTrigger id="paymentMethod-form">
                                    <SelectValue placeholder="Selecciona un método" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="contado">Contado</SelectItem>
                                    <SelectItem value="credito">Crédito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {paymentMethod === 'contado' && (
                            <div className="space-y-2">
                                <Label htmlFor="paymentType-form">Método de Pago</Label>
                                <Select onValueChange={setPaymentType} value={paymentType} disabled={isSaving}>
                                    <SelectTrigger id="paymentType-form">
                                        <SelectValue placeholder="Selecciona un tipo" />
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
                                <Select onValueChange={setCurrentProduct} value={currentProduct} disabled={isSaving}>
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
                                        <Label htmlFor="generic-name-form">Nombre del Producto</Label>
                                        <Input id="generic-name-form" value={genericProductName} onChange={e => setGenericProductName(e.target.value)} placeholder="Ej: Vaso Desechable" disabled={isSaving}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="generic-price-form">Precio Unitario</Label>
                                        <Input id="generic-price-form" type="number" value={genericProductPrice} onChange={e => setGenericProductPrice(e.target.value)} placeholder="0.00" inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
                                    </div>
                                </div>
                            ) : (
                                currentProduct && (
                                    <div className="space-y-2">
                                        <Label>Tipo de Precio</Label>
                                        <RadioGroup value={currentPriceType} onValueChange={(value: 'retail' | 'wholesale') => setCurrentPriceType(value)} className="flex gap-4" disabled={isSaving}>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="retail" id="retail-form" /><Label htmlFor="retail-form">{invoiceSettings.priceLabels.retail}</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="wholesale" id="wholesale-form" /><Label htmlFor="wholesale-form">{invoiceSettings.priceLabels.wholesale}</Label></div>
                                        </RadioGroup>
                                    </div>
                                )
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="quantity-form">Cantidad</Label>
                                <Input id="quantity-form" type="number" value={currentQuantity} onChange={e => setCurrentQuantity(Number(e.target.value))} min="1" inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
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

            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
                        <DialogDescription>
                            Crea un nuevo cliente que se seleccionará automáticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <ContactForm 
                        contact={null} 
                        onSave={handleSaveNewClient as (contactData: any) => Promise<void>} 
                        onClose={() => setIsClientDialogOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};
