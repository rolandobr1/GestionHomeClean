
"use client";

import React, { useState, useEffect } from 'react';
import type { Client, Supplier } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';

type Contact = Omit<Client, 'id' | 'code'> | Omit<Supplier, 'id' | 'code'> | Client | Supplier;

interface ContactFormProps {
  contact: Contact | null;
  onSave: (contactData: Contact) => Promise<void>;
  onClose: () => void;
}

export const ContactForm = ({ contact, onSave, onClose }: ContactFormProps) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
      });
    } else {
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
  }, [contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        if (contact && 'id' in contact) {
            await onSave({ ...contact, ...formData });
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
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={formData.name} onChange={handleChange} required disabled={isSaving}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleChange} disabled={isSaving}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={formData.phone} onChange={handleChange} disabled={isSaving}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" value={formData.address} onChange={handleChange} disabled={isSaving}/>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogFooter>
    </form>
  );
};
