"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/hooks/use-app-data';
import type { Product } from '@/components/app-provider';


export default function ProductosPage() {
    const { products, addProduct, updateProduct, deleteProduct, addMultipleProducts } = useAppData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("El archivo CSV está vacío o solo contiene la cabecera.");

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name', 'sku', 'unit', 'salepriceretail', 'salepricewholesale', 'stock', 'reorderlevel'];
            const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh.replace(/\s+/g, '')));
            if (missingHeaders.length > 0) {
                throw new Error(`Faltan las siguientes columnas en el CSV: ${missingHeaders.join(', ')}`);
            }

            const newProducts: Product[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const productData: any = {};
                headers.forEach((header, index) => {
                    productData[header.replace(/\s+/g, '')] = values[index]?.trim() || '';
                });

                newProducts.push({
                    id: productData.id || '', // Let provider assign ID
                    name: productData.name || 'N/A',
                    sku: productData.sku || 'N/A',
                    unit: productData.unit || 'N/A',
                    salePriceRetail: parseFloat(productData.salepriceretail) || 0,
                    salePriceWholesale: parseFloat(productData.salepricewholesale) || 0,
                    stock: parseInt(productData.stock, 10) || 0,
                    reorderLevel: parseInt(productData.reorderlevel, 10) || 0,
                });
            }
            
            addMultipleProducts(newProducts);

            toast({
                title: "Importación Exitosa",
                description: `${newProducts.length} productos han sido importados.`,
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error de Importación",
                description: error.message || "No se pudo procesar el archivo CSV.",
            });
        }
        };
        reader.onerror = () => {
            toast({
                variant: 'destructive',
                title: 'Error de Lectura',
                description: 'No se pudo leer el archivo.',
            });
        };
        reader.readAsText(file);

        if(event.target) event.target.value = '';
    };


    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsDialogOpen(true);
    };

    const handleDelete = (productId: string) => {
        deleteProduct(productId);
    };

    const handleSave = (product: Product) => {
        if (editingProduct) {
            updateProduct(product);
        } else {
            const { id, ...newProduct } = product;
            addProduct(newProduct);
        }
        setEditingProduct(null);
        setIsDialogOpen(false);
    };

    const ProductForm = ({ product, onSave }: { product: Product | null, onSave: (product: Product) => void }) => {
        const [formData, setFormData] = useState(product || {
            name: '', sku: '', unit: '', salePriceRetail: 0, salePriceWholesale: 0, stock: 0, reorderLevel: 0
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { id, value, type } = e.target;
            setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...formData, id: product?.id || '' });
        }
        
        return (
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" value={formData.sku} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input id="stock" type="number" value={formData.stock} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unidad</Label>
                            <Input id="unit" value={formData.unit} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="salePriceRetail">Precio Detalle</Label>
                            <Input id="salePriceRetail" type="number" value={formData.salePriceRetail} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salePriceWholesale">Precio Por Mayor</Label>
                            <Input id="salePriceWholesale" type="number" value={formData.salePriceWholesale} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Nivel Reorden</Label>
                        <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} required/>
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                         <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">Guardar</Button>
                </DialogFooter>
            </form>
        );
    };

    return (
        <div className="space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
             <div className="flex justify-end items-start gap-2">
                <Button variant="outline" onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Productos
                </Button>
                <Button onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Producto
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Productos Terminados</CardTitle>
                    <CardDescription>Un listado de todos tus productos listos para la venta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right hidden md:table-cell">Precio Detalle</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
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
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este producto?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el producto de tus registros.
                                                </AlertDialogDescription>
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
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Producto' : 'Añadir Producto'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Actualiza los detalles de tu producto.' : 'Añade un nuevo producto a tu inventario.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm product={editingProduct} onSave={handleSave} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
