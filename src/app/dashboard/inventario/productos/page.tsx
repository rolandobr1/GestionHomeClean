
"use client";

import React, { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Upload, Download, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/use-auth';


export default function ProductosPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { products, addProduct, updateProduct, deleteProduct, addMultipleProducts } = useAppData();
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * directionMultiplier;
            }
            return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
        });
    }, [products, sortConfig]);

    const handleSort = (key: keyof Product) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const renderSortArrow = (key: keyof Product) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
        }
        return null;
    };


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
            const requiredHeaders = ['name', 'sku', 'unit', 'salepriceretail', 'salepricewholesale', 'stock', 'reorderlevel'];
            const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh.replace(/\s+/g, '')));
            if (missingHeaders.length > 0) {
                throw new Error(`Faltan las siguientes columnas en el CSV: ${missingHeaders.join(', ')}`);
            }

            const newProducts: Omit<Product, 'id'>[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter);
                const productData: any = {};
                headers.forEach((header, index) => {
                    productData[header.replace(/\s+/g, '')] = values[index]?.trim() || '';
                });

                newProducts.push({
                    name: productData.name || 'N/A',
                    sku: productData.sku || 'N/A',
                    unit: productData.unit || 'N/A',
                    salePriceRetail: parseFloat(productData.salepriceretail) || 0,
                    salePriceWholesale: parseFloat(productData.salepricewholesale) || 0,
                    stock: parseInt(productData.stock, 10) || 0,
                    reorderLevel: parseInt(productData.reorderlevel, 10) || 0,
                });
            }
            
            await addMultipleProducts(newProducts, importMode);

            toast({
                title: "Importación Exitosa",
                description: `${newProducts.length} productos han sido importados en modo '${importMode === 'append' ? 'Añadir' : 'Reemplazar'}'.`,
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
        setIsImportAlertOpen(true);
    };
    
    const triggerFileInput = (mode: 'append' | 'replace') => {
        setImportMode(mode);
        fileInputRef.current?.click();
    };

    const convertArrayOfObjectsToCSV = (data: any[]) => {
        if (data.length === 0) return '';
        const columnDelimiter = ',';
        const lineDelimiter = '\n';
        const keys = Object.keys(data[0]);
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
        if (products.length === 0) {
            toast({ title: 'No hay datos', description: 'No hay productos para exportar.', variant: 'destructive' });
            return;
        }
        const dataToExport = products.map(({ id, ...rest }) => rest);
        const csvString = convertArrayOfObjectsToCSV(dataToExport);
        downloadCSV(csvString, 'productos.csv');
        toast({ title: 'Exportación Exitosa', description: 'Tus productos han sido descargados.' });
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
                            <Input id="stock" type="number" value={formData.stock} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unidad</Label>
                            <Input id="unit" value={formData.unit} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="salePriceRetail">Precio Detalle</Label>
                            <Input id="salePriceRetail" type="number" value={formData.salePriceRetail} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salePriceWholesale">Precio Por Mayor</Label>
                            <Input id="salePriceWholesale" type="number" value={formData.salePriceWholesale} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Nivel Reorden</Label>
                        <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()}/>
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
        <>
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
                <Button onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
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
                            <Table>
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
                    </CollapsibleContent>
                </Collapsible>
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

            <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Puedes añadir los nuevos productos a los existentes o reemplazar todos los datos actuales con los del archivo.
                            <br/>
                            <span className="font-bold text-destructive">¡La opción de reemplazar borrará permanentemente todos los productos actuales!</span>
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
        </>
    );
}

    
