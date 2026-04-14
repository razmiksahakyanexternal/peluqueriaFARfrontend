# Guía de Configuración: Google Sign-In

## Implementación realizada

Se ha implementado la autenticación con Google Sign-In en el frontend (Angular) que se conecta con tu backend de Spring Boot.

### Cambios realizados:

1. **Servicio de Autenticación** (`src/app/services/auth.service.ts`)
   - Servicio para manejar login con email/contraseña
   - Servicio para manejar login con Google
   - Almacenamiento de JWT en localStorage

2. **Componente de Inicio de Sesión** (`src/app/inicio-sesion/`)
   - Integrado Google Sign-In SDK
   - Manejo de login con email y contraseña
   - Manejo de respuesta de Google
   - Validación de errores

3. **Configuración** (`src/environments/environment.ts`)
   - Variables de entorno para Client ID y URL de API

4. **Módulo de Aplicación**
   - Agregado HttpClientModule para llamadas HTTP
   - Agregado ReactiveFormsModule

## Pasos a seguir para que funcione:

### 1. Obtener Google Client ID

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs y servicios" > "Credenciales"
4. Haz clic en "Crear credenciales" > "ID de cliente"
5. Selecciona "Aplicación web"
6. Agrega `http://localhost:4200` en "Orígenes autorizados de JavaScript"
7. Agrega `http://localhost:4200/inicio-sesion` en "URI de redirección autorizados"
8. Copia tu Client ID

### 2. Configurar el Client ID en el frontend

Abre el archivo `src/environments/environment.ts` y reemplaza el valor de `googleClientId`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081',
  googleClientId: 'TU_CLIENT_ID_AQUI' // Reemplaza con tu ID
};
```

### 3. Configurar el Client ID en el backend

Abre `src/main/resources/application.properties` y agrega tu Client ID:

```properties
app.google.client-id=TU_CLIENT_ID_AQUI
```

### 4. Iniciar la aplicación

```bash
# Frontend (en la carpeta peluqueriaFARfrontend-main)
npm start

# Backend (en la carpeta peluqueriaFARbackend)
mvn spring-boot:run
```

## Flujo de autenticación:

1. Usuario hace clic en "Iniciar sesión con Google"
2. Google muestra el diálogo de login
3. Usuario se autentica con Google
4. Se obtiene un token de Google (idToken)
5. El frontend envía el token al backend en POST `/auth/google`
6. El backend verifica el token con Google
7. Si es válido, crea o actualiza el usuario en la base de datos
8. El backend devuelve un JWT
9. El frontend almacena el JWT en localStorage
10. La aplicación redirige al usuario a `/home`

## Funcionalidades implementadas:

✅ Login con Google  
✅ Login con email y contraseña  
✅ Almacenamiento de JWT  
✅ Manejo de errores  
✅ Indicadores de carga  
✅ Validación de formularios  
✅ Redirección automática al home después de login  

## Notas importantes:

- El JWT se almacena en `localStorage` con la clave `jwtToken`
- Para logout, necesitarás crear un servicio que elimine el token
- Para proteger rutas, puedes crear un AuthGuard usando el método `isAuthenticated()` del AuthService
- El backend debe estar ejecutándose en `http://localhost:8081`
- Asegúrate de tener CORS configurado correctamente en el backend

## En caso de errores:

1. Verifica que el Client ID sea correcto en ambos lados
2. Verifica que el backend esté ejecutándose en el puerto 8081
3. Verifica que CORS esté configurado en el backend para `http://localhost:4200`
4. Abre la consola del navegador (F12) para ver errores específicos
