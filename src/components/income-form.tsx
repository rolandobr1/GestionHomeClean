
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Income, SoldProduct, Product } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Trash2, Search, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClientSelectorModal } from './client-selector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const incomeFormSchema = z.object({
  clientId: z.string().min(1, "Debes seleccionar un cliente."),
  date: z.string().min(1, "La fecha es obligatoria."),
  paymentMethod: z.enum(['contado', 'credito']),
  paymentType: z.string().optional(),
  products: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().min(1, "La cantidad debe ser al menos 1."),
    price: z.number(),
    priceType: z.enum(['retail', 'wholesale']).optional().default('retail'),
  })).min(1, "Debes añadir al menos un producto."),
});

type IncomeFormValues = z.infer<typeof incomeFormSchema>;

interface IncomeFormProps {
  income?: Income | null;
  onSave: (incomeData: Omit<Income, 'id' | 'balance' | 'payments' | 'recordedBy'> | Income) => Promise<void>;
  onClose: () => void;
}

export const IncomeForm = ({ income = null, onSave, onClose }: IncomeFormProps) => {
    const { products: allProducts, invoiceSettings } = useAppData();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");

    const form = useForm<IncomeFormValues>({
      resolver: zodResolver(incomeFormSchema),
      defaultValues: {
        clientId: 'generic',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'contado',
        paymentType: invoiceSettings.paymentMethods[0] || '',
        products: [],
      }
    });

    const { control, watch, setValue, formState: { errors } } = form;
    const { fields, append, remove, update } = useFieldArray({
      control,
      name: "products",
    });

    const soldProducts = watch('products');
    const paymentMethod = watch('paymentMethod');
    
    useEffect(() => {
        if (income) {
            form.reset({
                clientId: income.clientId || 'generic',
                date: format(new Date(income.date + 'T00:00:00'), 'yyyy-MM-dd'),
                paymentMethod: income.paymentMethod || 'contado',
                paymentType: income.paymentType || (invoiceSettings.paymentMethods[0] || ''),
                products: income.products.map(p => ({...p, priceType: 'retail'})) || [],
            });
        }
    }, [income, form, invoiceSettings.paymentMethods]);

    const filteredProducts = useMemo(() => {
        if (!productSearchTerm) return allProducts;
        return allProducts.filter(p => 
            p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
    }, [productSearchTerm, allProducts]);

    const handleAddProduct = (product: Product) => {
      const existingProductIndex = fields.findIndex(
        p => p.productId === product.id
      );

      if (existingProductIndex > -1) {
        const existingField = fields[existingProductIndex];
        update(existingProductIndex, {
          ...existingField,
          quantity: existingField.quantity + 1,
        });
         toast({
          title: "Cantidad actualizada",
          description: `Se aumentó la cantidad de "${product.name}".`,
        });
      } else {
        append({
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.salePriceRetail,
          priceType: 'retail',
        });
         toast({
          title: "Producto añadido",
          description: `"${product.name}" ha sido añadido a la factura.`,
        });
      }
    };
    
    const handleAddGenericProduct = () => {
        append({
            productId: `generic_${Date.now()}`,
            name: 'Producto Genérico',
            quantity: 1,
            price: 0,
            priceType: 'retail'
        });
        setIsProductSelectorOpen(false);
    }
    
    const handlePriceTypeChange = (index: number, newPriceType: 'retail' | 'wholesale') => {
        const productInForm = fields[index];
        const originalProduct = allProducts.find(p => p.id === productInForm.productId);

        if (originalProduct) {
            const newPrice = newPriceType === 'retail' ? originalProduct.salePriceRetail : originalProduct.salePriceWholesale;
            update(index, {
                ...productInForm,
                price: newPrice,
                priceType: newPriceType
            });
        }
    }

    const totalAmount = useMemo(() => {
      return soldProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    }, [soldProducts]);

    const handleSubmit = async (values: IncomeFormValues) => {
        setIsSaving(true);
        try {
            const dataToSave = {
                ...values,
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
    
    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <ClientSelectorModal 
                                            selectedClientId={field.value} 
                                            onClientSelect={field.onChange}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel>Fecha</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} required disabled={isSaving}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <FormField
                                control={control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel>Condición de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un método" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="contado">Contado</SelectItem>
                                                <SelectItem value="credito">Crédito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {paymentMethod === 'contado' && (
                                <FormField
                                    control={control}
                                    name="paymentType"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Método de Pago</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {invoiceSettings.paymentMethods.map(method => (
                                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        
                        <Separator />

                        <div className="space-y-2">
                            <Label>Productos en la Venta</Label>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50%]">Producto</TableHead>
                                            <TableHead className="w-[15%] text-center">Cant.</TableHead>
                                            <TableHead className="w-[25%] text-right">Precio</TableHead>
                                            <TableHead className="w-[10%]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.length > 0 ? (
                                            fields.map((field, index) => (
                                                <TableRow key={field.id}>
                                                    <TableCell>
                                                        {field.productId.startsWith('generic_') ? (
                                                            <Input
                                                                value={field.name}
                                                                onChange={(e) => update(index, { ...field, name: e.target.value })}
                                                                placeholder="Nombre del producto"
                                                                className="h-8"
                                                            />
                                                        ) : field.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={field.quantity}
                                                            onChange={(e) => update(index, { ...field, quantity: Number(e.target.value) })}
                                                            className="h-8 text-center"
                                                            min="1"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Input
                                                                type="number"
                                                                value={field.price}
                                                                onChange={(e) => update(index, { ...field, price: Number(e.target.value) })}
                                                                className="h-8 text-right"
                                                                readOnly={!field.productId.startsWith('generic_')}
                                                            />
                                                            {!field.productId.startsWith('generic_') && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                                                                            {field.priceType === 'retail' ? invoiceSettings.priceLabels.retail : invoiceSettings.priceLabels.wholesale}
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onClick={() => handlePriceTypeChange(index, 'retail')}>
                                                                            {invoiceSettings.priceLabels.retail}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handlePriceTypeChange(index, 'wholesale')}>
                                                                            {invoiceSettings.priceLabels.wholesale}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)} disabled={isSaving}>
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                    Añade productos a la factura.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {errors.products && <p className="text-sm font-medium text-destructive">{errors.products.message || errors.products.root?.message}</p>}
                            
                            <div className="flex gap-2">
                                <Button variant="outline" className="w-full" type="button" onClick={() => setIsProductSelectorOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir/Buscar Producto
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 mt-4 border-t flex-col sm:flex-row sm:justify-between sm:items-center">
                        <div className="text-right sm:text-left text-xl font-bold">
                            Total: RD${totalAmount.toFixed(2)}
                        </div>
                        <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
                        </div>
                    </DialogFooter>
                </form>
            </Form>

            <Dialog open={isProductSelectorOpen} onOpenChange={setIsProductSelectorOpen}>
                <DialogContent className="sm:max-w-md flex flex-col h-[70vh]">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Producto</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o SKU..."
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <ScrollArea className="flex-grow -mx-6">
                        <div className="px-6 space-y-1">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => handleAddProduct(product)}
                                    className="p-2 -mx-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                                >
                                    <div className="flex justify-between">
                                        <span className="font-medium">{product.name}</span>
                                        <span className="text-muted-foreground">RD${product.salePriceRetail.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Stock: {product.stock} {product.unit} &middot; SKU: {product.sku || 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-2 flex-col-reverse sm:flex-row gap-2">
                        <Button type="button" variant="secondary" className="w-full" onClick={handleAddGenericProduct}>
                           Añadir Producto Genérico
                        </Button>
                         <Button type="button" className="w-full" onClick={() => setIsProductSelectorOpen(false)}>
                           Listo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
