
"use client";

import React, { useState, useRef, useMemo, useTransition } from 'react';
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
import { useAuth } from '@/hooks/use-auth';
import type { RawMaterial, Supplier } from '@/components/app-provider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InventoryForm } from '@/components/inventory-form';
import { useSort } from '@/hooks/use-sort';
import { useCsvExport } from '@/hooks/use-csv-export';
import { cn } from '@/lib/utils';

export default function MateriaPrimaPage() {
    const { rawMaterials, suppliers, addRawMaterial, updateRawMaterial, deleteRawMaterial, addMultipleRawMaterials, addSupplier } = useAppData();
    const { user } = useAuth();
    const { toast } = useToast();
    const { downloadCSV } = useCsvExport();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    
    const [isPending, startTransition] = useTransition();

    const { sortedData: sortedRawMaterials, handleSort, renderSortArrow } = useSort<RawMaterial>(rawMaterials, 'name');

    const allSuppliers = useMemo(() => [
        { id: 'generic', name: 'Suplidor Genérico', code: 'SUP-000', email: '', phone: '', address: '' },
        ...suppliers
    ], [suppliers]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

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
                const requiredHeaders = ['name', 'unit', 'purchaseprice', 'stock'];
                const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
                if (missingHeaders.length > 0) {
                    throw new Error(`Faltan las siguientes columnas obligatorias en el CSV: ${missingHeaders.join(', ')}`);
                }

                const newMaterials: Omit<RawMaterial, 'id'>[] = [];
                const newSuppliersCache = new Map<string, Supplier>();
                let allSuppliersCurrentList = [...allSuppliers];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(delimiter);
                    const materialData: any = {};
                    headers.forEach((header, index) => {
                        materialData[header] = values[index]?.trim() || '';
                    });
                    
                    if (!materialData.name || !materialData.unit || !materialData.purchaseprice || !materialData.stock) {
                        skippedCount++;
                        continue;
                    }

                    const supplierName = (materialData.supplier || 'Suplidor Genérico').trim();
                    let supplier: Supplier | undefined;

                    supplier = allSuppliersCurrentList.find(s => s.name.toLowerCase() === supplierName.toLowerCase());

                    if (!supplier) {
                        supplier = newSuppliersCache.get(supplierName.toLowerCase());
                    }
                    
                    if (!supplier && supplierName !== 'Suplidor Genérico') {
                        const newSupplier = await addSupplier({ name: supplierName, email: '', phone: '', address: '' });
                        if (newSupplier) {
                            supplier = newSupplier;
                            newSuppliersCache.set(supplierName.toLowerCase(), newSupplier);
                            allSuppliersCurrentList.push(newSupplier);
                        }
                    }

                    if (!supplier) {
                        supplier = allSuppliers.find(s => s.id === 'generic');
                    }
                    
                    newMaterials.push({
                        name: materialData.name,
                        sku: materialData.sku || '',
                        unit: materialData.unit,
                        purchasePrice: parseFloat(materialData.purchaseprice) || 0,
                        stock: parseInt(materialData.stock, 10) || 0,
                        reorderLevel: parseInt(materialData.reorderlevel, 10) || 0,
                        supplierId: supplier!.id,
                        recordedBy: materialData.recordedby || user.name,
                    });
                    addedCount++;
                }
                
                if (addedCount > 0) {
                    await addMultipleRawMaterials(newMaterials, importMode);
                }

                toast({
                    title: "Importación Exitosa",
                    description: `${addedCount} materias primas importadas. ${skippedCount > 0 ? `${skippedCount} filas omitidas.` : ''}`,
                });

            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Error de Importación",
                    description: error.message || "No se pudo procesar el archivo CSV.",
                });
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
        const dataToExport = rawMaterials.map((material) => ({
            name: material.name,
            sku: material.sku,
            unit: material.unit,
            purchasePrice: material.purchasePrice,
            stock: material.stock,
            reorderLevel: material.reorderLevel,
            supplier: allSuppliers.find(s => s.id === material.supplierId)?.name || 'N/A',
            recordedBy: material.recordedBy,
        }));
        const headers = ['name', 'sku', 'unit', 'purchasePrice', 'stock', 'reorderLevel', 'supplier', 'recordedBy'];
        downloadCSV(dataToExport, headers, 'materia_prima.csv');
    };

    const handleEdit = (material: RawMaterial) => {
        setEditingMaterial(material);
        setIsDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingMaterial(null);
        setIsDialogOpen(true);
    };
    
    const handleDialogClose = () => {
        setEditingMaterial(null);
        setIsDialogOpen(false);
    };

    const handleDelete = (materialId: string) => {
        deleteRawMaterial(materialId);
    };

    const handleSave = async (material: Omit<RawMaterial, 'id'> | RawMaterial, stockAdjustment: number = 0) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
            return;
        }

        try {
            if ('id' in material && material.id) {
                await updateRawMaterial(material as RawMaterial, stockAdjustment);
                toast({ title: "Materia Prima Actualizada" });
            } else {
                const materialToSave = { ...material, recordedBy: user.name };
                await addRawMaterial(materialToSave as Omit<RawMaterial, 'id'>);
                toast({ title: "Materia Prima Añadida" });
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
                    M. Prima
                </Button>
            </div>

            <Card>
                <Collapsible defaultOpen={true}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Materia Prima</CardTitle>
                                <CardDescription>Un listado de todas las materias primas en tu inventario.</CardDescription>
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
                                            <TableHead onClick={() => handleSort('supplierId')} className="hidden md:table-cell cursor-pointer">
                                                <div className="flex items-center">Suplidor {renderSortArrow('supplierId')}</div>
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('stock')} className="text-right cursor-pointer">
                                                <div className="flex items-center justify-end">Stock {renderSortArrow('stock')}</div>
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('purchasePrice')} className="text-right hidden sm:table-cell cursor-pointer">
                                                <div className="flex items-center justify-end">Precio Compra {renderSortArrow('purchasePrice')}</div>
                                            </TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedRawMaterials.map((material) => {
                                            const supplier = allSuppliers.find(s => s.id === material.supplierId);
                                            return (
                                            <TableRow key={material.id}>
                                                <TableCell className="font-medium">{material.name}</TableCell>
                                                <TableCell className="hidden md:table-cell">{supplier?.name || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    {material.stock <= material.reorderLevel ? (
                                                        <Badge variant="destructive">{material.stock} {material.unit}</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{material.stock} {material.unit}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right hidden sm:table-cell">RD${material.purchasePrice.toFixed(2)}</TableCell>
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
                                                                <DropdownMenuItem onClick={() => handleEdit(material)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                                {user?.role === 'admin' && (
                                                                    <AlertDialogTrigger asChild>
                                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                                    </AlertDialogTrigger>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este material?</AlertDialogTitle>
                                                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(material.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        )})}
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
                        <DialogTitle>{editingMaterial ? 'Editar Materia Prima' : 'Añadir Materia Prima'}</DialogTitle>
                        <DialogDescription>
                            {editingMaterial ? 'Actualiza los detalles de tu material.' : 'Añade un nuevo material a tu inventario.'}
                        </DialogDescription>
                    </DialogHeader>
                    <InventoryForm item={editingMaterial} itemType="rawMaterial" onSave={handleSave} onClose={handleDialogClose} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Puedes añadir la nueva materia prima a la existente o reemplazar todos los datos actuales.
                            <br/>
                            <span className="font-bold text-destructive">¡Reemplazar borrará permanentemente toda la materia prima actual!</span>
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
