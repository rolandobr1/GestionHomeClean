'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import React from 'react';

type ConfigKeys =
  | 'apiKey'
  | 'authDomain'
  | 'projectId'
  | 'storageBucket'
  | 'messagingSenderId'
  | 'appId';

const configLabels: Record<ConfigKeys, string> = {
    apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
    authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

interface FirebaseConfigStatusProps {
    config: {
        [K in ConfigKeys]: string | undefined;
    };
}

export function FirebaseConfigStatus({ config }: FirebaseConfigStatusProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-xl">Configuración de Firebase Incompleta</CardTitle>
          <CardDescription>
            La aplicación no puede conectar con Firebase porque faltan algunas
            credenciales o no se han cargado correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>¡Acción Requerida!</AlertTitle>
            <AlertDescription>
              <p className="mt-2">
                Por favor, revisa tu archivo <code>.env.local</code> y sigue los pasos de la guía de solución de problemas a continuación.
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                Consulta <code>firebase-instructions.md</code> para ver la guía detallada de cómo obtener las claves.
              </p>
            </AlertDescription>
          </Alert>
          <div className="border rounded-md p-4 space-y-2 text-sm">
             <h4 className="font-semibold mb-2">Estado de las Credenciales:</h4>
             {Object.entries(configLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                    <span className="font-mono text-xs">{label}</span>
                    {config[key as ConfigKeys] ? (
                        <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Detectada
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-4 w-4" /> Faltante
                        </span>
                    )}
                </div>
             ))}
          </div>

          <Card className="mt-4 bg-amber-50 border-amber-200">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    Guía de Solución de Problemas
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 space-y-4">
                <div className="space-y-1">
                    <h4 className="font-semibold">1. ¿Reiniciaste el servidor?</h4>
                    <p>
                        Next.js solo carga el archivo <code>.env.local</code> al iniciar. Si has modificado las claves, detén el servidor (con <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">C</kbd>) y vuelve a ejecutar <code>npm run dev</code>.
                    </p>
                </div>
                <div className="space-y-1">
                    <h4 className="font-semibold">2. ¿Usaste comillas en el archivo?</h4>
                    <p>
                        Los valores en <code>.env.local</code> <strong>no</strong> deben llevar comillas.
                    </p>
                    <div className="font-mono text-xs bg-gray-100 p-2 rounded-md space-y-1">
                        <div><span className="font-bold text-green-700 mr-2">✅ Correcto:</span><span className="text-gray-600">NEXT_PUBLIC_...=AIza...</span></div>
                        <div><span className="font-bold text-red-700 mr-2">❌ Incorrecto:</span><span className="text-gray-600">NEXT_PUBLIC_...="AIza..."</span></div>
                    </div>
                </div>
                <div className="space-y-1">
                    <h4 className="font-semibold">3. ¿Copiaste bien las claves?</h4>
                    <p>
                        Asegúrate de haber copiado el valor completo de cada clave, sin espacios extra al principio o al final.
                    </p>
                </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
