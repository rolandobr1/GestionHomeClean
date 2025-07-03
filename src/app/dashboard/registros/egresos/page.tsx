
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import type { Expense, Supplier } from '@/components/app-provider';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';

const expenseCategories = ["Materia Prima", "Envases", "Etiquetas", "Transportación", "Maquinarias y Herramientas", "Otro"];

const ExpenseForm = ({ expense, onSave, suppliers, onClose }: { expense: Expense | null, onSave: (expense: Expense | Omit<Expense, 'id'>) => Promise<void>, suppliers: Supplier[], onClose: () => void }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('Materia Prima');
    const [supplierId, setSupplierId] = useState('generic');

    useEffect(() => {
        if (expense) {
            setDescription(expense.description);
            setAmount(expense.amount);
            setDate(format(new Date(expense.date + 'T00:00:00'), 'yyyy-MM-dd'));
            setCategory(expense.category);
            setSupplierId(expense.supplierId || 'generic');
        } else {
            setDescription('');
            setAmount(0);
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setCategory('Materia Prima');
            setSupplierId('generic');
        }
    }, [expense]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (expense) {
                await onSave({
                    ...expense,
                    description,
                    amount,
                    date,
                    category,
                    supplierId,
                });
            } else {
                await onSave({
                    description,
                    amount,
                    date,
                    category,
                    supplierId,
                    recordedBy: '' // Will be set in provider
                });
            }
            onClose();
        } finally {
            setIsSaving(false);
        }
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="supplierId">Suplidor</Label>
                    <Select onValueChange={setSupplierId} value={supplierId} disabled={isSaving}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un suplidor" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select onValueChange={setCategory} value={category} disabled={isSaving}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isSaving}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={isSaving}/>
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                     <Button type="button" variant="secondary" disabled={isSaving}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
        </form>
    );
};

export default function EgresosPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { expenses, addExpense, deleteExpense, updateExpense, addMultipleExpenses, suppliers, addSupplier } = useAppData();
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
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    
    const allSuppliers = useMemo(() => [
        { id: 'generic', name: 'Suplidor Genérico', code: 'SUP-000', email: '', phone: '', address: '' },
        ...suppliers
    ], [suppliers]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date + 'T00:00:00');
            
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

            // Search term filter (searches in description and supplier name)
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                const supplier = allSuppliers.find(s => s.id === expense.supplierId);
                const inDescription = expense.description.toLowerCase().includes(lowerCaseSearchTerm);
                const inSupplier = supplier?.name.toLowerCase().includes(lowerCaseSearchTerm);
                if (!inDescription && !inSupplier) {
                    return false;
                }
            }
            
            return true;
        }).sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime());
    }, [expenses, dateRange, categoryFilter, searchTerm, allSuppliers]);
    
    const clearFilters = () => {
        setDateRange({ from: undefined, to: undefined });
        setCategoryFilter('');
        setSearchTerm('');
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsDialogOpen(true);
    };

    const handleDelete = async (expenseId: string) => {
        await deleteExpense(expenseId);
    };

    const handleSave = async (expenseData: Expense | Omit<Expense, 'id'>) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
            return;
        }
        
        if ('id' in expenseData && expenseData.id) {
            await updateExpense(expenseData as Expense);
        } else {
            const expenseToSave = { ...expenseData, recordedBy: user.name };
            await addExpense(expenseToSave);
        }
    };

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingExpense(null);
        }
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
            'supplier': allSuppliers.find(s => s.id === expense.supplierId)?.name || 'Suplidor Genérico',
            'recordedBy': expense.recordedBy
        }));
        const csvString = convertArrayOfObjectsToCSV(flattenedExpenses);
        downloadCSV(csvString, 'egresos.csv');

        toast({ title: 'Exportación Exitosa', description: 'Tus registros han sido descargados.' });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
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

                const newExpenses: Expense[] = [];
                const newSuppliersCache = new Map<string, Supplier>();
                let allSuppliersCurrentList = [...allSuppliers];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',');
                    const expenseData: any = {};
                    headers.forEach((header, index) => {
                        expenseData[header] = values[index]?.trim() || '';
                    });

                    const supplierName = (expenseData.supplier || 'Suplidor Genérico').trim();
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

                    if (!supplier) {
                        throw new Error(`No se pudo encontrar o crear el suplidor "${supplierName}".`);
                    }

                    newExpenses.push({
                        id: expenseData.id || '',
                        description: expenseData.description || 'N/A',
                        amount: parseFloat(expenseData.amount) || 0,
                        date: expenseData.date || format(new Date(), 'yyyy-MM-dd'),
                        category: expenseData.category || 'Otro',
                        supplierId: supplier.id,
                        recordedBy: user.name,
                    });
                }
                
                await addMultipleExpenses(newExpenses, importMode);

                toast({
                    title: "Importación Exitosa",
                    description: `${newExpenses.length} egresos han sido importados en modo '${importMode === 'append' ? 'Añadir' : 'Reemplazar'}'.`,
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


    return (
        <>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
             <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Imp.
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exp.
                </Button>
                <Button onClick={() => { setEditingExpense(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Egreso
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
                            placeholder="Buscar por descripción o suplidor..." 
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
                                <TableHead className="hidden md:table-cell">Suplidor</TableHead>
                                <TableHead className="hidden lg:table-cell">Registrado por</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right hidden md:table-cell">Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => {
                                const supplier = allSuppliers.find(s => s.id === expense.supplierId);
                                return (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{expense.category}</TableCell>
                                    <TableCell className="hidden md:table-cell">{supplier?.name || 'Suplidor Genérico'}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{expense.recordedBy}</TableCell>
                                    <TableCell className="text-right">RD${expense.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right hidden md:table-cell">{format(new Date(expense.date + 'T00:00:00'), 'PPP', { locale: es })}</TableCell>
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
                            )}) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingExpense ? 'Editar Egreso' : 'Añadir Egreso'}</DialogTitle>
                        <DialogDescription>
                            {editingExpense ? 'Actualiza los detalles de tu egreso.' : 'Añade un nuevo egreso a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ExpenseForm expense={editingExpense} onSave={handleSave} suppliers={allSuppliers} onClose={() => handleDialogChange(false)} />
                </DialogContent>
            </Dialog>
             <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selecciona el modo de importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Puedes añadir los nuevos egresos a los existentes o reemplazar todos los datos actuales con los del archivo.
                            <br/>
                            <span className="font-bold text-destructive">¡La opción de reemplazar borrará permanentemente todos los egresos actuales!</span>
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
