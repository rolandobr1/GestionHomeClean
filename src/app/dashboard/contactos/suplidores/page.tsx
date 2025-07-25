
"use client";

import React, { useState, useRef, useMemo, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Upload, Download, Search, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/hooks/use-app-data';
import type { Supplier } from '@/components/app-provider';
import { useAuth } from '@/hooks/use-auth';
import { ContactForm } from '@/components/contact-form';
import { useSort } from '@/hooks/use-sort';
import { useCsvExport } from '@/hooks/use-csv-export';

export default function SuplidoresPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, addMultipleSuppliers } = useAppData();
    const { user } = useAuth();
    const { toast } = useToast();
    const { downloadCSV } = useCsvExport();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    
    const [isPending, startTransition] = useTransition();

    const { sortedData: sortedSuppliers, handleSort, renderSortArrow } = useSort<Supplier>(
        suppliers,
        'code',
        'asc'
    );
    
    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return sortedSuppliers;
        const lowercasedTerm = searchTerm.toLowerCase();
        return sortedSuppliers.filter(supplier =>
            (supplier.name && supplier.name.toLowerCase().includes(lowercasedTerm)) ||
            (supplier.code && supplier.code.toLowerCase().includes(lowercasedTerm)) ||
            (supplier.email && supplier.email.toLowerCase().includes(lowercasedTerm)) ||
            (supplier.phone && supplier.phone.toLowerCase().includes(lowercasedTerm))
        );
    }, [searchTerm, sortedSuppliers]);

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

            const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name'];
            const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
            if (missingHeaders.length > 0) {
                throw new Error(`Faltan las siguientes columnas obligatorias en el CSV: ${missingHeaders.join(', ')}`);
            }

            const newSuppliers: Omit<Supplier, 'id' | 'code'>[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter);
                const supplierData: any = {};
                headers.forEach((header, index) => {
                    supplierData[header] = values[index]?.trim() || '';
                });

                if (!supplierData.name) {
                    skippedCount++;
                    continue;
                }

                newSuppliers.push({
                    name: supplierData.name,
                    email: supplierData.email || '',
                    phone: supplierData.phone || '',
                    address: supplierData.address || '',
                });
                addedCount++;
            }
            
            if (addedCount > 0) {
              await addMultipleSuppliers(newSuppliers, importMode);
            }

            toast({
                title: "Importación Completada",
                description: `${addedCount} suplidores importados. ${skippedCount > 0 ? `${skippedCount} filas omitidas.` : ''}`,
            });
            setSearchTerm('');

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

    const handleExport = () => {
        const dataToExport = suppliers.map(s => ({
            code: s.code,
            name: s.name,
            email: s.email,
            phone: s.phone,
            address: s.address
        }));
        const headers = ['code', 'name', 'email', 'phone', 'address'];
        downloadCSV(dataToExport, headers, 'suplidores.csv');
    };

    const handleAddNew = () => {
        setEditingSupplier(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsDialogOpen(true);
    };

    const handleDelete = (supplierId: string) => {
        deleteSupplier(supplierId);
    };

    const handleSave = async (supplierData: Omit<Supplier, 'id' | 'code'> | Supplier) => {
        try {
            if ('id' in supplierData && supplierData.id) {
                await updateSupplier(supplierData as Supplier);
                toast({ title: "Suplidor Actualizado", description: "Los datos del suplidor han sido actualizados." });
            } else {
                await addSupplier(supplierData as Omit<Supplier, 'id' | 'code'>);
                toast({ title: "Suplidor Añadido", description: "El nuevo suplidor ha sido añadido a tus registros." });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el suplidor.' });
        }
    };

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingSupplier(null);
        }
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
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Suplidor
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Suplidores</CardTitle>
                    <CardDescription>Un listado de todos tus suplidores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="pb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar suplidor..."
                                value={searchTerm}
                                onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                                className="pl-8"
                            />
                            {isPending && (
                                <div className="absolute right-2.5 top-2.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead onClick={() => handleSort('code')} className="cursor-pointer">
                                        <div className="flex items-center">Código {renderSortArrow('code')}</div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                                        <div className="flex items-center">Nombre {renderSortArrow('name')}</div>
                                    </TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Correo</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSuppliers.length > 0 ? filteredSuppliers.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-mono">{supplier.code}</TableCell>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>{supplier.phone}</TableCell>
                                        <TableCell>{supplier.email}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => handleEdit(supplier)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                        {user?.role === 'admin' && (
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar este suplidor?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del suplidor.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(supplier.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No se encontraron suplidores.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="md:hidden space-y-3">
                        {filteredSuppliers.length > 0 ? filteredSuppliers.map(supplier => (
                            <Card key={supplier.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{supplier.name}</p>
                                    <p className="text-sm text-muted-foreground">{supplier.code}</p>
                                    <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                                </div>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(supplier)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                            {user?.role === 'admin' && (
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar "{supplier.name}"?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(supplier.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </Card>
                        )) : (
                            <div className="text-center p-8 text-muted-foreground">
                                No se encontraron suplidores.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Editar Suplidor' : 'Añadir Suplidor'}</DialogTitle>
                        <DialogDescription>
                            {editingSupplier ? 'Actualiza los detalles de tu suplidor.' : 'Añade un nuevo suplidor a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ContactForm contact={editingSupplier} onSave={handleSave} onClose={() => handleDialogChange(false)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Puedes añadir los nuevos suplidores a los existentes o reemplazar todos los datos actuales con los del archivo.
                            <br/>
                            <span className="font-bold text-destructive">¡La opción de reemplazar borrará permanentemente todos los suplidores actuales!</span>
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

    