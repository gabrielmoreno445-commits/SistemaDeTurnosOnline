# Prompt Etapa 2 — Autenticación completa

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapa 1 completada y funcionando: Docker, base de datos, backend base, setup de frontends.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- async/await en lugar de .then()
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Errores del backend: { error: 'mensaje descriptivo en español' }
- Comentarios estratégicos en cada archivo nuevo
- profesional_id siempre desde req.profesional.id (JWT), nunca desde el body
- En backend/index.js solo agregar imports y app.use() — no reemplazar el archivo
- No modificar ningún archivo de la Etapa 1 salvo backend/index.js para registrar el router
```

---

## Contexto de lo que ya existe

De la Etapa 1, funcionando y sin tocar:
- `docker-compose.yml` — 4 servicios corriendo
- `backend/index.js` — servidor Express con `/health` activo
- `backend/db/connection.js` — pool de conexiones a MySQL
- `database/schema.sql` — tabla `profesionales` creada
- `panel-admin/src/ArchivosVue/router/index.js` — Vue Router setup base
- `panel-admin/src/ArchivosVue/App.vue` — componente raíz
- `panel-admin/src/main.js` — entrada de la SPA

---

## Parte A — Backend: autenticación

### A1 — Instalar dependencias necesarias en `backend/`

```
npm install bcryptjs jsonwebtoken
```

- `bcryptjs` — para hashear y verificar contraseñas
- `jsonwebtoken` — para generar y verificar tokens JWT

### A2 — Crear `backend/middleware/authMiddleware.js`

Middleware que protege las rutas privadas. Debe:
- Leer el header `Authorization: Bearer <token>`
- Verificar el token con `jsonwebtoken` usando `JWT_SECRET` del `.env`
- Si el token es válido: adjuntar `req.profesional` con los datos del profesional y llamar a `next()`
- Si el token es inválido o falta: responder `401` con `{ error: 'Token inválido o ausente' }`

```js
// middleware/authMiddleware.js
// Protege las rutas privadas verificando el JWT en el header Authorization.
// Si el token es válido, adjunta req.profesional para que las rutas
// puedan acceder al id y datos del profesional sin consultar la base de datos.
// Uso: router.get('/ruta', authMiddleware, handler)
```

### A3 — Crear `backend/routes/auth.js`

Router Express con tres endpoints. Incluir comentario estratégico al inicio
explicando qué hace cada endpoint y cuál requiere token.

#### POST `/auth/register`
- Recibe: `{ nombre, email, password, especialidad, telefono }`
- Validar que `nombre`, `email` y `password` no estén vacíos
- Verificar que el email no esté ya registrado → si existe, `400` con error descriptivo
- Generar el `slug` automáticamente desde el nombre:
  - Convertir a minúsculas
  - Reemplazar caracteres con tilde (á→a, é→e, í→i, ó→o, ú→u, ñ→n)
  - Reemplazar espacios por guiones
  - Eliminar caracteres que no sean letras, números o guiones
  - Ejemplo: `"María García"` → `"maria-garcia"`
- Si el slug ya existe, agregar un sufijo numérico: `"maria-garcia-2"`
- Hashear el password con bcryptjs (10 rondas)
- Insertar en la tabla `profesionales`
- Responder `201` con `{ mensaje: 'Profesional registrado correctamente', slug }`

#### POST `/auth/login`
- Recibe: `{ email, password }`
- Buscar el profesional por email → si no existe, `401` con `{ error: 'Credenciales inválidas' }`
- Verificar password con `bcryptjs.compare` → si no coincide, mismo error `401`
  (mismo mensaje para no revelar si el email existe o no — buena práctica de seguridad)
- Generar JWT con payload `{ id, nombre, email, slug, especialidad }`
  y expiración de `7d`
- Responder `200` con:
```json
{
  "token": "eyJhbGci...",
  "profesional": {
    "id": 1,
    "nombre": "María García",
    "email": "maria@ejemplo.com",
    "slug": "maria-garcia",
    "especialidad": "Peluquería"
  }
}
```

#### GET `/auth/me`
- Ruta protegida: usar `authMiddleware`
- Devuelve los datos del profesional logueado desde `req.profesional`
- No consulta la base de datos — los datos vienen del token ya verificado
- Responder `200` con `{ profesional: req.profesional }`

### A4 — Registrar el router en `backend/index.js`

Agregar al final de la lista de rutas existente:
```js
// Rutas de autenticación — públicas excepto /auth/me
const authRoutes = require('./routes/auth')
app.use('/auth', authRoutes)
```

Solo agregar estas dos líneas. No modificar nada más del archivo.

---

## Parte B — Frontend: funciones API

### B1 — Crear `panel-admin/src/ArchivosJS/api/auth.js`

Módulo con las funciones que llaman al backend de autenticación.
Comentario estratégico al inicio explicando que todas las funciones
son async y lanzan el error para que el llamador decida cómo manejarlo.

```js
// api/auth.js
// Funciones de comunicación con el backend para autenticación.
// Cada función es async y lanza el error si la respuesta no es ok,
// para que el store o el componente que la llame decida cómo manejarlo.
// URL base del backend: http://localhost:4000
```

Funciones a crear:

**`registrarProfesional(datos)`**
- POST a `/auth/register`
- Envía `{ nombre, email, password, especialidad, telefono }`
- Devuelve la respuesta parseada como JSON
- Si la respuesta no es ok, lanza `new Error(data.error)`

**`loginProfesional(email, password)`**
- POST a `/auth/login`
- Devuelve `{ token, profesional }`
- Si la respuesta no es ok, lanza `new Error(data.error)`

**`obtenerProfesionalActual(token)`**
- GET a `/auth/me`
- Envía el header `Authorization: Bearer ${token}`
- Devuelve `{ profesional }`
- Si la respuesta no es ok, lanza `new Error(data.error)`

---

## Parte C — Pinia: store de autenticación

### C1 — Crear `panel-admin/src/ArchivosVue/stores/authStore.js`

Store de Pinia que centraliza todo el estado de autenticación.
Es el equivalente al `AuthContext` de React.

```js
// stores/authStore.js
// Store de Pinia que centraliza el estado de autenticación del profesional.
// Equivalente a AuthContext en React — cualquier componente que necesite
// saber si hay un profesional logueado debe consumir este store.
// Lo consumen: router/index.js (guardia), Header.vue, Dashboard.vue y cualquier
// página que requiera datos del profesional logueado.
```

Estado que debe manejar:
```js
// Estado inicial
profesional: null,   // objeto con datos del profesional o null si no está logueado
token: null,         // string JWT o null
cargando: false,     // true mientras se espera respuesta del backend
error: null          // mensaje de error o null
```

Acciones a implementar:

**`login(email, password)`**
- Setear `cargando: true` y `error: null`
- Llamar a `loginProfesional()` de `api/auth.js`
- Si es exitoso: guardar `token` y `profesional` en el estado y en `localStorage`
- Si falla: guardar el mensaje en `error`
- Siempre: setear `cargando: false` al terminar

**`logout()`**
- Limpiar `profesional`, `token` del estado
- Eliminar `token` de `localStorage`

**`restaurarSesion()`**
- Leer el `token` de `localStorage`
- Si existe: llamar a `obtenerProfesionalActual(token)` para verificar que sigue válido
- Si la verificación es exitosa: restaurar `profesional` y `token` en el estado
- Si falla (token vencido o inválido): llamar a `logout()` para limpiar todo
- Esta acción se llama una sola vez al montar `App.vue`

Getters a implementar:
```js
estaLogueado: (state) => !!state.token
```

### C2 — Registrar Pinia en `panel-admin/src/main.js`

Verificar que Pinia ya está registrado como plugin de Vue.
Si no está, agregarlo. No modificar nada más del archivo.

```js
// Solo agregar si no está:
import { createPinia } from 'pinia'
app.use(createPinia())
```

---

## Parte D — Vue Router: guardia de autenticación

### D1 — Actualizar `panel-admin/src/ArchivosVue/router/index.js`

Agregar las rutas de autenticación y la guardia de navegación global.

**Rutas a agregar:**
```js
{ path: '/login',    component: () => import('../pages/LoginPage.vue') },
{ path: '/register', component: () => import('../pages/RegisterPage.vue') },
{ path: '/',         component: () => import('../pages/DashboardPage.vue'), meta: { requiereAuth: true } }
```

**Guardia global (`router.beforeEach`):**
```js
// Guardia de navegación global.
// Antes de cada cambio de ruta verifica si el profesional está logueado.
// Si la ruta requiere auth (meta.requiereAuth) y no hay token: redirige a /login.
// Si ya está logueado e intenta ir a /login o /register: redirige al dashboard.
```

Lógica de la guardia:
- Importar `authStore` de Pinia para leer `estaLogueado`
- Si la ruta tiene `meta.requiereAuth` y `!estaLogueado` → redirigir a `/login`
- Si la ruta es `/login` o `/register` y `estaLogueado` → redirigir a `/`
- En cualquier otro caso → dejar pasar con `next()`

---

## Parte E — Páginas Vue

### E1 — Crear `panel-admin/src/ArchivosVue/pages/LoginPage.vue`

Página de login del profesional. Diseño funcional simple — sin decoración.

Debe contener:
- Título: "Iniciar sesión"
- Campo email (type="email")
- Campo password (type="password")
- Botón "Ingresar"
- Texto con link a `/register`: "¿No tenés cuenta? Registrate"
- Mostrar el `error` del store si existe (en rojo, usando variable CSS `--color-danger`)
- Mientras `cargando` es true: deshabilitar el botón y cambiar su texto a "Ingresando..."
- Al hacer submit: llamar a `authStore.login(email, password)`
- Si el login es exitoso (`estaLogueado` pasa a true): `router.push('/')`

Usar variables CSS del sistema de diseño para todos los estilos.
No hardcodear colores. Estilos mínimos funcionales — el pulido visual es Fase 3.

### E2 — Crear `panel-admin/src/ArchivosVue/pages/RegisterPage.vue`

Página de registro de nuevo profesional. Misma filosofía de diseño que Login.

Campos:
- Nombre completo (requerido)
- Email (requerido)
- Contraseña (requerido)
- Especialidad (opcional, placeholder: "Ej: Peluquería, Odontología, Psicología")
- Teléfono (opcional)
- Botón "Crear cuenta"
- Link a `/login`: "¿Ya tenés cuenta? Iniciá sesión"

Comportamiento:
- Llamar a `registrarProfesional()` de `api/auth.js` directamente
  (no pasa por el store — el registro no loguea automáticamente)
- Si el registro es exitoso: mostrar mensaje "¡Cuenta creada! Podés iniciar sesión"
  y redirigir a `/login` después de 2 segundos
- Si falla: mostrar el error recibido del backend

### E3 — Actualizar `panel-admin/src/ArchivosVue/pages/DashboardPage.vue`

Reemplazar el contenido placeholder de la Etapa 1 por:
- Llamar a `restaurarSesion()` del authStore al montar el componente (`onMounted`)
- Mostrar: "Bienvenido/a, [nombre del profesional]"
- Mostrar: especialidad del profesional
- Botón "Cerrar sesión" que llama a `authStore.logout()` y redirige a `/login`

---

## Qué NO hacer en esta etapa

- No crear rutas de gestión de turnos ni servicios (Fase 2 del proyecto)
- No crear la página pública de Astro con formulario de reserva
- No agregar campos extra a la tabla `profesionales`
- No modificar `docker-compose.yml`, `schema.sql`, ni `connection.js`
- No instalar librerías de UI externas
- No hashear el password en el frontend — solo en el backend
- No guardar el password ni el password_hash en el estado de Pinia

---

## Cómo validar que esta etapa está completa

Ejecutar en orden:

1. `docker compose up -d` → 4 servicios OK sin errores
2. `curl -X POST http://localhost:4000/auth/register -H "Content-Type: application/json" -d "{\"nombre\":\"María García\",\"email\":\"maria@test.com\",\"password\":\"123456\",\"especialidad\":\"Peluquería\"}"` → responde `201` con `{ mensaje: '...', slug: 'maria-garcia' }`
3. Intentar registrar el mismo email → responde `400` con error descriptivo
4. `curl -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"maria@test.com\",\"password\":\"123456\"}"` → responde `200` con `{ token, profesional }`
5. `curl -X POST http://localhost:4000/auth/login` con password incorrecto → responde `401` con `{ error: 'Credenciales inválidas' }`
6. `curl http://localhost:4000/auth/me -H "Authorization: Bearer <token>"` → responde `200` con datos del profesional
7. `curl http://localhost:4000/auth/me` sin token → responde `401`
8. Abrir `http://localhost:5173` → redirige automáticamente a `/login` (no hay sesión)
9. Completar el formulario de registro → cuenta creada, redirige a `/login`
10. Iniciar sesión con las credenciales → redirige al dashboard con el nombre del profesional
11. Cerrar sesión → redirige a `/login`
12. Volver a abrir `http://localhost:5173` → sigue en `/login` (sesión limpia)
13. Iniciar sesión → cerrar pestaña → volver a abrir `http://localhost:5173` → restaura la sesión y muestra el dashboard (token en localStorage)
14. `npm run build` en `panel-admin/` → sin errores

