
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Upload, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/hooks/use-app-data';
import type { Supplier } from '@/components/app-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const ContactForm = ({
  contact,
  onSave,
  onClose,
}: {
  contact: Omit<Supplier, 'id'> | Supplier | null;
  onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<void>;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '', email: '', phone: '', address: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData(contact);
    } else {
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
  }, [contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={formData.name} onChange={handleChange} required disabled={isSaving}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleChange} disabled={isSaving}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={formData.phone} onChange={handleChange} disabled={isSaving}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" value={formData.address} onChange={handleChange} disabled={isSaving}/>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogFooter>
    </form>
  );
};


export default function SuplidoresPage() {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, addMultipleSuppliers } = useAppData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("El archivo CSV está vacío o solo contiene la cabecera.");

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name', 'email', 'phone', 'address'];
            const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
            if (missingHeaders.length > 0) {
                throw new Error(`Faltan las siguientes columnas en el CSV: ${missingHeaders.join(', ')}`);
            }

            const newSuppliers: Omit<Supplier, 'id'>[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const supplierData: any = {};
                headers.forEach((header, index) => {
                    supplierData[header] = values[index]?.trim() || '';
                });

                newSuppliers.push({
                    name: supplierData.name || 'N/A',
                    email: supplierData.email || 'N/A',
                    phone: supplierData.phone || 'N/A',
                    address: supplierData.address || 'N/A',
                });
            }
            
            await addMultipleSuppliers(newSuppliers as Supplier[]);

            toast({
            title: "Importación Exitosa",
            description: `${newSuppliers.length} suplidores han sido importados.`,
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
        if (suppliers.length === 0) {
            toast({ title: 'No hay datos', description: 'No hay suplidores para exportar.', variant: 'destructive' });
            return;
        }
        const dataToExport = suppliers.map(({ id, ...rest }) => rest);
        const csvString = convertArrayOfObjectsToCSV(dataToExport);
        downloadCSV(csvString, 'suplidores.csv');
        toast({ title: 'Exportación Exitosa', description: 'Tus suplidores han sido descargados.' });
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

    const handleSave = async (supplierData: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in supplierData && supplierData.id) {
            await updateSupplier(supplierData as Supplier);
        } else {
            await addSupplier(supplierData);
        }
        setIsDialogOpen(false);
    };

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingSupplier(null);
        }
    };

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        Imp.
                    </Button>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="hidden sm:table-cell">Correo</TableHead>
                                    <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {supplier.email ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="block max-w-[200px] truncate cursor-default">{supplier.email}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{supplier.email}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{supplier.phone}</TableCell>
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
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                        </AlertDialogTrigger>
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
                                ))}
                            </TableBody>
                        </Table>
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
            </div>
        </TooltipProvider>
    );
}

    