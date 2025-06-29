"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, X, Download, Upload } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppData } from '@/hooks/use-app-data';
import type { Expense } from '@/components/app-provider';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';

const expenseCategories = ["Compra de Material", "Salarios", "Servicios Públicos", "Mantenimiento", "Otro"];

export default function EgresosPage() {
    const { expenses, addExpense, deleteExpense, updateExpense, addMultipleExpenses } = useAppData();
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 90),
        to: new Date(),
    });
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            
            // Date filter
            if (dateRange?.from && dateRange?.to) {
                // Adjust for timezone differences by comparing dates only
                const fromDate = new Date(dateRange.from.setHours(0,0,0,0));
                const toDate = new Date(dateRange.to.setHours(23,59,59,999));
                if (expenseDate < fromDate || expenseDate > toDate) {
                    return false;
                }
            }
            
            // Category filter
            if (categoryFilter && expense.category !== categoryFilter) {
                return false;
            }

            // Search term filter (searches in description)
            if (searchTerm && !expense.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, dateRange, categoryFilter, searchTerm]);
    
    const clearFilters = () => {
        setDateRange({ from: undefined, to: undefined });
        setCategoryFilter('');
        setSearchTerm('');
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsDialogOpen(true);
    };

    const handleDelete = (expenseId: string) => {
        deleteExpense(expenseId);
    };

    const handleSave = (expense: Expense) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
            return;
        }
        const expenseToSave: Expense = { ...expense, recordedBy: user.name };

        if (editingExpense) {
            updateExpense(expenseToSave);
        } else {
            const { id, ...newExpenseData } = expenseToSave;
            addExpense(newExpenseData);
        }
        setEditingExpense(null);
        setIsDialogOpen(false);
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
        if (filteredExpenses.length === 0) {
            toast({ title: 'No hay datos', description: 'No hay registros para exportar que coincidan con los filtros.', variant: 'destructive' });
            return;
        }

        const flattenedExpenses = filteredExpenses.map(expense => ({
            'description': expense.description,
            'amount': expense.amount,
            'date': expense.date,
            'category': expense.category,
        }));
        const csvString = convertArrayOfObjectsToCSV(flattenedExpenses);
        downloadCSV(csvString, 'egresos.csv');

        toast({ title: 'Exportación Exitosa', description: 'Tus registros han sido descargados.' });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("El archivo CSV está vacío o solo contiene la cabecera.");

                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const requiredHeaders = ['description', 'amount', 'date', 'category'];
                const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
                if (missingHeaders.length > 0) {
                    throw new Error(`Faltan las siguientes columnas en el CSV: ${missingHeaders.join(', ')}`);
                }

                const newExpenses: Omit<Expense, 'id'>[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',');
                    const expenseData: any = {};
                    headers.forEach((header, index) => {
                        expenseData[header] = values[index]?.trim() || '';
                    });

                    newExpenses.push({
                        description: expenseData.description || 'N/A',
                        amount: parseFloat(expenseData.amount) || 0,
                        date: expenseData.date || new Date().toISOString().split('T')[0],
                        category: expenseData.category || 'Otro',
                        recordedBy: user.name,
                    });
                }
                
                addMultipleExpenses(newExpenses);

                toast({
                    title: "Importación Exitosa",
                    description: `${newExpenses.length} egresos han sido importados.`,
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

    const ExpenseForm = ({ expense, onSave }: { expense: Expense | null, onSave: (expense: Expense) => void }) => {
        const [formData, setFormData] = useState(expense || {
            description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Compra de Material', recordedBy: ''
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { id, value, type } = e.target;
            setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
        };

        const handleSelectChange = (value: string) => {
            setFormData(prev => ({ ...prev, category: value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...formData, id: expense?.id || '' });
        }
        
        return (
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Input id="description" value={formData.description} onChange={handleChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="amount">Monto</Label>
                        <Input id="amount" type="number" value={formData.amount} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input id="date" type="date" value={formData.date} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select onValueChange={handleSelectChange} defaultValue={formData.category}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
             <div className="flex justify-end items-start gap-2">
                <Button variant="outline" onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
                <Button onClick={() => { setEditingExpense(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Egreso
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>Filtra los egresos por fecha, categoría o descripción.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                        <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
                            <SelectTrigger className="w-full md:w-[280px]">
                                <SelectValue placeholder="Filtrar por categoría..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Categorías</SelectItem>
                                {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input 
                            placeholder="Buscar por descripción..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full md:w-[280px]" 
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4"/>
                        Limpiar Filtros
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Egresos</CardTitle>
                    <CardDescription>Un listado de todas tus transacciones de egresos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                                <TableHead className="hidden lg:table-cell">Registrado por</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right hidden md:table-cell">Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{expense.category}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{expense.recordedBy}</TableCell>
                                    <TableCell className="text-right">RD${expense.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right hidden md:table-cell">{format(new Date(expense.date), 'PPP', { locale: es })}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => handleEdit(expense)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este egreso?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del egreso.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingExpense ? 'Editar Egreso' : 'Añadir Egreso'}</DialogTitle>
                        <DialogDescription>
                            {editingExpense ? 'Actualiza los detalles de tu egreso.' : 'Añade un nuevo egreso a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ExpenseForm expense={editingExpense} onSave={handleSave} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
