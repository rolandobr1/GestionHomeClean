
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Edit, X, Download, Upload, ChevronsUpDown, FileText, User, Calendar, Tag, Banknote, Sigma } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppData } from '@/hooks/use-app-data';
import type { Expense, Supplier } from '@/components/app-provider';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExpenseForm } from '@/components/expense-form';

export default function EgresosPage({ params, searchParams }: { params: any; searchParams: any; }) {
    const { expenses, addExpense, deleteExpense, updateExpense, addMultipleExpenses, suppliers, addSupplier, expenseCategories } = useAppData();
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [detailsExpense, setDetailsExpense] = useState<Expense | null>(null);
    
    const allSuppliers = useMemo(() => [
        { id: 'generic', name: 'Suplidor Genérico', code: 'SUP-000', email: '', phone: '', address: '' },
        ...suppliers
    ], [suppliers]);

    const filteredExpenses = useMemo(() => {
        let filtered = expenses.filter(expense => {
            const expenseDate = new Date(expense.date + 'T00:00:00');
            
            if (dateRange?.from && dateRange?.to) {
                const fromDate = new Date(dateRange.from.setHours(0,0,0,0));
                const toDate = new Date(dateRange.to.setHours(23,59,59,999));
                if (expenseDate < fromDate || expenseDate > toDate) {
                    return false;
                }
            }
            
            if (categoryFilter && expense.category !== categoryFilter) {
                return false;
            }

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
        });

        return [...filtered].sort((a, b) => {
            const key = sortConfig.key as keyof Expense;
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
            if (sortConfig.key === 'date') {
                return (new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()) * directionMultiplier;
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * directionMultiplier;
            }
            return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
        });
    }, [expenses, dateRange, categoryFilter, searchTerm, allSuppliers, sortConfig]);
    
    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

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
        try {
            await deleteExpense(expenseId);
            toast({ title: 'Egreso Eliminado' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el egreso.' });
        }
    };

    const handleSave = async (expenseData: Omit<Expense, 'id' | 'balance' | 'payments' | 'recordedBy'> | Expense) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
            return;
        }
        
        try {
            if ('id' in expenseData && expenseData.id) {
                await updateExpense(expenseData as Expense);
                toast({ title: "Egreso Actualizado", description: "El registro ha sido actualizado." });
            } else {
                const expenseToSave = { ...expenseData, recordedBy: user.name };
                await addExpense(expenseToSave as Omit<Expense, 'id' | 'balance' | 'payments' | 'createdAt'>);
                toast({ title: "Egreso Registrado", description: "El nuevo egreso ha sido guardado." });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving expense:", error);
            toast({ variant: "destructive", title: "Error al Guardar", description: "No se pudo guardar el egreso." });
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
            'paymentMethod': expense.paymentMethod,
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

                const headerLine = lines[0];
                const commaCount = (headerLine.match(/,/g) || []).length;
                const semicolonCount = (headerLine.match(/;/g) || []).length;
                const delimiter = semicolonCount > commaCount ? ';' : ',';

                const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
                
                const newExpenses: Omit<Expense, 'id'|'balance'|'payments'|'createdAt'>[] = [];
                const newSuppliersCache = new Map<string, Supplier>();
                let allSuppliersCurrentList = [...allSuppliers];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(delimiter);
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

                    const paymentMethod = (expenseData.paymentmethod === 'credito' || expenseData.paymentmethod === 'crédito') ? 'credito' : 'contado';

                    newExpenses.push({
                        description: expenseData.description || 'N/A',
                        amount: parseFloat(expenseData.amount) || 0,
                        date: expenseData.date || format(new Date(), 'yyyy-MM-dd'),
                        category: expenseData.category || 'Otro',
                        paymentMethod,
                        supplierId: supplier.id,
                        recordedBy: expenseData.recordedby || user.name,
                    });
                }
                
                await addMultipleExpenses(newExpenses, importMode);

                toast({
                    title: "Importación Exitosa",
                    description: `${newExpenses.length} egresos han sido importados en modo '${importMode === 'append' ? 'Añadir' : 'Reemplazar'}'.`,
                });
                clearFilters();
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
                    <div className="flex flex-wrap gap-4">
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
                <Collapsible defaultOpen={true}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Historial de Egresos</CardTitle>
                                <CardDescription>Un listado de todas tus transacciones de egresos.</CardDescription>
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
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead onClick={() => handleSort('description')} className="cursor-pointer">Descripción</TableHead>
                                            <TableHead onClick={() => handleSort('category')} className="hidden sm:table-cell cursor-pointer">Categoría</TableHead>
                                            <TableHead onClick={() => handleSort('supplierId')} className="hidden md:table-cell cursor-pointer">Suplidor</TableHead>
                                            <TableHead onClick={() => handleSort('recordedBy')} className="hidden lg:table-cell cursor-pointer">Registrado por</TableHead>
                                            <TableHead onClick={() => handleSort('amount')} className="text-right cursor-pointer">Monto</TableHead>
                                            <TableHead onClick={() => handleSort('date')} className="text-right hidden md:table-cell cursor-pointer">Fecha</TableHead>
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
                                                                <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                                                </DropdownMenuItem>
                                                                {user?.role === 'admin' && (
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                )}
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
                            </div>
                            <div className="md:hidden space-y-3">
                                {filteredExpenses.length > 0 ? filteredExpenses.map(expense => {
                                    const supplier = allSuppliers.find(c => c.id === expense.supplierId);
                                    return (
                                    <Card key={expense.id} className="p-4" onClick={() => setDetailsExpense(expense)}>
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="font-semibold">{expense.description}</p>
                                                <p className="text-sm text-muted-foreground">{supplier?.name || 'N/A'}</p>
                                            </div>
                                            <p className="font-bold text-lg">RD${expense.amount.toFixed(2)}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            {format(new Date(expense.date + 'T00:00:00'), 'PPP', { locale: es })}
                                        </div>
                                    </Card>
                                )}) : (
                                    <div className="text-center p-8 text-muted-foreground">
                                        No se encontraron resultados.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingExpense ? 'Editar Egreso' : 'Añadir Egreso'}</DialogTitle>
                        <DialogDescription>
                            {editingExpense ? 'Actualiza los detalles de tu egreso.' : 'Añade un nuevo egreso a tus registros.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ExpenseForm expense={editingExpense} onSave={handleSave} onClose={() => handleDialogChange(false)} />
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
            <Dialog open={!!detailsExpense} onOpenChange={(open) => !open && setDetailsExpense(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalles del Egreso</DialogTitle>
                    </DialogHeader>
                    {detailsExpense && (
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-muted-foreground">Monto Total</span>
                                <span className="font-bold text-lg">RD${detailsExpense.amount.toFixed(2)}</span>
                            </div>
                            <div className="space-y-2">
                                <p><strong className="text-muted-foreground w-24 inline-block">Descripción:</strong> {detailsExpense.description}</p>
                                <p><strong className="text-muted-foreground w-24 inline-block">Suplidor:</strong> {allSuppliers.find(s => s.id === detailsExpense.supplierId)?.name || 'N/A'}</p>
                                <p><strong className="text-muted-foreground w-24 inline-block">Fecha:</strong> {format(new Date(detailsExpense.date + 'T00:00:00'), 'PPP', { locale: es })}</p>
                                <p><strong className="text-muted-foreground w-24 inline-block">Categoría:</strong> {detailsExpense.category}</p>
                                <p><strong className="text-muted-foreground w-24 inline-block">Condición:</strong> <span className="capitalize">{detailsExpense.paymentMethod}</span></p>
                                {detailsExpense.paymentMethod === 'contado' && <p><strong className="text-muted-foreground w-24 inline-block">Pagado con:</strong> {detailsExpense.paymentType}</p>}
                                <p><strong className="text-muted-foreground w-24 inline-block">Registrado por:</strong> {detailsExpense.recordedBy}</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setDetailsExpense(null)}>Cerrar</Button>
                                <Button onClick={() => { setDetailsExpense(null); handleEdit(detailsExpense); }}> <Edit className="mr-2 h-4 w-4"/>Editar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
