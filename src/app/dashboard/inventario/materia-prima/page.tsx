
"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Upload, Download, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/hooks/use-app-data';
import { useAuth } from '@/hooks/use-auth';
import type { RawMaterial, Supplier } from '@/components/app-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MaterialForm = ({
    material,
    onSave,
    suppliers
}: {
    material: RawMaterial | null,
    onSave: (material: RawMaterial) => Promise<void>,
    suppliers: Supplier[]
}) => {
    const defaultState = {
        name: '', sku: '', unit: '', purchasePrice: 0, stock: 0, reorderLevel: 0, supplierId: 'generic'
    };
    const [formData, setFormData] = useState<Omit<RawMaterial, 'id'|'recordedBy'>>(defaultState);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (material) {
            const { id, recordedBy, ...rest } = material;
            setFormData(rest);
        } else {
            setFormData(defaultState);
        }
    }, [material]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, supplierId: value }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ ...formData, id: material?.id || '', recordedBy: material?.recordedBy || '' });
        } finally {
            setIsSaving(false);
        }
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" value={formData.name} onChange={handleChange} required disabled={isSaving}/>
                </div>
                    <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" value={formData.sku} onChange={handleChange} disabled={isSaving}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" type="number" value={formData.stock} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit">Unidad</Label>
                        <Input id="unit" value={formData.unit} onChange={handleChange} disabled={isSaving}/>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchasePrice">Precio Compra</Label>
                        <Input id="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Nivel Reorden</Label>
                        <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="supplierId">Suplidor</Label>
                    <Select onValueChange={handleSelectChange} value={formData.supplierId} disabled={isSaving}>
                        <SelectTrigger id="supplierId">
                            <SelectValue placeholder="Selecciona un suplidor" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
                <DialogFooter>
                <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isSaving}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function MateriaPrimaPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { rawMaterials, suppliers, addRawMaterial, updateRawMaterial, deleteRawMaterial, addMultipleRawMaterials, addSupplier } = useAppData();
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const allSuppliers = useMemo(() => [
        { id: 'generic', name: 'Suplidor Genérico', code: 'SUP-000', email: '', phone: '', address: '' },
        ...suppliers
    ], [suppliers]);

    const sortedRawMaterials = useMemo(() => {
        return [...rawMaterials].sort((a, b) => {
            const key = sortConfig.key as keyof RawMaterial;
            let aValue, bValue;

            if (key === 'supplierId') {
                aValue = allSuppliers.find(s => s.id === a.supplierId)?.name || '';
                bValue = allSuppliers.find(s => s.id === b.supplierId)?.name || '';
            } else {
                aValue = a[key];
                bValue = b[key];
            }
            
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * directionMultiplier;
            }
            return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
        });
    }, [rawMaterials, sortConfig, allSuppliers]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const renderSortArrow = (key: string) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
        }
        return null;
    };


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
                const requiredHeaders = ['name', 'sku', 'unit', 'purchaseprice', 'stock', 'reorderlevel', 'supplier'];
                const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
                if (missingHeaders.length > 0) {
                    throw new Error(`Faltan las siguientes columnas en el CSV: ${missingHeaders.join(', ')}`);
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
                        name: materialData.name || 'N/A',
                        sku: materialData.sku || 'N/A',
                        unit: materialData.unit || 'N/A',
                        purchasePrice: parseFloat(materialData.purchaseprice) || 0,
                        stock: parseInt(materialData.stock, 10) || 0,
                        reorderLevel: parseInt(materialData.reorderlevel, 10) || 0,
                        supplierId: supplier!.id,
                        recordedBy: materialData.recordedby || user.name,
                    });
                }
                
                await addMultipleRawMaterials(newMaterials, importMode);

                toast({
                    title: "Importación Exitosa",
                    description: `${newMaterials.length} materias primas han sido importadas en modo '${importMode === 'append' ? 'Añadir' : 'Reemplazar'}'.`,
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
        if (rawMaterials.length === 0) {
            toast({ title: 'No hay datos', description: 'No hay materias primas para exportar.', variant: 'destructive' });
            return;
        }
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
        const csvString = convertArrayOfObjectsToCSV(dataToExport);
        downloadCSV(csvString, 'materia_prima.csv');
        toast({ title: 'Exportación Exitosa', description: 'Tus materias primas han sido descargadas.' });
    };

    const handleEdit = (material: RawMaterial) => {
        setEditingMaterial(material);
        setIsDialogOpen(true);
    };

    const handleDelete = (materialId: string) => {
        deleteRawMaterial(materialId);
    };

    const handleSave = async (material: RawMaterial) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
            return;
        }

        if (editingMaterial) {
            await updateRawMaterial(material);
        } else {
            const materialToSave = { ...material, recordedBy: user.name };
            const { id, ...newMaterialData } = materialToSave;
            await addRawMaterial(newMaterialData);
        }
        setEditingMaterial(null);
        setIsDialogOpen(false);
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
                <Button onClick={() => { setEditingMaterial(null); setIsDialogOpen(true); }}>
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
                            <Table>
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
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el material de tus registros.
                                                        </AlertDialogDescription>
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
                    <MaterialForm material={editingMaterial} onSave={handleSave} suppliers={allSuppliers} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Puedes añadir la nueva materia prima a la existente o reemplazar todos los datos actuales con los del archivo.
                            <br/>
                            <span className="font-bold text-destructive">¡La opción de reemplazar borrará permanentemente toda la materia prima actual!</span>
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
