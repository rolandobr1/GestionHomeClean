"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, CircleDollarSign, FlaskConical, AlertTriangle, PlusCircle, Trash2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useAppData } from '@/hooks/use-app-data';
import type { Income, Expense, SoldProduct, Product, Client, Supplier } from '@/components/app-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { subMonths, format, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Egresos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const IncomeForm = ({ onSave, income, clients }: { onSave: (income: Omit<Income, 'id' | 'recordedBy'>) => void, income: Income | null, clients: Client[] }) => {
    const { products: allProducts } = useAppData();
    const [clientId, setClientId] = useState('generic');
    const [paymentMethod, setPaymentMethod] = useState<'contado' | 'credito'>('contado');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
    
    const [currentProduct, setCurrentProduct] = useState('');
    const [currentQuantity, setCurrentQuantity] = useState(1);
    const [currentPriceType, setCurrentPriceType] = useState<'retail' | 'wholesale'>('retail');

    const handleAddProduct = () => {
        const product = allProducts.find(p => p.id === currentProduct);
        if (!product || currentQuantity <= 0) return;

        const price = currentPriceType === 'retail' ? product.salePriceRetail : product.salePriceWholesale;
        
        const existingProduct = soldProducts.find(p => p.productId === product.id);

        if (existingProduct) {
            setSoldProducts(soldProducts.map(p => 
                p.productId === product.id 
                ? { ...p, quantity: p.quantity + currentQuantity, price } 
                : p
            ));
        } else {
            setSoldProducts([...soldProducts, {
                productId: product.id,
                name: product.name,
                quantity: currentQuantity,
                price: price,
            }]);
        }
        
        setCurrentProduct('');
        setCurrentQuantity(1);
        setCurrentPriceType('retail');
    };

    const handleRemoveProduct = (productId: string) => {
        setSoldProducts(soldProducts.filter(p => p.productId !== productId));
    };

    const totalAmount = soldProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (soldProducts.length === 0) {
            alert("Debes agregar al menos un producto.");
            return;
        }

        onSave({
            clientId,
            paymentMethod,
            date,
            products: soldProducts,
            totalAmount,
            category: 'Venta de Producto',
        });
        setSoldProducts([]); // Clear form after save
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="clientId-dash">Cliente</Label>
                        <Select onValueChange={setClientId} defaultValue={clientId}>
                            <SelectTrigger id="clientId-dash">
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="date-dash">Fecha</Label>
                        <Input id="date-dash" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod-dash">Método Pago</Label>
                        <Select onValueChange={(value: 'contado' | 'credito') => setPaymentMethod(value)} defaultValue={paymentMethod}>
                            <SelectTrigger id="paymentMethod-dash">
                                <SelectValue placeholder="Selecciona un método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contado">Contado</SelectItem>
                                <SelectItem value="credito">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-2">
                    <Label>Añadir Productos</Label>
                    <Card className="p-4 space-y-4 bg-muted/50">
                        <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2 col-span-2">
                                <Label htmlFor="productId-dash">Producto</Label>
                                <Select onValueChange={setCurrentProduct} value={currentProduct}>
                                    <SelectTrigger id="productId-dash">
                                        <SelectValue placeholder="Selecciona un producto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allProducts.map(product => (
                                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="quantity-dash">Cantidad</Label>
                                <Input id="quantity-dash" type="number" value={currentQuantity} onChange={e => setCurrentQuantity(Number(e.target.value))} min="1" inputMode="decimal" onFocus={(e) => e.target.select()} />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Tipo de Precio</Label>
                            <RadioGroup value={currentPriceType} onValueChange={(value: 'retail' | 'wholesale') => setCurrentPriceType(value)} className="flex gap-4">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="retail" id="retail-dash" /><Label htmlFor="retail-dash">Detalle</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="wholesale" id="wholesale-dash" /><Label htmlFor="wholesale-dash">Por Mayor</Label></div>
                            </RadioGroup>
                        </div>
                        <Button type="button" onClick={handleAddProduct} className="w-full" disabled={!currentProduct}>Añadir Producto a la Venta</Button>
                    </Card>
                </div>

                {soldProducts.length > 0 && (
                     <div className="space-y-2">
                        <Label>Productos en la Venta</Label>
                        <Card>
                            <CardContent className="p-0">
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center">Cant.</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {soldProducts.map(p => (
                                                <TableRow key={p.productId}>
                                                    <TableCell>{p.name}</TableCell>
                                                    <TableCell className="text-center">{p.quantity}</TableCell>
                                                    <TableCell className="text-right">RD${p.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">RD${(p.quantity * p.price).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(p.productId)}>
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="md:hidden space-y-3 p-3">
                                    {soldProducts.map(p => (
                                        <div key={p.productId} className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold pr-2">{p.name}</p>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveProduct(p.productId)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>Cant: {p.quantity}</span>
                                                <span>Precio: RD${p.price.toFixed(2)}</span>
                                                <span className="font-medium text-foreground">RD${(p.quantity * p.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                )}
            </div>
            <DialogFooter className="pt-4 mt-4 border-t flex-col sm:flex-row sm:justify-between sm:items-center">
                 <div className="text-right sm:text-left text-xl font-bold">
                    Total: RD${totalAmount.toFixed(2)}
                </div>
                <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                         <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">Guardar</Button>
                </div>
            </DialogFooter>
        </form>
    );
};

const ExpenseForm = ({ onSave, suppliers }: { onSave: (expense: Omit<Expense, 'id' | 'recordedBy'>) => void, suppliers: Supplier[] }) => {
    const [formData, setFormData] = useState({
        description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Materia Prima', supplierId: 'generic'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const key = id.replace(/-dash-exp$/, '').replace(/-dash$/, '');
        setFormData(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (field: 'category' | 'supplierId') => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="description-dash">Descripción</Label>
                    <Input id="description-dash" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount-dash">Monto</Label>
                    <Input id="amount-dash" type="number" value={formData.amount} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date-dash-exp">Fecha</Label>
                    <Input id="date-dash-exp" type="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="supplierId-dash">Suplidor</Label>
                     <Select onValueChange={handleSelectChange('supplierId')} value={formData.supplierId}>
                        <SelectTrigger id="supplierId-dash">
                            <SelectValue placeholder="Selecciona un suplidor" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category-dash">Categoría</Label>
                     <Select onValueChange={handleSelectChange('category')} value={formData.category}>
                        <SelectTrigger id="category-dash">
                            <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Materia Prima">Materia Prima</SelectItem>
                            <SelectItem value="Envases">Envases</SelectItem>
                            <SelectItem value="Etiquetas">Etiquetas</SelectItem>
                            <SelectItem value="Transportación">Transportación</SelectItem>
                            <SelectItem value="Maquinarias y Herramientas">Maquinarias y Herramientas</SelectItem>
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


export default function DashboardPage() {
  const { toast } = useToast();
  const { incomes, expenses, products, clients, suppliers, addIncome, addExpense } = useAppData();
  const { user } = useAuth();

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [accountsReceivable, setAccountsReceivable] = useState({ total: 0, count: 0 });
  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<{ month: string, income: number, expense: number }[]>([]);

  const allClients = useMemo(() => [
    { id: 'generic', name: 'Cliente Genérico', email: '', phone: '', address: '' },
    ...clients
  ], [clients]);
  
  const allSuppliers = useMemo(() => [
    { id: 'generic', name: 'Suplidor Genérico', email: '', phone: '', address: '' },
    ...suppliers
  ], [suppliers]);

  useEffect(() => {
    // Financial calculations
    const today = new Date();
    
    const currentMonthIncome = incomes
      .filter(i => {
        const incomeDate = new Date(i.date);
        return incomeDate.getUTCMonth() === today.getUTCMonth() && incomeDate.getUTCFullYear() === today.getUTCFullYear();
      })
      .reduce((acc, income) => acc + income.totalAmount, 0);
    setTotalIncome(currentMonthIncome);

    const creditIncomes = incomes.filter(i => i.paymentMethod === 'credito');
    const arTotal = creditIncomes.reduce((acc, income) => acc + income.totalAmount, 0);
    setAccountsReceivable({ total: arTotal, count: creditIncomes.length });

    const currentMonthExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getUTCMonth() === today.getUTCMonth() && expenseDate.getUTCFullYear() === today.getUTCFullYear();
      })
      .reduce((acc, expense) => acc + expense.amount, 0);
    setTotalExpenses(currentMonthExpenses);

    // Chart data calculation
    const monthlyData: { [key: string]: { income: number, expense: number } } = {};
    const monthLabels: { [key: string]: string } = {};

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(today, i);
      const year = getYear(d);
      const month = getMonth(d);
      const key = `${year}-${month}`;
      monthlyData[key] = { income: 0, expense: 0 };
      monthLabels[key] = format(d, 'MMM', { locale: es });
    }

    incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      const year = getYear(incomeDate);
      const month = getMonth(incomeDate);
      const key = `${year}-${month}`;
      if (monthlyData[key]) {
        monthlyData[key].income += income.totalAmount;
      }
    });

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const year = getYear(expenseDate);
      const month = getMonth(expenseDate);
      const key = `${year}-${month}`;
      if (monthlyData[key]) {
        monthlyData[key].expense += expense.amount;
      }
    });
    
    const formattedChartData = Object.keys(monthLabels).map(key => ({
      month: monthLabels[key].charAt(0).toUpperCase() + monthLabels[key].slice(1),
      ...monthlyData[key],
    }));

    setChartData(formattedChartData);

    // Inventory calculations
    const lowStock = products.filter(p => p.stock <= p.reorderLevel);
    setLowStockItems(lowStock);
    
    // NOTE: Inventory value calculation is missing product cost.
    // This would require adding a `costPrice` to the Product type.
    // For now, it will remain at 0.

  }, [incomes, expenses, products]);

  const handleIncomeSave = (income: Omit<Income, 'id' | 'recordedBy'>) => {
      if (!user) return;
      addIncome({ ...income, recordedBy: user.name });
      setIsIncomeDialogOpen(false);
      toast({
          title: "Ingreso Registrado",
          description: `Se ha añadido un ingreso por RD$${income.totalAmount.toFixed(2)}.`,
      });
  };

  const handleExpenseSave = (expense: Omit<Expense, 'id' | 'recordedBy'>) => {
      if (!user) return;
      addExpense({ ...expense, recordedBy: user.name });
      setIsExpenseDialogOpen(false);
      toast({
          title: "Egreso Registrado",
          description: `Se ha añadido un egreso por RD$${expense.amount.toFixed(2)}.`,
      });
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="grid grid-cols-2 gap-4">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground h-12 text-base px-4 sm:px-6"
              onClick={() => setIsIncomeDialogOpen(true)}
            >
                <PlusCircle className="mr-2 h-5 w-5"/>
                <span>
                    <span className="hidden sm:inline">Registrar </span>Ingreso
                </span>
            </Button>
            <Button
              variant="destructive"
              className="w-full h-12 text-base px-4 sm:px-6"
              onClick={() => setIsExpenseDialogOpen(true)}
            >
                <PlusCircle className="mr-2 h-5 w-5"/>
                <span>
                    <span className="hidden sm:inline">Registrar </span>Egreso
                </span>
            </Button>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de ingresos este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos (Mes)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de egresos este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${inventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor de costo total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${accountsReceivable.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{accountsReceivable.count} cuentas pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento Financiero</CardTitle>
            <CardDescription>Ingresos vs. Egresos en los últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `RD$${value / 1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-accent h-5 w-5"/> Alertas de Inventario
            </CardTitle>
            <CardDescription>Productos con bajo nivel de stock que requieren atención.</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Nivel de Reorden</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lowStockItems.map((item) => (
                    <TableRow key={item.sku}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">
                            <Badge variant="destructive">{item.stock} {item.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{item.reorderLevel} {item.unit}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay alertas de inventario.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Añadir Ingreso</DialogTitle>
                  <DialogDescription>
                      Añade un nuevo ingreso a tus registros.
                  </DialogDescription>
              </DialogHeader>
              <IncomeForm onSave={handleIncomeSave} income={null} clients={allClients} />
          </DialogContent>
      </Dialog>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Añadir Egreso</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo egreso a tus registros.
                  </DialogDescription>
              </DialogHeader>
              <ExpenseForm onSave={handleExpenseSave} suppliers={allSuppliers} />
          </DialogContent>
      </Dialog>
    </div>
  );
}
