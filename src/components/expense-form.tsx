
"use client";

import React, { useState, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Expense } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSave: (expenseData: Omit<Expense, 'id' | 'balance' | 'payments' | 'recordedBy'> | Expense) => Promise<void>;
  onClose: () => void;
}

export const ExpenseForm = ({ expense = null, onSave, onClose }: ExpenseFormProps) => {
    const { suppliers, expenseCategories, invoiceSettings } = useAppData();
    const [isSaving, setIsSaving] = useState(false);
    
    const getInitialState = (exp: Expense | null) => {
        if (exp) {
            return {
                description: exp.description,
                amount: exp.amount,
                date: format(new Date(exp.date + 'T00:00:00'), 'yyyy-MM-dd'),
                category: exp.category,
                supplierId: exp.supplierId || 'generic',
                paymentMethod: exp.paymentMethod || 'contado',
                paymentType: exp.paymentType || (invoiceSettings.paymentMethods[0] || '')
            };
        }
        return {
            description: '',
            amount: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
            category: expenseCategories.length > 0 ? expenseCategories[0] : 'Otro',
            supplierId: 'generic',
            paymentMethod: 'contado' as const,
            paymentType: invoiceSettings.paymentMethods.length > 0 ? invoiceSettings.paymentMethods[0] : ''
        };
    };

    const [formData, setFormData] = useState(getInitialState(expense));

    useEffect(() => {
        setFormData(getInitialState(expense));
    }, [expense, expenseCategories, invoiceSettings.paymentMethods]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const key = id.replace(/-form$/, '');
        setFormData(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (field: 'category' | 'supplierId' | 'paymentMethod' | 'paymentType') => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (expense) {
                await onSave({ ...expense, ...formData });
            } else {
                await onSave(formData);
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="supplierId-form">Suplidor</Label>
                    <Select onValueChange={handleSelectChange('supplierId')} value={formData.supplierId} disabled={isSaving}>
                        <SelectTrigger id="supplierId-form">
                            <SelectValue placeholder="Selecciona un suplidor" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod-form">Condición de Pago</Label>
                        <Select onValueChange={handleSelectChange('paymentMethod')} value={formData.paymentMethod} disabled={isSaving}>
                            <SelectTrigger id="paymentMethod-form">
                                <SelectValue placeholder="Selecciona un método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contado">Contado</SelectItem>
                                <SelectItem value="credito">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.paymentMethod === 'contado' && (
                        <div className="space-y-2">
                            <Label htmlFor="paymentType-form">Método de Pago</Label>
                            <Select onValueChange={handleSelectChange('paymentType')} value={formData.paymentType} disabled={isSaving}>
                                <SelectTrigger id="paymentType-form">
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoiceSettings.paymentMethods.map(method => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category-form">Categoría</Label>
                    <Select onValueChange={handleSelectChange('category')} value={formData.category} disabled={isSaving}>
                        <SelectTrigger id="category-form">
                            <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description-form">Descripción</Label>
                    <Input id="description-form" value={formData.description} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount-form">Monto</Label>
                    <Input id="amount-form" type="number" value={formData.amount} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date-form">Fecha</Label>
                    <Input id="date-form" type="date" value={formData.date} onChange={handleChange} required disabled={isSaving} />
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
