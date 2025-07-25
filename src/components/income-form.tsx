
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
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClientSelectorModal } from './client-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    const selectedClientId = watch('clientId');
    
    useEffect(() => {
        if (income) {
            form.reset({
                clientId: income.clientId || 'generic',
                date: format(new Date(income.date + 'T00:00:00'), 'yyyy-MM-dd'),
                paymentMethod: income.paymentMethod || 'contado',
                paymentType: income.paymentType || (invoiceSettings.paymentMethods[0] || ''),
                products: income.products || [],
            });
        }
    }, [income, form, invoiceSettings.paymentMethods]);


    const handleAddProduct = (product: Product) => {
      const existingProductIndex = fields.findIndex(
        p => p.productId === product.id && p.price === product.salePriceRetail
      );

      if (existingProductIndex > -1) {
        const existingField = fields[existingProductIndex];
        update(existingProductIndex, {
          ...existingField,
          quantity: existingField.quantity + 1,
        });
      } else {
        append({
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.salePriceRetail,
        });
      }
    };
    
    const handleAddGenericProduct = () => {
        append({
            productId: `generic_${Date.now()}`,
            name: 'Producto Genérico',
            quantity: 1,
            price: 0
        });
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
                                        <TableHead className="w-[60%]">Producto</TableHead>
                                        <TableHead className="w-[15%] text-center">Cant.</TableHead>
                                        <TableHead className="w-[20%] text-right">Precio</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
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
                                                <Input
                                                    type="number"
                                                    value={field.price}
                                                    onChange={(e) => update(index, { ...field, price: Number(e.target.value) })}
                                                    className="h-8 text-right"
                                                    readOnly={!field.productId.startsWith('generic_')}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)} disabled={isSaving}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {errors.products && <p className="text-sm font-medium text-destructive">{errors.products.message || errors.products.root?.message}</p>}
                        
                        <div className="flex gap-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full" type="button">
                                        <Search className="mr-2 h-4 w-4" /> Buscar Producto
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar por nombre o SKU..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                            <CommandGroup>
                                                {allProducts.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.name}
                                                    onSelect={() => handleAddProduct(product)}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", soldProducts.some(p => p.productId === product.id) ? "opacity-100" : "opacity-0")}/>
                                                    <span>{product.name}</span>
                                                </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                             <Button variant="secondary" type="button" onClick={handleAddGenericProduct}>Producto Genérico</Button>
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
    );
};
