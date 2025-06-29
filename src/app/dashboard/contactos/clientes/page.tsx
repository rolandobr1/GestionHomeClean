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

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

const initialClients: Client[] = [
  { id: '1', name: 'Laboratorios Alfa', email: 'compras@alfa.com', phone: '809-555-1234', address: 'Calle Falsa 123, Santo Domingo' },
  { id: '2', name: 'Farmacia San José', email: 'contacto@fsj.do', phone: '829-555-5678', address: 'Av. Principal 45, Santiago' },
  { id: '3', name: 'Industrias del Caribe', email: 'gerencia@icaribe.com', phone: '809-555-9012', address: 'Zona Franca, La Romana' },
];

export default function ClientesPage() {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsDialogOpen(true);
    };

    const handleDelete = (clientId: string) => {
        setClients(clients.filter(c => c.id !== clientId));
    };

    const handleSave = (client: Client) => {
        if (editingClient) {
            setClients(clients.map(c => c.id === client.id ? client : c));
        } else {
            setClients([...clients, { ...client, id: new Date().toISOString() }]);
        }
        setEditingClient(null);
        setIsDialogOpen(false);
    };

    const ContactForm = ({ contact, onSave }: { contact: Client | null, onSave: (client: Client) => void }) => {
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
                <Button onClick={() => { setEditingClient(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Cliente
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>Un listado de todos tus clientes.</CardDescription>
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
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
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
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                    </AlertDialogTrigger>
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Añadir Cliente'}</DialogTitle>
                        <DialogDescription>
                            {editingClient ? 'Actualiza los detalles de tu cliente.' : 'Añade un nuevo cliente a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ContactForm contact={editingClient} onSave={handleSave} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
