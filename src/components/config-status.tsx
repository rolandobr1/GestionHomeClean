'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
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
  const allKeysPresent = Object.values(config).every(Boolean);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-xl">Error de Conexión con Firebase</CardTitle>
          <CardDescription>
            La aplicación no puede conectar con Firebase. Revisa los siguientes puntos para solucionarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>¡Acción Requerida!</AlertTitle>
            <AlertDescription>
              {allKeysPresent 
                ? "Todas las credenciales están presentes, pero la conexión falló. Revisa la guía de solución de problemas para habilitar los servicios necesarios en Firebase."
                : "Faltan algunas credenciales de Firebase. Revisa tu archivo .env.local (para desarrollo local) o los 'Secrets' (para la previsualización)."
              }
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Nota para la Previsualización</AlertTitle>
            <AlertDescription>
              Si ya has añadido los 'Secrets' y sigues viendo este error, asegúrate de que los nombres de los secrets coincidan **exactamente** con los que se listan abajo, incluyendo el prefijo `NEXT_PUBLIC_`. Luego, intenta forzar un reinicio de la previsualización haciendo un cambio pequeño en el código.
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
                    <h4 className="font-semibold">1. Habilita las APIs de Google Cloud</h4>
                    <p>
                        A menudo el problema es que las APIs necesarias no están activas. Ve a la <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="underline">Biblioteca de APIs de Google Cloud</a> y asegúrate de que las siguientes APIs estén **HABILITADAS** para tu proyecto:
                        <ul className="list-disc pl-5 mt-1 font-medium">
                            <li>Identity Toolkit API</li>
                            <li>Cloud Firestore API</li>
                        </ul>
                    </p>
                </div>
                 <div className="space-y-1">
                    <h4 className="font-semibold">2. Habilita el proveedor de Correo/Contraseña</h4>
                    <p>
                        En la Consola de Firebase, ve a **Authentication** &rarr; **Sign-in method** y asegúrate de que **Correo electrónico/Contraseña** esté habilitado.
                    </p>
                </div>
                <div className="space-y-1">
                    <h4 className="font-semibold">3. Reinicia el servidor (para desarrollo local)</h4>
                    <p>
                        Next.js solo carga el archivo <code>.env.local</code> al iniciar. Detén el servidor (con <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">C</kbd>) y vuelve a ejecutar <code>npm run dev</code>.
                    </p>
                </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
