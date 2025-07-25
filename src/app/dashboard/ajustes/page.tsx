
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
import { X, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


export default function AjustesPage({ params, searchParams }: { params: any; searchParams: any; }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const { 
    invoiceSettings, 
    updateInvoiceSettings, 
    expenseCategories,
    updateExpenseCategories,
  } = useAppData();
  const { toast } = useToast();
  const [formData, setFormData] = useState<InvoiceSettings>(invoiceSettings);
  const [isSaving, setIsSaving] = useState(false);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [isSavingPaymentMethod, setIsSavingPaymentMethod] = useState(false);

  useEffect(() => {
    const defaultSettings: Partial<InvoiceSettings> = {
      paymentMethods: [],
      priceLabels: { retail: '', wholesale: '' },
    };
    setFormData({ ...defaultSettings, ...invoiceSettings });
  }, [invoiceSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id.startsWith('priceLabels.')) {
        const key = id.split('.')[1] as keyof InvoiceSettings['priceLabels'];
        setFormData(prev => ({
            ...prev,
            priceLabels: { ...prev.priceLabels, [key]: value }
        }));
    } else {
        setFormData(prev => ({ ...prev, [id]: value }));
    }
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

  const handleAddCategory = async () => {
    if (newCategory && !expenseCategories.includes(newCategory)) {
        setIsSavingCategory(true);
        try {
            const updated = [...expenseCategories, newCategory];
            await updateExpenseCategories(updated);
            setNewCategory('');
            setIsCategoryDialogOpen(false);
            toast({ title: 'Categoría Añadida' });
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo añadir la categoría.', variant: 'destructive' });
        } finally {
            setIsSavingCategory(false);
        }
    }
  }

  const handleDeleteCategory = async (categoryToDelete: string) => {
      try {
          const updated = expenseCategories.filter(c => c !== categoryToDelete);
          await updateExpenseCategories(updated);
          toast({ title: 'Categoría Eliminada' });
      } catch (error) {
          toast({ title: 'Error', description: 'No se pudo eliminar la categoría.', variant: 'destructive' });
      }
  }
  
  const handleAddPaymentMethod = async () => {
      if (newPaymentMethod && !formData.paymentMethods.includes(newPaymentMethod)) {
          setIsSavingPaymentMethod(true);
          try {
              const updated = { ...formData, paymentMethods: [...formData.paymentMethods, newPaymentMethod] };
              await updateInvoiceSettings(updated);
              setFormData(updated);
              setNewPaymentMethod('');
              setIsPaymentMethodDialogOpen(false);
              toast({ title: 'Método de Pago Añadido' });
          } catch (error) {
              toast({ title: 'Error', description: 'No se pudo añadir el método de pago.', variant: 'destructive' });
          } finally {
              setIsSavingPaymentMethod(false);
          }
      }
  }
  
  const handleDeletePaymentMethod = async (methodToDelete: string) => {
      try {
          const updated = { ...formData, paymentMethods: formData.paymentMethods.filter(m => m !== methodToDelete) };
          await updateInvoiceSettings(updated);
          setFormData(updated);
          toast({ title: 'Método de Pago Eliminado' });
      } catch (error) {
          toast({ title: 'Error', description: 'No se pudo eliminar el método de pago.', variant: 'destructive' });
      }
  }

  if (loading || !user || user.role !== 'admin') {
    return (
        <div className="flex justify-center items-center h-full p-8">
            <p className="text-muted-foreground">No tienes permiso para ver esta página.</p>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Información de la Factura</CardTitle>
                <CardDescription>Estos datos aparecerán en todas las facturas que generes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                  <CardTitle>Personalización de Formularios</CardTitle>
                  <CardDescription>Edita las opciones disponibles en los formularios de la aplicación.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="space-y-2">
                      <h4 className="font-semibold">Categorías de Egresos</h4>
                      <p className="text-sm text-muted-foreground">Gestiona las categorías que aparecen al registrar un nuevo egreso.</p>
                      <div className="rounded-md border p-4 space-y-2">
                          <div className="flex flex-wrap gap-2">
                              {expenseCategories.map(category => (
                                  <AlertDialog key={category}>
                                      <div className="flex items-center gap-1 bg-muted rounded-full pl-3 pr-1 py-1 text-sm">
                                          <span>{category}</span>
                                          <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                                  <X className="h-3.5 w-3.5"/>
                                              </Button>
                                          </AlertDialogTrigger>
                                      </div>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar "{category}"?</AlertDialogTitle>
                                              <AlertDialogDescription>Esta acción no se puede deshacer. La categoría se eliminará de la lista.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteCategory(category)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              ))}
                          </div>
                          <Button variant="outline" size="sm" type="button" onClick={() => setIsCategoryDialogOpen(true)}>
                              <PlusCircle className="mr-2 h-4 w-4"/>
                              Añadir Categoría
                          </Button>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <h4 className="font-semibold">Métodos de Pago (Contado)</h4>
                      <p className="text-sm text-muted-foreground">Define los métodos de pago disponibles para transacciones al contado.</p>
                      <div className="rounded-md border p-4 space-y-2">
                          <div className="flex flex-wrap gap-2">
                              {(formData.paymentMethods || []).map(method => (
                                  <AlertDialog key={method}>
                                      <div className="flex items-center gap-1 bg-muted rounded-full pl-3 pr-1 py-1 text-sm">
                                          <span>{method}</span>
                                          <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                                  <X className="h-3.5 w-3.5"/>
                                              </Button>
                                          </AlertDialogTrigger>
                                      </div>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar "{method}"?</AlertDialogTitle>
                                              <AlertDialogDescription>Esta acción no se puede deshacer. El método de pago se eliminará de la lista.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeletePaymentMethod(method)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              ))}
                          </div>
                          <Button variant="outline" size="sm" type="button" onClick={() => setIsPaymentMethodDialogOpen(true)}>
                              <PlusCircle className="mr-2 h-4 w-4"/>
                              Añadir Método
                          </Button>
                      </div>
                  </div>
                   <div className="space-y-4">
                        <h4 className="font-semibold">Etiquetas de Precios</h4>
                        <p className="text-sm text-muted-foreground">Personaliza los nombres de los niveles de precio en el formulario de ingresos.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priceLabels.retail">Etiqueta Precio #1</Label>
                                <Input id="priceLabels.retail" value={formData.priceLabels?.retail || ''} onChange={handleChange} placeholder="Ej: Detalle" disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priceLabels.wholesale">Etiqueta Precio #2</Label>
                                <Input id="priceLabels.wholesale" value={formData.priceLabels?.wholesale || ''} onChange={handleChange} placeholder="Ej: Por Mayor" disabled={isSaving} />
                            </div>
                        </div>
                    </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}
                </Button>
            </div>
        </form>
      </div>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Añadir Nueva Categoría</DialogTitle>
                  <DialogDescription>
                      Escribe el nombre de la nueva categoría para egresos.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                  <Label htmlFor="newCategory">Nombre de la Categoría</Label>
                  <Input id="newCategory" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} disabled={isSavingCategory}/>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="secondary" disabled={isSavingCategory}>Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleAddCategory} disabled={isSavingCategory || !newCategory} type="button">
                      {isSavingCategory ? 'Guardando...' : 'Guardar'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Añadir Nuevo Método de Pago</DialogTitle>
                  <DialogDescription>
                      Escribe el nombre del nuevo método de pago (ej. Cheque, Yape, etc.).
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                  <Label htmlFor="newPaymentMethod">Nombre del Método de Pago</Label>
                  <Input id="newPaymentMethod" value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)} disabled={isSavingPaymentMethod}/>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="secondary" disabled={isSavingPaymentMethod}>Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleAddPaymentMethod} disabled={isSavingPaymentMethod || !newPaymentMethod} type="button">
                      {isSavingPaymentMethod ? 'Guardando...' : 'Guardar'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