### Reporte de validación esperado al terminar

```
✅ Etapa 2 — Autenticación completa

Validaciones:
✔ docker compose up — OK
✔ POST /auth/register — 201, slug generado correctamente
✔ POST /auth/register (email duplicado) — 400, error descriptivo
✔ POST /auth/login — 200, token + profesional
✔ POST /auth/login (password incorrecto) — 401
✔ GET /auth/me (con token) — 200
✔ GET /auth/me (sin token) — 401
✔ Guardia de rutas — redirige a /login sin sesión
✔ Registro desde UI — cuenta creada, redirige a /login
✔ Login desde UI — dashboard con nombre del profesional
✔ Logout — redirige a /login, localStorage limpio
✔ Restaurar sesión — recarga y sigue logueado
✔ build panel-admin — OK

Archivos creados en esta etapa:
- backend/middleware/authMiddleware.js
- backend/routes/auth.js
- panel-admin/src/ArchivosJS/api/auth.js
- panel-admin/src/ArchivosVue/stores/authStore.js
- panel-admin/src/ArchivosVue/pages/LoginPage.vue
- panel-admin/src/ArchivosVue/pages/RegisterPage.vue
- panel-admin/src/ArchivosVue/pages/DashboardPage.vue (modificado)
- panel-admin/src/ArchivosVue/router/index.js (modificado)

Próximo paso sugerido: Etapa 3 — Página pública en Astro + formulario de reserva en Vue
```

---

## Notas para el orden de implementación

El orden en esta etapa es estricto:

1. **Primero el backend completo** (Partes A) — sin los endpoints funcionando,
   el frontend no tiene contra qué probar
2. **Luego las funciones API** (Parte B) — son el puente entre frontend y backend
3. **Luego el store de Pinia** (Parte C) — depende de las funciones API
4. **Luego el router con la guardia** (Parte D) — depende del store para leer `estaLogueado`
5. **Por último las páginas** (Parte E) — dependen del store y del router

Probar los endpoints con curl antes de arrancar con el frontend.
Si el backend no responde correctamente, no avanzar a las partes siguientes.
