'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CheckCircle, XCircle } from "lucide-react";
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
      <Card className="mx-auto max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-xl">Configuración de Firebase Incompleta</CardTitle>
          <CardDescription>
            La aplicación no puede conectar con Firebase porque faltan algunas
            credenciales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>¡Acción Requerida!</AlertTitle>
            <AlertDescription>
              <p className="mt-2">
                Por favor, revisa tu archivo <code>.env.local</code> y asegúrate de que
                contenga todas las siguientes variables. Después, <strong>reinicia el servidor</strong>.
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                Consulta <code>firebase-instructions.md</code> para ver la guía detallada.
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
        </CardContent>
      </Card>
    </div>
  );
}
