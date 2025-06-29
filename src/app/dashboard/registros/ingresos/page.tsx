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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { initialProducts } from '../../inventario/productos/page';
import { useFinancialData } from '@/hooks/use-financial-data';
import type { Income } from '@/components/financial-provider';

type Client = {
  id: string;
  name: string;
};

const initialClients: Client[] = [
  { id: '1', name: 'Laboratorios Alfa' },
  { id: '2', name: 'Farmacia San José' },
  { id: '3', name: 'Industrias del Caribe' },
];

export const allClients = [
    { id: 'generic', name: 'Cliente Genérico' },
    ...initialClients
];

export default function IngresosPage() {
    const { incomes, addIncome, deleteIncome, updateIncome } = useFinancialData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    const handleEdit = (income: Income) => {
        setEditingIncome(income);
        setIsDialogOpen(true);
    };

    const handleDelete = (incomeId: string) => {
        deleteIncome(incomeId);
    };

    const handleSave = (income: Income) => {
        if (editingIncome) {
            updateIncome(income);
        } else {
            const { id, ...newIncomeData } = income;
            addIncome(newIncomeData);
        }
        setEditingIncome(null);
        setIsDialogOpen(false);
    };

    const IncomeForm = ({ income, onSave }: { income: Income | null, onSave: (income: Income) => void }) => {
        const [formData, setFormData] = useState(income || {
            amount: 0, date: new Date().toISOString().split('T')[0], category: 'Venta de Producto',
            clientId: 'generic', paymentMethod: 'contado' as 'credito' | 'contado', productId: ''
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { id, value, type } = e.target;
            setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
        };

        const handleSelectChange = (field: keyof typeof formData) => (value: string) => {
            if (field === 'productId') {
                const product = initialProducts.find(p => p.id === value);
                setFormData(prev => ({
                    ...prev,
                    productId: value,
                    amount: product ? product.salePrice : 0
                }));
            } else {
                setFormData(prev => ({ ...prev, [field]: value }));
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...formData, id: income?.id || '' });
        }
        
        return (
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productId" className="text-right">Producto</Label>
                        <Select onValueChange={handleSelectChange('productId')} defaultValue={formData.productId} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {initialProducts.map(product => (
                                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clientId" className="text-right">Cliente</Label>
                        <Select onValueChange={handleSelectChange('clientId')} defaultValue={formData.clientId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {allClients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="paymentMethod" className="text-right">Método Pago</Label>
                        <Select onValueChange={handleSelectChange('paymentMethod')} defaultValue={formData.paymentMethod}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona un método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contado">Contado</SelectItem>
                                <SelectItem value="credito">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Monto</Label>
                        <Input id="amount" type="number" value={formData.amount} onChange={handleChange} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Fecha</Label>
                        <Input id="date" type="date" value={formData.date} onChange={handleChange} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Categoría</Label>
                        <Select onValueChange={handleSelectChange('category')} defaultValue={formData.category}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Venta de Producto">Venta de Producto</SelectItem>
                                <SelectItem value="Servicios">Servicios</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
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
                <Button onClick={() => { setEditingIncome(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Ingreso
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Ingresos</CardTitle>
                    <CardDescription>Un listado de todas tus transacciones de ingresos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right">Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incomes.map((income) => {
                                const product = initialProducts.find(p => p.id === income.productId);
                                const client = allClients.find(c => c.id === income.clientId);
                                return (
                                <TableRow key={income.id}>
                                    <TableCell className="font-medium">{product?.name || 'N/A'}</TableCell>
                                    <TableCell>{client?.name || 'N/A'}</TableCell>
                                    <TableCell className="capitalize">{income.paymentMethod}</TableCell>
                                    <TableCell className="text-right">RD${income.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{format(new Date(income.date), 'PPP', { locale: es })}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => handleEdit(income)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este ingreso?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del ingreso.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(income.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingIncome ? 'Editar Ingreso' : 'Añadir Ingreso'}</DialogTitle>
                        <DialogDescription>
                            {editingIncome ? 'Actualiza los detalles de tu ingreso.' : 'Añade un nuevo ingreso a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <IncomeForm income={editingIncome} onSave={handleSave} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
