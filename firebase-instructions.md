# Cómo Configurar las Credenciales de Firebase

Para que la aplicación funcione, necesitas obtener tus credenciales de Firebase y añadirlas al archivo `.env.local` en la raíz de tu proyecto.

Sigue estos pasos:

1.  **Ve a la Consola de Firebase:**
    Abre tu navegador y ve a [https://console.firebase.google.com/](https://console.firebase.google.com/).

2.  **Selecciona tu Proyecto:**
    Haz clic en el proyecto de Firebase que estás utilizando para esta aplicación.

3.  **Accede a la Configuración del Proyecto:**
    - En el panel de la izquierda, haz clic en el ícono de engranaje (⚙️) junto a "Resumen del proyecto".
    - Selecciona "Configuración del proyecto".

4.  **Busca la Configuración de tu App Web:**
    - En la pestaña "General", desplázate hacia abajo hasta la sección "Tus apps".
    - Busca tu aplicación web. Si no tienes una, deberás crearla haciendo clic en el icono `</>`.
    - Una vez que tengas tu app web, busca la sección "Fragmento de SDK de Firebase" y selecciona la opción "Configuración".

5.  **Copia las Credenciales:**
    Verás un objeto de configuración similar a este:

    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...-...",
      authDomain: "tu-proyecto-id.firebaseapp.com",
      projectId: "tu-proyecto-id",
      storageBucket: "tu-proyecto-id.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:..."
    };
    ```

6.  **Pega las Credenciales en `.env.local`:**
    Abre el archivo `.env.local` en tu editor de código y pega los valores correspondientes. **No incluyas las comillas.**

    ```dotenv
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...-...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
    NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
    ```

7.  **Reinicia el Servidor de Desarrollo:**
    Después de guardar los cambios en `.env.local`, es **muy importante** que detengas tu servidor de desarrollo (si está corriendo) y lo vuelvas a iniciar. Next.js solo carga las variables de entorno al iniciar.

¡Y eso es todo! La aplicación ahora debería poder conectarse a Firebase sin problemas.
