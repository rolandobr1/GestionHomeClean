"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from '@/hooks/use-app-data';
import type { InvoiceSettings } from '@/components/app-provider';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';

export default function AjustesPage() {
  const { invoiceSettings, updateInvoiceSettings } = useAppData();
  const { toast } = useToast();
  const [formData, setFormData] = useState<InvoiceSettings>(invoiceSettings);

  useEffect(() => {
    setFormData(invoiceSettings);
  }, [invoiceSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceSettings(formData);
    toast({
      title: "Ajustes Guardados",
      description: "La información de la factura ha sido actualizada.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground">Gestiona la configuración de tu aplicación.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Factura</CardTitle>
          <CardDescription>Estos datos aparecerán en todas las facturas que generes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <Input id="companyName" value={formData.companyName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Dirección de la Empresa</Label>
              <Input id="companyAddress" value={formData.companyAddress} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyRNC">RNC</Label>
              <Input id="companyRNC" value={formData.companyRNC} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="companyLogo">URL del Logo</Label>
                <Input id="companyLogo" value={formData.companyLogo} onChange={handleChange} placeholder="Ej: /logohomeclean.png" />
                <p className="text-sm text-muted-foreground">
                    Usa una ruta local (ej. /logo.png) o una URL completa (ej. https://...). El logo debe estar en la carpeta `public` de tu proyecto.
                </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shareMessage">Mensaje para Compartir Factura</Label>
              <Textarea id="shareMessage" value={formData.shareMessage || ''} onChange={handleChange} placeholder="Ej: Aquí está tu factura de QuimioGest." />
              <p className="text-sm text-muted-foreground">
                Este texto se usará al compartir una factura por WhatsApp u otras apps.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
