
"use client";

import React, { useState, useEffect } from 'react';
import type { Product, RawMaterial, Supplier } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppData } from '@/hooks/use-app-data';

type InventoryItem = Product | RawMaterial;
type FormDataType = Partial<Product & RawMaterial>;

interface InventoryFormProps {
  item: InventoryItem | null;
  itemType: 'product' | 'rawMaterial';
  onSave: (itemData: any, stockAdjustment: number) => Promise<void>;
  onClose: () => void;
}

export const InventoryForm = ({ item, itemType, onSave, onClose }: InventoryFormProps) => {
  const { suppliers } = useAppData();
  const [formData, setFormData] = useState<FormDataType>({});
  const [stockAdjustment, setStockAdjustment] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const allSuppliers = [{ id: 'generic', name: 'Suplidor Genérico', code: 'SUP-000', email: '', phone: '', address: '' }, ...suppliers];

  useEffect(() => {
    if (item) {
      // Don't include stock in the editable form data
      const { stock, ...rest } = item;
      setFormData(rest);
    } else {
      setFormData({
        name: '',
        sku: '',
        unit: '',
        stock: 0,
        reorderLevel: 0,
        ...(itemType === 'product' ? { salePriceRetail: 0, salePriceWholesale: 0 } : {}),
        ...(itemType === 'rawMaterial' ? { purchasePrice: 0, supplierId: 'generic' } : {}),
      });
    }
    setStockAdjustment(0);
  }, [item, itemType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, supplierId: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const finalData = { ...item, ...formData };
        await onSave(finalData, stockAdjustment);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-4">
        <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={formData.name} onChange={handleChange} required disabled={isSaving}/>
        </div>
        <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={formData.sku} onChange={handleChange} disabled={isSaving}/>
        </div>
        
        {item ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="currentStock">Stock Actual</Label>
                    <Input id="currentStock" type="number" value={item.stock} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="stockAdjustment">Añadir al Stock</Label>
                    <Input 
                        id="stockAdjustment" 
                        type="number" 
                        value={stockAdjustment} 
                        onChange={(e) => setStockAdjustment(Number(e.target.value) || 0)} 
                        inputMode="decimal" 
                        onFocus={(e) => e.target.select()} 
                        disabled={isSaving}
                        placeholder="0"
                    />
                </div>
            </div>
        ) : (
             <div className="space-y-2">
                <Label htmlFor="stock">Stock Inicial</Label>
                <Input id="stock" type="number" value={formData.stock} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
            </div>
        )}

        <div className="space-y-2">
            <Label htmlFor="unit">Unidad</Label>
            <Input id="unit" value={formData.unit} onChange={handleChange} disabled={isSaving}/>
        </div>

        {itemType === 'product' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="salePriceRetail">Precio Detalle</Label>
                  <Input id="salePriceRetail" type="number" value={formData.salePriceRetail} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="salePriceWholesale">Precio Por Mayor</Label>
                  <Input id="salePriceWholesale" type="number" value={formData.salePriceWholesale} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving} />
              </div>
          </div>
        )}

        {itemType === 'rawMaterial' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="purchasePrice">Precio Compra</Label>
                <Input id="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reorderLevel">Nivel Reorden</Label>
                <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
            </div>
          </div>
        )}
        
        {itemType === 'product' && (
            <div className="space-y-2">
                <Label htmlFor="reorderLevel">Nivel Reorden</Label>
                <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} required inputMode="decimal" onFocus={(e) => e.target.select()} disabled={isSaving}/>
            </div>
        )}

        {itemType === 'rawMaterial' && (
          <div className="space-y-2">
              <Label htmlFor="supplierId">Suplidor</Label>
              <Select onValueChange={handleSelectChange} value={formData.supplierId} disabled={isSaving}>
                  <SelectTrigger id="supplierId">
                      <SelectValue placeholder="Selecciona un suplidor" />
                  </SelectTrigger>
                  <SelectContent>
                      {allSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
        )}
      </div>
      <DialogFooter className="pt-4 border-t">
        <DialogClose asChild>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogFooter>
    </form>
  );
};
