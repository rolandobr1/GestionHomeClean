
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wallet, MoreHorizontal, X, ChevronsUpDown, Check, Info } from "lucide-react";
import { useAppData } from '@/hooks/use-app-data';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Income, Client, Payment } from '@/components/app-provider';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const PaymentForm = ({
  income,
  onClose,
}: {
  income: Income;
  onClose: () => void;
}) => {
  const { addPayment } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
      return;
    }
    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      toast({ variant: "destructive", title: "Monto Inválido", description: "El monto del abono debe ser mayor que cero." });
      return;
    }
    if (paymentAmount > income.balance) {
      toast({ variant: "destructive", title: "Monto Excede Saldo", description: "El monto del abono no puede ser mayor que el saldo pendiente." });
      return;
    }

    setIsSaving(true);
    try {
      await addPayment(income.id, {
        amount: paymentAmount,
        date,
        recordedBy: user.name,
      });
      toast({
        title: "Pago Registrado",
        description: `Se ha registrado un abono por RD$${paymentAmount.toFixed(2)}.`,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add payment:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar el pago." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Cliente</p>
            <p className="font-semibold">{useAppData().clients.find(c => c.id === income.clientId)?.name || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Factura Nº</p>
            <p className="font-semibold">{income.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <Card className="p-4 bg-muted/50">
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground">Saldo Pendiente</div>
            <div className="text-2xl font-bold">RD${income.balance.toFixed(2)}</div>
          </div>
        </Card>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto a Pagar</Label>
          <Input 
            id="amount" 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required 
            inputMode="decimal"
            max={income.balance}
            onFocus={(e) => e.target.select()}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha del Pago</Label>
          <Input 
            id="date" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            required
            disabled={isSaving}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={isSaving}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Pago'}
        </Button>
      </DialogFooter>
    </form>
  );
};


export default function CuentasPage({ params, searchParams }: { params: any; searchParams: any; }) {
  const { incomes, clients } = useAppData();
  
  const [paymentIncome, setPaymentIncome] = useState<Income | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const [clientFilter, setClientFilter] = useState('');
  const [recordedByFilter, setRecordedByFilter] = useState('');
  const [openClientPopover, setOpenClientPopover] = useState(false);

  const allClients = useMemo(() => [
    { id: 'generic', name: 'Cliente Genérico', email: '', phone: '', address: '' },
    ...clients
  ], [clients]);

  const allUsers = useMemo(() => {
    const users = new Set(incomes.map(i => i.recordedBy));
    return Array.from(users);
  }, [incomes]);

  const accountsReceivable = useMemo(() => {
    return incomes.filter(income => income.balance > 0.01);
  }, [incomes]);

  const filteredAccounts = useMemo(() => {
    return accountsReceivable.filter(income => {
        const incomeDate = new Date(income.date + 'T00:00:00');
        
        if (dateRange?.from && dateRange?.to) {
            const fromDate = new Date(dateRange.from.setHours(0,0,0,0));
            const toDate = new Date(dateRange.to.setHours(23,59,59,999));
            if (incomeDate < fromDate || incomeDate > toDate) return false;
        }
        
        if (clientFilter && income.clientId !== clientFilter) return false;

        if (recordedByFilter && income.recordedBy !== recordedByFilter) return false;
        
        return true;
    }).sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime());
  }, [accountsReceivable, dateRange, clientFilter, recordedByFilter]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setClientFilter('');
    setRecordedByFilter('');
  };

  const handleAddPaymentClick = (income: Income) => {
    setPaymentIncome(income);
    setIsPaymentDialogOpen(true);
  };

  useEffect(() => {
    if (!isPaymentDialogOpen) {
      setPaymentIncome(null);
    }
  }, [isPaymentDialogOpen]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            
            <Popover open={openClientPopover} onOpenChange={setOpenClientPopover}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full md:w-[240px] justify-between">
                        {clientFilter ? allClients.find(c => c.id === clientFilter)?.name : "Filtrar por cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command><CommandInput placeholder="Buscar cliente..." />
                        <CommandList><CommandEmpty>No se encontró.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem key="all" value="todos-los-clientes" onSelect={() => {setClientFilter(''); setOpenClientPopover(false);}}>
                                <Check className={`mr-2 h-4 w-4 ${clientFilter === '' ? "opacity-100" : "opacity-0"}`} />
                                Todos los clientes
                            </CommandItem>
                            {allClients.map((client) => (
                                <CommandItem key={client.id} value={client.name} onSelect={() => {setClientFilter(client.id); setOpenClientPopover(false);}}>
                                    <Check className={`mr-2 h-4 w-4 ${clientFilter === client.id ? "opacity-100" : "opacity-0"}`} />
                                    {client.name}
                                </CommandItem>
                            ))}
                        </CommandGroup></CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Select value={recordedByFilter || 'all'} onValueChange={(value) => setRecordedByFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Filtrar por usuario..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {allUsers.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Limpiar Filtros</Button>
        </CardFooter>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Facturas a Crédito Pendientes</CardTitle>
              <CardDescription>Un listado de todas las ventas a crédito con saldo pendiente.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAccounts.length > 0 ? (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="hidden md:table-cell">Fecha</TableHead>
                          <TableHead className="hidden sm:table-cell text-right">Monto Total</TableHead>
                          <TableHead className="text-right">Saldo Pendiente</TableHead>
                          <TableHead className="hidden lg:table-cell">Registrado por</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredAccounts.map((income) => {
                          const client = allClients.find(c => c.id === income.clientId);
                          return (
                              <TableRow key={income.id}>
                                  <TableCell className="font-medium">{client?.name || 'N/A'}</TableCell>
                                  <TableCell className="hidden md:table-cell">{format(new Date(income.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                  <TableCell className="hidden sm:table-cell text-right">RD${income.totalAmount.toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-semibold">RD${income.balance.toFixed(2)}</TableCell>
                                  <TableCell className="hidden lg:table-cell">{income.recordedBy}</TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleAddPaymentClick(income)}><Wallet className="mr-2 h-4 w-4" /> Registrar Pago</DropdownMenuItem>
                                            <TooltipProvider>
                                                <Tooltip><TooltipTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!income.payments || income.payments.length === 0}>
                                                        <Info className="mr-2 h-4 w-4" /> Ver Abonos
                                                    </DropdownMenuItem>
                                                </TooltipTrigger>
                                                <TooltipContent><p className="font-semibold mb-1">Historial de Pagos</p>
                                                  {income.payments.map(p=>(<div key={p.id} className="text-xs">
                                                    {format(new Date(p.date + 'T00:00:00'), 'dd/MM/yy', { locale: es })}: RD${p.amount.toFixed(2)} ({p.recordedBy})
                                                  </div>))}
                                                </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          )
                      })}
                  </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                  <Wallet className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Todo al día</h3>
                  <p className="mt-1 text-sm text-muted-foreground">No se encontraron cuentas por cobrar con los filtros actuales.</p>
              </div>
            )}
          </CardContent>
      </Card>
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago a Factura</DialogTitle>
            <DialogDescription>Añade un nuevo abono a la cuenta pendiente.</DialogDescription>
          </DialogHeader>
          {paymentIncome && <PaymentForm income={paymentIncome} onClose={() => setIsPaymentDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
