"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AjustesPage() {
    const { toast } = useToast();

    const handleImportClick = () => {
        toast({
            title: 'Función no disponible',
            description: 'La importación de datos masivos no está implementada en este prototipo.',
        });
    };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Ajustes y Exportación</h1>
            <p className="text-muted-foreground">Gestiona tu cuenta y tus datos.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCog className="h-5 w-5"/>Importar Datos</CardTitle>
                <CardDescription>Importa datos masivamente desde un archivo CSV.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 flex flex-col items-center text-center gap-2">
                    <Upload className="h-8 w-8 text-primary"/>
                    <h3 className="font-semibold">Importar Datos</h3>
                    <p className="text-sm text-muted-foreground">Sube un archivo CSV para añadir productos o registros en bloque.</p>
                    <Button variant="outline" className="mt-2" onClick={handleImportClick}>Importar Archivo (CSV)</Button>
                </Card>
            </CardContent>
        </Card>
    </div>
  );
}
