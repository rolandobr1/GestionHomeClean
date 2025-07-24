# Guía para Construir una App de Gestión como HOMECLEAN desde Cero

Esta guía describe los pasos y conceptos fundamentales para construir una aplicación de gestión empresarial (ERP/CRM) completa utilizando Next.js, Firebase y ShadCN UI, similar a la que hemos desarrollado.

---

### Sección 1: Configuración Inicial del Proyecto

El primer paso es establecer las bases de nuestra aplicación.

1.  **Crear el Proyecto Next.js:**
    Abre tu terminal y ejecuta el siguiente comando. Esto iniciará un asistente para configurar tu proyecto.

    ```bash
    npx create-next-app@latest homeclean-app
    ```

    Selecciona estas opciones cuando se te pregunte:
    *   **Would you like to use TypeScript?** `Yes`
    *   **Would you like to use ESLint?** `Yes`
    *   **Would you like to use Tailwind CSS?** `Yes`
    *   **Would you like to use `src/` directory?** `Yes`
    *   **Would you like to use App Router?** `Yes`
    *   **Would you like to customize the default import alias?** `Yes` (y configúralo a `@/*`)

2.  **Limpieza Inicial:**
    Una vez creado el proyecto, puedes eliminar el contenido por defecto de `src/app/page.tsx` y `src/app/globals.css` para empezar con un lienzo limpio.

---

### Sección 2: Interfaz de Usuario con ShadCN y Tailwind CSS

Una interfaz de usuario profesional y consistente es clave. ShadCN nos permite añadir componentes de alta calidad de forma modular.

1.  **Inicializar ShadCN:**
    En la raíz de tu proyecto, ejecuta el comando de inicialización:

    ```bash
    npx shadcn-ui@latest init
    ```

    Esto te hará algunas preguntas para configurar `components.json`. Usa los valores por defecto, que coincidirán con la configuración de tu proyecto Next.js.

2.  **Añadir Componentes:**
    A medida que construyes la aplicación, necesitarás varios componentes. Los añades uno por uno según los necesites.

    ```bash
    npx shadcn-ui@latest add button card table dialog alert-dialog dropdown-menu input label select
    ```

    Añade todos los componentes que necesites para las vistas: formularios, tablas, modales, etc. Esto creará los archivos correspondientes en `src/components/ui`.

---

### Sección 3: Integración con Firebase

Firebase será nuestro backend, manejando la base de datos y la autenticación de usuarios.

