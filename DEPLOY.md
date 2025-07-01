# Cómo Desplegar tu Aplicación en Firebase

Esta guía te mostrará cómo desplegar tu aplicación Next.js utilizando **Firebase Hosting**. El proyecto ya está preconfigurado para que este proceso sea rápido y sencillo.

## Requisitos Previos

1.  **Tener una cuenta de Firebase:** Si no tienes una, puedes crearla gratis en [firebase.google.com](https://firebase.google.com/).
2.  **Tener un proyecto de Firebase:** Crea un nuevo proyecto desde la [Consola de Firebase](https://console.firebase.google.com/).
3.  **Tener Node.js y npm instalados:** Necesitarás `npm` para instalar la herramienta de línea de comandos de Firebase.

---

## Paso 1: Instalar la Firebase CLI

La Firebase CLI (Command Line Interface) es la herramienta que te permite interactuar con tu proyecto de Firebase desde la terminal. Si no la tienes instalada, ábrela y ejecuta el siguiente comando:

```bash
npm install -g firebase-tools
```

Este comando instala la herramienta de forma global en tu sistema.

---

## Paso 2: Iniciar Sesión en Firebase

Ahora, necesitas conectar la CLI a tu cuenta de Firebase. Ejecuta este comando en tu terminal:

```bash
firebase login
```

Esto abrirá una ventana en tu navegador para que inicies sesión con tu cuenta de Google y autorices a la Firebase CLI.

---

## Paso 3: Asociar tu Proyecto de Firebase

Si es la primera vez que despliegas, necesitas asociar este código con el proyecto que creaste en la Consola de Firebase. Ejecuta el siguiente comando y sigue las instrucciones para seleccionar tu proyecto:

```bash
firebase use --add
```

La terminal te guiará para que elijas tu proyecto de Firebase de una lista. Esto creará un archivo `.firebaserc` que vincula tu código local con tu proyecto en la nube.

---

## Paso 4: ¡Desplegar la Aplicación!

¡Esta es la parte más fácil! Con todo configurado, solo necesitas ejecutar un comando para construir y desplegar tu aplicación:

```bash
firebase deploy
```

La Firebase CLI leerá tu archivo `firebase.json`, que le indica que debe:
1.  **Construir la aplicación:** Ejecuta `npm run build` para generar la versión estática y optimizada de tu app en la carpeta `out`.
2.  **Desplegar los archivos:** Sube el contenido de la carpeta `out` a Firebase Hosting.

Este proceso puede tardar unos minutos. Verás el progreso en la terminal.

---

## Paso 5: ¡Prueba tu Aplicación!

Una vez que el despliegue termine, la terminal te mostrará un mensaje de éxito y una **URL de Alojamiento**. ¡Ese es el enlace público a tu aplicación!

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/tu-proyecto-id/overview
Hosting URL: https://tu-proyecto-id.web.app
```

Copia la `Hosting URL` en tu navegador para ver tu aplicación en vivo.

**¡Felicidades, has desplegado tu aplicación!**
