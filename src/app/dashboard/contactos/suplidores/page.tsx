"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

const initialSuppliers: Supplier[] = [
  { id: '1', name: 'Químicos del Este', email: 'ventas@qde.com.do', phone: '809-222-1111', address: 'Parque Industrial, Haina' },
  { id: '2', name: 'Distribuidora Central', email: 'pedidos@dcentral.com', phone: '829-333-4444', address: 'Autopista Duarte Km 14, Santo Domingo' },
  { id: '3', name: 'Importadora Global', email: 'info@iglobal.net', phone: '809-444-5555', address: 'Av. 27 de Febrero, Santo Domingo' },
];

export default function SuplidoresPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsDialogOpen(true);
    };

    const handleDelete = (supplierId: string) => {
        setSuppliers(suppliers.filter(s => s.id !== supplierId));
    };

    const handleSave = (supplier: Supplier) => {
        if (editingSupplier) {
            setSuppliers(suppliers.map(s => s.id === supplier.id ? supplier : s));
        } else {
            setSuppliers([...suppliers, { ...supplier, id: new Date().toISOString() }]);
        }
        setEditingSupplier(null);
        setIsDialogOpen(false);
    };

    const ContactForm = ({ contact, onSave }: { contact: Supplier | null, onSave: (supplier: Supplier) => void }) => {
        const [formData, setFormData] = useState(contact || {
            name: '', email: '', phone: '', address: ''
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { id, value } = e.target;
            setFormData(prev => ({ ...prev, [id]: value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...formData, id: contact?.id || '' });
        }
        
        return (
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Correo</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Teléfono</Label>
                        <Input id="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Dirección</Label>
                        <Input id="address" value={formData.address} onChange={handleChange} className="col-span-3" />
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
                <Button onClick={() => { setEditingSupplier(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Suplidor
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
                                <TableHead>Correo</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.email}</TableCell>
                                    <TableCell>{supplier.phone}</TableCell>
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

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Editar Suplidor' : 'Añadir Suplidor'}</DialogTitle>
                        <DialogDescription>
                            {editingSupplier ? 'Actualiza los detalles de tu suplidor.' : 'Añade un nuevo suplidor a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ContactForm contact={editingSupplier} onSave={handleSave} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
