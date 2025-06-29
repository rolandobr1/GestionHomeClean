"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
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

type Product = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  reorderLevel: number;
};

export const initialProducts: Product[] = [
  { id: '1', name: 'Ácido Clorhídrico', sku: 'AC-001', unit: 'Litros', purchasePrice: 5.5, salePrice: 10.0, stock: 150, reorderLevel: 20 },
  { id: '2', name: 'Hipoclorito de Sodio', sku: 'HS-002', unit: 'Galones', purchasePrice: 12.0, salePrice: 25.0, stock: 80, reorderLevel: 15 },
  { id: '3', name: 'Sosa Cáustica (Escamas)', sku: 'SC-001', unit: 'Kg', purchasePrice: 8.2, salePrice: 15.5, stock: 200, reorderLevel: 50 },
  { id: '4', name: 'Peróxido de Hidrógeno', sku: 'PH-001', unit: 'Litros', purchasePrice: 7.0, salePrice: 14.0, stock: 45, reorderLevel: 30 },
];

export default function ProductosPage() {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsDialogOpen(true);
    };

    const handleDelete = (productId: string) => {
        setProducts(products.filter(p => p.id !== productId));
    };

    const handleSave = (product: Product) => {
        if (editingProduct) {
            setProducts(products.map(p => p.id === product.id ? product : p));
        } else {
            setProducts([...products, { ...product, id: (products.length + 1).toString() }]);
        }
        setEditingProduct(null);
        setIsDialogOpen(false);
    };

    const ProductForm = ({ product, onSave }: { product: Product | null, onSave: (product: Product) => void }) => {
        const [formData, setFormData] = useState<Omit<Product, 'id'>>(product || {
            name: '', sku: '', unit: '', purchasePrice: 0, salePrice: 0, stock: 0, reorderLevel: 0
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { id, value, type } = e.target;
            setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) : value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...formData, id: product?.id || '' });
        }
        
        return (
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sku" className="text-right">SKU</Label>
                        <Input id="sku" value={formData.sku} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">Stock</Label>
                        <Input id="stock" type="number" value={formData.stock} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">Unidad</Label>
                        <Input id="unit" value={formData.unit} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="salePrice" className="text-right">Precio Venta</Label>
                        <Input id="salePrice" type="number" value={formData.salePrice} onChange={handleChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reorderLevel" className="text-right">Nivel Reorden</Label>
                        <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} className="col-span-3" />
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
             <div className="flex justify-end items-start">
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
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Precio Venta</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell className="text-right">
                                        {product.stock <= product.reorderLevel ? (
                                            <Badge variant="destructive">{product.stock} {product.unit}</Badge>
                                        ) : (
                                            <Badge variant="secondary">{product.stock} {product.unit}</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">RD${product.salePrice.toFixed(2)}</TableCell>
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
