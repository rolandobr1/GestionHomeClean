# Cómo Configurar las Credenciales de Firebase

Para que la aplicación funcione correctamente, necesitas **habilitar los servicios necesarios** y **añadir tus credenciales de Firebase** al archivo `.env.local` (para desarrollo local) o a los "Secrets" (para la previsualización).

---

## ✅ Paso 1: Habilitar las APIs de Google Cloud

Este es el paso más importante y el que se suele olvidar.

1.  **Ve a la Biblioteca de APIs de Google Cloud:** [console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)
2.  **Selecciona tu proyecto "HOMECLEAN"** en la parte superior.
3.  Busca y **habilita** las siguientes dos APIs (si no lo están ya):
    *   **Identity Toolkit API** (Esencial para la autenticación)
    *   **Cloud Firestore API** (Esencial para la base de datos)

---

## ✅ Paso 2: Habilitar la Autenticación y Crear la Base de Datos

1.  **Habilita el proveedor de Correo/Contraseña:**
    *   En la [Consola de Firebase](https://console.firebase.google.com/), ve a **Authentication** (en el menú Build de la izquierda).
    *   Ve a la pestaña **Sign-in method**.
    *   Haz clic en **Correo electrónico/Contraseña** y asegúrate de que esté **Habilitado**.

2.  **Crea la Base de Datos Firestore:**
    *   En la Consola de Firebase, ve a **Firestore Database**.
    *   Haz clic en **Crear base de datos**.
    *   Elige **Modo de producción** y haz clic en "Siguiente".
    *   Deja la ubicación por defecto y haz clic en **"Habilitar"**.

3.  **Configura las Reglas de Seguridad:**
    *   Una vez creada la base de datos, ve a la pestaña **Reglas**.
    *   Reemplaza el contenido con lo siguiente y haz clic en **Publicar**:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if true; // Permite leer/escribir para desarrollo inicial.
        }
      }
    }
    ```

---

## ✅ Paso 3: Obtener y Añadir las Credenciales

1.  **Accede a la Configuración del Proyecto:**
    *   En la Consola de Firebase, haz clic en el ícono de engranaje (⚙️) junto a "Resumen del proyecto".
    *   Selecciona "Configuración del proyecto".

2.  **Busca la Configuración de tu App Web:**
    *   En la pestaña "General", desplázate hacia abajo hasta la sección "Tus apps".
    *   Busca tu aplicación web (si no tienes una, crea una con el icono `</>`).
    *   En la sección "Fragmento de SDK de Firebase", selecciona la opción **"Configuración"**.

3.  **Copia y Pega las Credenciales:**
    *   Verás un objeto de configuración. Copia los valores en tu archivo `.env.local` (sin comillas) o en los "Secrets" de la previsualización.

    ```dotenv
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...-...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
    NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
    ```

---

## ✅ Paso 4: Reinicia el Servidor

Si has hecho cambios en el archivo `.env.local`, detén tu servidor de desarrollo (<kbd>Ctrl</kbd>+<kbd>C</kbd>) y vuelve a iniciarlo con `npm run dev`. ¡Este paso es crucial!
