
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
import type { Client } from '@/components/app-provider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/use-auth';
import { ContactForm } from '@/components/contact-form';
import { useSort } from '@/hooks/use-sort';
import { useCsvExport } from '@/hooks/use-csv-export';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function ClientesPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { clients, addClient, updateClient, deleteClient, addMultipleClients } = useAppData();
    const { user } = useAuth();
    const { toast } = useToast();
    const { downloadCSV } = useCsvExport();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    
    const [isPending, startTransition] = useTransition();

    const { sortedData: sortedClients, handleSort, renderSortArrow } = useSort(
        clients,
        'code',
        'asc'
    );
    
    const filteredClients = useMemo(() => {
        if (!searchTerm) return sortedClients;
        const lowercasedTerm = searchTerm.toLowerCase();
        return sortedClients.filter(client =>
            (client.name && client.name.toLowerCase().includes(lowercasedTerm)) ||
            (client.code && client.code.toLowerCase().includes(lowercasedTerm)) ||
            (client.email && client.email.toLowerCase().includes(lowercasedTerm)) ||
            (client.phone && client.phone.toLowerCase().includes(lowercasedTerm))
        );
    }, [searchTerm, sortedClients]);


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

            const newClients: Omit<Client, 'id' | 'code'>[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter);
                const clientData: any = {};
                headers.forEach((header, index) => {
                    clientData[header] = values[index]?.trim() || '';
                });
                
                if (!clientData.name) {
                    skippedCount++;
                    continue;
                }

                newClients.push({
                    name: clientData.name,
                    email: clientData.email || '',
                    phone: clientData.phone || '',
                    address: clientData.address || '',
                });
                addedCount++;
            }
            
            if (addedCount > 0) {
              await addMultipleClients(newClients, importMode);
            }

            toast({
                title: "Importación Completada",
                description: `${addedCount} clientes importados. ${skippedCount > 0 ? `${skippedCount} filas omitidas por datos incompletos.` : ''}`,
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
            toast({ variant: 'destructive', title: 'Error de Lectura', description: 'No se pudo leer el archivo.' });
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
        const dataToExport = clients.map(c => ({
            code: c.code,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address,
        }));
        const headers = ['code', 'name', 'email', 'phone', 'address'];
        downloadCSV(dataToExport, headers, 'clientes.csv');
    };

    const handleAddNew = () => {
        setEditingClient(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsDialogOpen(true);
    };

    const handleDelete = (clientId: string) => {
        deleteClient(clientId);
    };

    const handleSave = async (clientData: Omit<Client, 'id' | 'code'> | Client) => {
        try {
            if ('id' in clientData && clientData.id) {
                await updateClient(clientData as Client);
                toast({ title: "Cliente Actualizado", description: "Los datos del cliente han sido actualizados." });
            } else {
                await addClient(clientData as Omit<Client, 'id' | 'code'>);
                toast({ title: "Cliente Añadido", description: "El nuevo cliente ha sido añadido a tus registros." });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el cliente.' });
        }
    };
    
    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingClient(null);
        }
    };


    return (
      <div className="space-y-6">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>Un listado de todos tus clientes.</CardDescription>
                </div>
                 <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                    {user?.role === 'admin' && (
                        <Button variant="outline" size="sm" onClick={handleImportClick}>
                            <Upload className="mr-2 h-4 w-4" />
                            Imp.
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Exp.
                    </Button>
                    <Button size="sm" onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Cliente
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="pb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cliente..."
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
                <div className="relative">
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
                                {filteredClients.length > 0 ? filteredClients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-mono">{client.code}</TableCell>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>{client.phone}</TableCell>
                                        <TableCell>{client.email}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => handleEdit(client)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                        {user?.role === 'admin' && (
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar este cliente?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del cliente.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No se encontraron clientes.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="md:hidden space-y-3">
                        {filteredClients.length > 0 ? filteredClients.map(client => (
                            <Card key={client.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{client.name}</p>
                                    <p className="text-sm text-muted-foreground">{client.code}</p>
                                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                                </div>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(client)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                            {user?.role === 'admin' && (
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar "{client.name}"?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </Card>
                        )) : (
                            <div className="text-center p-8 text-muted-foreground">
                                No se encontraron clientes.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingClient ? 'Editar Cliente' : 'Añadir Cliente'}</DialogTitle>
                    <DialogDescription>
                        {editingClient ? 'Actualiza los detalles de tu cliente.' : 'Añade un nuevo cliente a tus registros.'}
                    </DialogDescription>
                </DialogHeader>
                <ContactForm contact={editingClient} onSave={handleSave} onClose={() => handleDialogChange(false)} />
            </DialogContent>
        </Dialog>

        <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                    <AlertDialogDescription>
                        Puedes añadir los nuevos clientes a los existentes o reemplazar todos los datos actuales con los del archivo.
                        <br/>
                        <span className="font-bold text-destructive">¡La opción de reemplazar borrará permanentemente todos los clientes actuales!</span>
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
      </div>
    );
}
