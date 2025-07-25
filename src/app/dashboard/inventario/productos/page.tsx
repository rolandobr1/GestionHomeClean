
"use client";

import React, { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Upload, Download, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/hooks/use-app-data';
import type { Product } from '@/components/app-provider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/use-auth';
import { InventoryForm } from '@/components/inventory-form';
import { useSort } from '@/hooks/use-sort';
import { useCsvExport } from '@/hooks/use-csv-export';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function ProductosPage() {
    const { products, addProduct, updateProduct, deleteProduct, addMultipleProducts } = useAppData();
    const { user } = useAuth();
    const { toast } = useToast();
    const { downloadCSV } = useCsvExport();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

    const [isPending, startTransition] = useTransition();
    const { sortedData: sortedProducts, handleSort, renderSortArrow } = useSort(products, 'name');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
        let addedCount = 0;
        let skippedCount = 0;
        try {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("El archivo CSV está vacío o solo contiene la cabecera.");

            const headerLine = lines[0];
            const commaCount = (headerLine.match(/,/g) || []).length;
            const semicolonCount = (headerLine.match(/;/g) || []).length;
            const delimiter = semicolonCount > commaCount ? ';' : ',';

            const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
            const requiredHeaders = ['name', 'unit', 'salepriceretail', 'salepricewholesale', 'stock'];
            const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh.replace(/\s+/g, '')));
            if (missingHeaders.length > 0) {
                throw new Error(`Faltan las siguientes columnas obligatorias en el CSV: ${missingHeaders.join(', ')}`);
            }

            const newProducts: Omit<Product, 'id'>[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter);
                const productData: any = {};
                headers.forEach((header, index) => {
                    productData[header.replace(/\s+/g, '')] = values[index]?.trim() || '';
                });

                if (!productData.name || !productData.unit || !productData.salepriceretail || !productData.salepricewholesale || !productData.stock) {
                    skippedCount++;
                    continue;
                }

                newProducts.push({
                    name: productData.name,
                    sku: productData.sku || '',
                    unit: productData.unit,
                    salePriceRetail: parseFloat(productData.salepriceretail) || 0,
                    salePriceWholesale: parseFloat(productData.salepricewholesale) || 0,
                    stock: parseInt(productData.stock, 10) || 0,
                    reorderLevel: parseInt(productData.reorderlevel, 10) || 0,
                });
                addedCount++;
            }
            
            if (addedCount > 0) {
                await addMultipleProducts(newProducts, importMode);
            }
            
            toast({ 
                title: "Importación Completada", 
                description: `${addedCount} productos importados. ${skippedCount > 0 ? `${skippedCount} filas omitidas.` : ''}`
            });

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error de Importación", description: error.message });
        }
        };
        reader.onerror = () => toast({ variant: 'destructive', title: 'Error de Lectura' });
        reader.readAsText(file);
        if(event.target) event.target.value = '';
    };

    const handleImportClick = () => setIsImportAlertOpen(true);
    
    const triggerFileInput = (mode: 'append' | 'replace') => {
        setImportMode(mode);
        fileInputRef.current?.click();
    };

    const handleExport = () => {
        const dataToExport = products.map(({ id, ...rest }) => rest);
        const headers = ['name', 'sku', 'unit', 'salePriceRetail', 'salePriceWholesale', 'stock', 'reorderLevel'];
        downloadCSV(dataToExport, headers, 'productos.csv');
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingProduct(null);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setEditingProduct(null);
        setIsDialogOpen(false);
    }

    const handleDelete = (productId: string) => {
        deleteProduct(productId);
    };

    const handleSave = async (productData: Omit<Product, 'id'> | Product, stockAdjustment: number = 0) => {
        try {
            if ('id' in productData && productData.id) {
                await updateProduct(productData as Product, stockAdjustment);
                toast({ title: "Producto Actualizado" });
            } else {
                await addProduct(productData as Omit<Product, 'id'>);
                toast({ title: "Producto Añadido" });
            }
            handleDialogClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al guardar' });
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
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Producto
                </Button>
            </div>

            <Card>
                <Collapsible defaultOpen={true}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Productos Terminados</CardTitle>
                                <CardDescription>Un listado de todos tus productos listos para la venta.</CardDescription>
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
                            <div className="relative">
                                {isPending && (
                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                )}
                                <Table className={cn(isPending && "opacity-50")}>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                                                <div className="flex items-center">Nombre {renderSortArrow('name')}</div>
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('sku')} className="hidden sm:table-cell cursor-pointer">
                                                <div className="flex items-center">SKU {renderSortArrow('sku')}</div>
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('stock')} className="text-right cursor-pointer">
                                                <div className="flex items-center justify-end">Stock {renderSortArrow('stock')}</div>
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('salePriceRetail')} className="text-right hidden md:table-cell cursor-pointer">
                                                <div className="flex items-center justify-end">Precio Detalle {renderSortArrow('salePriceRetail')}</div>
                                            </TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{product.sku}</TableCell>
                                                <TableCell className="text-right">
                                                    {product.stock <= product.reorderLevel ? (
                                                        <Badge variant="destructive">{product.stock} {product.unit}</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{product.stock} {product.unit}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right hidden md:table-cell">RD${product.salePriceRetail.toFixed(2)}</TableCell>
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
                                                                <DropdownMenuItem onClick={() => handleEdit(product)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                                {user?.role === 'admin' && (
                                                                    <AlertDialogTrigger asChild>
                                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                                    </AlertDialogTrigger>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
                                                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Producto' : 'Añadir Producto'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Actualiza los detalles de tu producto.' : 'Añade un nuevo producto a tu inventario.'}
                        </DialogDescription>
                    </DialogHeader>
                    <InventoryForm item={editingProduct} itemType="product" onSave={handleSave} onClose={handleDialogClose} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Puedes añadir los nuevos productos a los existentes o reemplazar todos los datos actuales.
                            <br/>
                            <span className="font-bold text-destructive">¡Reemplazar borrará permanentemente todos los productos actuales!</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => triggerFileInput('append')}>Añadir a Registros</AlertDialogAction>
                        <AlertDialogAction onClick={() => triggerFileInput('replace')} className="bg-destructive hover:bg-destructive/90">Reemplazar Todo</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
