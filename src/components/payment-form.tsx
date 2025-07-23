
"use client";

import React, { useState, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Income, Expense } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Card } from './ui/card';

interface PaymentFormProps {
  income?: Income;
  expense?: Expense;
  onClose: () => void;
}

export const PaymentForm = ({
  income,
  expense,
  onClose,
}: PaymentFormProps) => {
  const { addPayment, addPaymentToExpense, clients, suppliers } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState('');

  const transaction = income || expense;
  const transactionType = income ? 'income' : 'expense';

  useEffect(() => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
      return;
    }
    if (!transaction) {
      toast({ variant: "destructive", title: "Error", description: "Transacción no identificada." });
      return;
    }
    
    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      toast({ variant: "destructive", title: "Monto Inválido", description: "El monto del abono debe ser mayor que cero." });
      return;
    }
    if (paymentAmount > transaction.balance) {
      toast({ variant: "destructive", title: "Monto Excede Saldo", description: "El monto del abono no puede ser mayor que el saldo pendiente." });
      return;
    }

    setIsSaving(true);
    try {
      const paymentData = {
        amount: paymentAmount,
        date,
        recordedBy: user.name,
      };

      if (transactionType === 'income') {
        await addPayment(transaction.id, paymentData);
      } else {
        await addPaymentToExpense(transaction.id, paymentData);
      }

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
  
  if (!transaction) return null;
  
  const contactName = transactionType === 'income' 
    ? clients.find(c => c.id === (transaction as Income).clientId)?.name || 'N/A'
    : suppliers.find(s => s.id === (transaction as Expense).supplierId)?.name || 'N/A';


  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{transactionType === 'income' ? 'Cliente' : 'Suplidor'}</p>
            <p className="font-semibold">{contactName}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">{transactionType === 'income' ? 'Factura Nº' : 'Egreso Nº'}</p>
            <p className="font-semibold">{transaction.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <Card className="p-4 bg-muted/50">
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground">Saldo Pendiente</div>
            <div className="text-2xl font-bold">RD${transaction.balance.toFixed(2)}</div>
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
            max={transaction.balance}
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