1.  **Crear Proyecto en Firebase:**
    *   Ve a la [Consola de Firebase](https://console.firebase.google.com/).
    *   Crea un nuevo proyecto.
    *   Dentro del proyecto, ve a la sección **Build**.

2.  **Habilitar Servicios:**
    *   **Authentication:** Habilita el proveedor de "Correo electrónico/Contraseña".
    *   **Firestore Database:** Crea una nueva base de datos en "Modo de producción".

3.  **Reglas de Seguridad (Inicial):**
    *   En Firestore, ve a la pestaña "Reglas" y establece reglas permisivas para el desarrollo inicial. **¡Recuerda restringirlas para producción!**
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```

4.  **Configurar la Conexión en la App:**
    *   Instala la librería de Firebase: `npm install firebase`.
    *   En la configuración de tu proyecto de Firebase, busca la "Configuración del proyecto" y copia las credenciales de tu aplicación web.
    *   Crea un archivo `.env.local` en la raíz de tu proyecto y añade las credenciales:
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY=...
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
        NEXT_PUBLIC_FIREBASE_APP_ID=...
        ```
    *   Crea el archivo `src/lib/firebase.ts` para inicializar la app y exportar las instancias de `auth` y `db`.

---

### Sección 4: Estructura, Autenticación y Navegación

Ahora definimos cómo los usuarios inician sesión y navegan por la aplicación.

1.  **Autenticación de Usuarios:**
    *   Crea un `AuthProvider` (`src/components/auth-provider.tsx`) usando `React.Context`. Este componente se encargará de:
        *   Escuchar los cambios de estado de autenticación de Firebase con `onAuthStateChanged`.
        *   Almacenar la información del usuario (`user`).
        *   Exponer las funciones `login` y `logout`.
        *   Implementar la lógica de roles (admin/editor) basada en el email del usuario.
    *   Envuelve el `RootLayout` (`src/app/layout.tsx`) con este `AuthProvider`.
    *   Crea un hook `useAuth` para acceder fácilmente a los datos del contexto.
    *   Implementa el formulario de inicio de sesión en `src/app/page.tsx`.

2.  **Layout del Dashboard:**
    *   Crea `src/app/dashboard/layout.tsx`. Este layout actuará como un guardián de rutas, verificando si el usuario está autenticado. Si no, lo redirige a la página de inicio.
    *   Diseña los componentes de navegación: `DashboardSidebar`, `DashboardHeader` y `BottomNav` (para móviles).
    *   Define las rutas, iconos y etiquetas en un archivo centralizado como `src/components/dashboard/nav-links.ts` para mantener la consistencia.

---

### Sección 5: Gestión de Datos Centralizada (AppProvider)

Para evitar pasar datos y funciones a través de múltiples niveles de componentes, usamos un `Context` para gestionar todos los datos de la aplicación.

1.  **Crear el `AppProvider`:**
    *   Crea `src/components/app-provider.tsx`.
    *   Define los tipos de datos (interfaces TypeScript) para `Income`, `Expense`, `Product`, `Client`, `Supplier`, etc.
    *   Usa `useState` para cada colección de datos (ej. `const [products, setProducts] = useState<Product[]>([]);`).

2.  **Sincronización con Firestore:**
    *   Dentro de `AppProvider`, usa `useEffect` para suscribirte a las colecciones de Firestore con `onSnapshot`.
    *   Cuando los datos en Firestore cambian, `onSnapshot` se dispara, y actualizas el estado local con `setProducts`, `setIncomes`, etc. Esto hace que la aplicación sea reactiva en tiempo real.

3.  **Exponer Funciones CRUD:**
    *   Define y exporta todas las funciones para interactuar con Firestore: `addProduct`, `updateClient`, `deleteIncome`, etc. Estas funciones usarán `addDoc`, `updateDoc`, `deleteDoc` y `writeBatch` de Firestore.
    *   La lógica para ajustar el stock de productos al añadir/eliminar un ingreso debe estar aquí para mantener la consistencia.

4.  **Envolver y Usar:**
    *   Envuelve el `{children}` del `DashboardLayout` con tu `AppProvider`.
    *   Crea el hook `useAppData` para acceder fácilmente a los datos y funciones desde cualquier componente del dashboard.

---

### Sección 6: Implementación de los Módulos CRUD

Con la estructura y la gestión de datos listas, construir cada módulo sigue un patrón repetible. Tomemos "Clientes" como ejemplo:

1.  **Página Principal (`.../contactos/clientes/page.tsx`):**
    *   Usa `useAppData()` para obtener la lista de `clients` y las funciones como `deleteClient`.
    *   Usa `useAuth()` para verificar el rol del usuario y ocultar botones (Eliminar, Importar) si no es admin.
    *   Renderiza los datos en un componente `<Table>` de ShadCN.

2.  **Formulario de Añadir/Editar:**
    *   Crea un componente de formulario reutilizable, como `ContactForm.tsx`.
    *   Usa el `Dialog` de ShadCN para mostrar este formulario.
    *   El estado para saber si el diálogo está abierto o si se está editando un cliente se maneja en la página principal.
    *   El formulario recibe el cliente a editar (o `null` si es nuevo) y una función `onSave`.

3.  **Lógica de Guardado y Eliminación:**
    *   La función `onSave` del formulario llama a `addClient` o `updateClient` del `AppProvider`.
    *   Para eliminar, usa el `AlertDialog` de ShadCN para pedir confirmación antes de llamar a `deleteClient`.

Repite este patrón para todos los demás módulos: Suplidores, Productos, Materia Prima, Ingresos y Egresos.

---

### Sección 7: Funcionalidades Avanzadas

1.  **Cuentas por Cobrar/Pagar:**
    *   Estas páginas no tienen su propia colección en Firestore. En su lugar, filtran los datos existentes de `incomes` y `expenses` donde el `balance` es mayor a cero.
    *   La funcionalidad "Registrar Pago" llama a una función en `AppProvider` que actualiza el documento correspondiente, disminuyendo el `balance` y añadiendo un objeto al array de `payments`.

2.  **Reportes y Gráficos (Balance General):**
    *   Usa el hook `useMemo` para calcular los totales y las métricas financieras a partir de los datos del `AppProvider`. Esto es eficiente porque los cálculos solo se rehacen si los datos base cambian.
    *   Utiliza una librería como `recharts` para crear los gráficos.
    *   La interactividad (clic en una tarjeta para ver un gráfico detallado) se logra usando un `Dialog`.

3.  **Importación/Exportación CSV:**
    *   **Exportar:** Convierte el array de datos (ej. `products`) a una cadena de texto en formato CSV. Luego, crea un `Blob`, genera una URL para él (`URL.createObjectURL`) y simula un clic en un enlace de descarga.
    *   **Importar:** Usa un `<input type="file">` (puede estar oculto y activarse con un botón). En el `onChange`, utiliza `FileReader` para leer el contenido del archivo. Parsea el texto del CSV, convierte cada línea en un objeto y usa `writeBatch` de Firestore para una carga masiva y eficiente.

---

### Sección 8: Toques Finales y Despliegue

1.  **Gestión de Calidad:**
    *   Revisa el código en busca de duplicación y refactoriza creando componentes reutilizables (como los formularios).
    *   Asegúrate de que la experiencia de usuario sea consistente en todas las páginas.
    *   Verifica que la lógica de roles se aplique correctamente en todas las acciones sensibles.

2.  **Despliegue:**
    *   El proyecto ya está configurado para Firebase Hosting. Consulta el archivo `DEPLOY.md` para seguir las instrucciones detalladas sobre cómo instalar la Firebase CLI, autenticarte y desplegar tu aplicación con un solo comando.

¡Felicidades! Siguiendo estos pasos, habrás construido una aplicación web robusta, escalable y profesional desde cero.
