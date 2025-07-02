
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from '@/hooks/use-app-data';
import type { InvoiceSettings, Income, Expense, Product, Client, Supplier, RawMaterial } from '@/components/app-provider';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function AjustesPage({ params, searchParams }: { params: any; searchParams: any; }) {
  const { 
    invoiceSettings, 
    updateInvoiceSettings, 
    incomes, 
    expenses, 
    products,
    rawMaterials,
    clients, 
    suppliers 
  } = useAppData();
  const { toast } = useToast();
  const [formData, setFormData] = useState<InvoiceSettings>(invoiceSettings);
  const [isSaving, setIsSaving] = useState(false);

  const allClients = useMemo(() => [{ id: 'generic', name: 'Cliente Genérico', email: '', phone: '', address: '' }, ...clients], [clients]);
  const allSuppliers = useMemo(() => [{ id: 'generic', name: 'Suplidor Genérico', email: '', phone: '', address: '' }, ...suppliers], [suppliers]);

  useEffect(() => {
    setFormData(invoiceSettings);
  }, [invoiceSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateInvoiceSettings(formData);
      toast({
        title: "Ajustes Guardados",
        description: "La información ha sido actualizada.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudieron guardar los ajustes. Inténtalo de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Factura</CardTitle>
          <CardDescription>Estos datos aparecerán en todas las facturas que generes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <Input id="companyName" value={formData.companyName} onChange={handleChange} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Dirección de la Empresa</Label>
              <Input id="companyAddress" value={formData.companyAddress} onChange={handleChange} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyRNC">RNC</Label>
              <Input id="companyRNC" value={formData.companyRNC} onChange={handleChange} disabled={isSaving} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="companyLogo">URL del Logo</Label>
                <Input id="companyLogo" value={formData.companyLogo} onChange={handleChange} placeholder="Ej: /logohomeclean.png" disabled={isSaving} />
                <p className="text-sm text-muted-foreground">
                    Usa una ruta local (ej. /logo.png) o una URL completa (ej. https://...). El logo debe estar en la carpeta `public` de tu proyecto.
                </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shareMessage">Mensaje para Compartir Factura</Label>
              <Textarea id="shareMessage" value={formData.shareMessage || ''} onChange={handleChange} placeholder="Ej: Aquí está tu factura de HOMECLEAN." disabled={isSaving} />
              <p className="text-sm text-muted-foreground">
                Este texto se usará al compartir una factura por WhatsApp u otras apps.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Vista de Datos del Sistema</CardTitle>
          <CardDescription>Visualiza todos los registros almacenados en la aplicación. Solo lectura.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="incomes" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <TabsTrigger value="incomes">Ingresos</TabsTrigger>
                    <TabsTrigger value="expenses">Egresos</TabsTrigger>
                    <TabsTrigger value="products">Productos</TabsTrigger>
                    <TabsTrigger value="rawMaterials">Materia Prima</TabsTrigger>
                    <TabsTrigger value="clients">Clientes</TabsTrigger>
                    <TabsTrigger value="suppliers">Suplidores</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  <TabsContent value="incomes">
                      <div className="w-full overflow-x-auto">
                          <Table>
                              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha</TableHead><TableHead>Monto</TableHead><TableHead>Registrado Por</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {incomes.map((item: Income) => (
                                      <TableRow key={item.id}><TableCell>{item.id.slice(-6)}</TableCell><TableCell>{allClients.find(c=>c.id === item.clientId)?.name}</TableCell><TableCell>{format(new Date(item.date), 'P', { locale: es })}</TableCell><TableCell>RD${item.totalAmount.toFixed(2)}</TableCell><TableCell>{item.recordedBy}</TableCell></TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>
                  <TabsContent value="expenses">
                      <div className="w-full overflow-x-auto">
                          <Table>
                              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Descripción</TableHead><TableHead>Suplidor</TableHead><TableHead>Fecha</TableHead><TableHead>Monto</TableHead><TableHead>Registrado Por</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {expenses.map((item: Expense) => (
                                      <TableRow key={item.id}><TableCell>{item.id.slice(-6)}</TableCell><TableCell>{item.description}</TableCell><TableCell>{allSuppliers.find(s=>s.id === item.supplierId)?.name}</TableCell><TableCell>{format(new Date(item.date), 'P', { locale: es })}</TableCell><TableCell>RD${item.amount.toFixed(2)}</TableCell><TableCell>{item.recordedBy}</TableCell></TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>
                   <TabsContent value="products">
                      <div className="w-full overflow-x-auto">
                          <Table>
                              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>SKU</TableHead><TableHead>Stock</TableHead><TableHead>Precio Detalle</TableHead><TableHead>Precio Por Mayor</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {products.map((item: Product) => (
                                      <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.sku}</TableCell><TableCell><Badge variant={item.stock <= item.reorderLevel ? "destructive" : "secondary"}>{item.stock} {item.unit}</Badge></TableCell><TableCell>RD${item.salePriceRetail.toFixed(2)}</TableCell><TableCell>RD${item.salePriceWholesale.toFixed(2)}</TableCell></TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>
                   <TabsContent value="rawMaterials">
                      <div className="w-full overflow-x-auto">
                          <Table>
                              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>SKU</TableHead><TableHead>Suplidor</TableHead><TableHead>Stock</TableHead><TableHead>Precio Compra</TableHead><TableHead>Registrado Por</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {rawMaterials.map((item: RawMaterial) => (
                                      <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.sku}</TableCell><TableCell>{allSuppliers.find(s=>s.id === item.supplierId)?.name}</TableCell><TableCell><Badge variant={item.stock <= item.reorderLevel ? "destructive" : "secondary"}>{item.stock} {item.unit}</Badge></TableCell><TableCell>RD${item.purchasePrice.toFixed(2)}</TableCell><TableCell>{item.recordedBy}</TableCell></TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>
                   <TabsContent value="clients">
                      <div className="w-full overflow-x-auto">
                          <Table>
                              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead>Dirección</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {clients.map((item: Client) => (
                                      <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.email}</TableCell><TableCell>{item.phone}</TableCell><TableCell>{item.address}</TableCell></TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>
                   <TabsContent value="suppliers">
                      <div className="w-full overflow-x-auto">
                          <Table>
                              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead>Dirección</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {suppliers.map((item: Supplier) => (
                                      <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.email}</TableCell><TableCell>{item.phone}</TableCell><TableCell>{item.address}</TableCell></TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>
                </div>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
