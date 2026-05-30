# Prompt Etapa 5C — Preparación de código para deploy

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapas 5A y 5B completadas. El código está listo funcionalmente.
Esta etapa prepara el código para que funcione en producción
sin cambiar ninguna funcionalidad.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- Todos los comentarios en español
- Comentarios estratégicos en cada archivo nuevo o modificado
- No modificar lógica de negocio ni llamadas a la API
- No romper el entorno de desarrollo local (Docker sigue funcionando igual)
```

---

## Contexto del problema que resuelve esta etapa

En desarrollo local las URLs están hardcodeadas:
- Los componentes Vue llaman a `http://localhost:4000`
- Los archivos Astro llaman a `http://backend:4000` (nombre del servicio Docker)

En producción esas URLs no existen. Necesitamos que el código
lea la URL del backend desde una variable de entorno, no desde
el código fuente. Así el mismo código funciona en local Y en producción
solo cambiando las variables.

```
Local:        VITE_API_URL=http://localhost:4000
Producción:   VITE_API_URL=https://tu-backend.railway.app
```

---

## Parte A — Variables de entorno en el panel-admin

### A1 — Crear `panel-admin/.env`

```env
# Variables de entorno para desarrollo local
# Copiar este archivo como .env.production con los valores reales antes de deployar
VITE_API_URL=http://localhost:4000
```

### A2 — Crear `panel-admin/.env.example`

```env
# Variables de entorno requeridas
# En desarrollo: copiar como .env con los valores de localhost
# En producción: configurar en el dashboard de Vercel
VITE_API_URL=URL_del_backend_en_Railway
```

### A3 — Agregar al `.gitignore` del panel-admin

Verificar que el `.gitignore` del panel-admin incluye:
```
.env
.env.production
```
El `.env.example` sí debe subirse al repo.

### A4 — Crear `panel-admin/src/ArchivosJS/utils/api.js`

```js
// utils/api.js
// Centraliza la URL base del backend para todo el panel admin.
// En lugar de escribir http://localhost:4000 en cada archivo de api/,
// se importa esta constante. Así al cambiar el backend en producción
// solo hay que cambiar la variable de entorno VITE_API_URL — nada más.
//
// Vite expone las variables que empiezan con VITE_ al código del cliente
// via import.meta.env. Variables sin ese prefijo son solo del servidor de build.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
```

### A5 — Actualizar todos los archivos de `panel-admin/src/ArchivosJS/api/`

En cada archivo de la carpeta `api/` reemplazar la URL hardcodeada por la variable.

**Patrón de cambio en cada archivo:**

Antes:
```js
const res = await fetch('http://localhost:4000/auth/login', { ... })
```

Después:
```js
import { API_URL } from '../utils/api.js'
// ...
const res = await fetch(`${API_URL}/auth/login`, { ... })
```

Archivos a actualizar:
- `api/auth.js`
- `api/servicios.js`
- `api/disponibilidad.js`
- `api/turnos.js`
- `api/perfil.js`
- `api/metricas.js`
- `api/diasBloqueados.js`
- `api/onboarding.js`

> Verificar que cada archivo importa `API_URL` desde `'../utils/api.js'`
> y no desde una ruta diferente según su ubicación.

---

## Parte B — Variables de entorno en el sitio-publico

### B1 — Crear `sitio-publico/.env`

```env
# URL del backend para desarrollo local
# En Astro las variables de entorno del servidor NO necesitan prefijo especial
# Las variables PUBLIC_ son accesibles desde el cliente (componentes Vue)
PUBLIC_API_URL=http://localhost:4000
API_URL=http://backend:4000
```

> Dos variables distintas porque:
> - `API_URL` → la usa Astro en el servidor (fetch dentro de `---`) → apunta a `backend:4000` (Docker)
> - `PUBLIC_API_URL` → la usan los componentes Vue en el navegador → apunta a `localhost:4000`
> En producción ambas apuntan al mismo backend en Railway pero con la URL real.

### B2 — Crear `sitio-publico/.env.example`

```env
# Variables requeridas para el sitio público
# En desarrollo: copiar como .env con los valores de abajo
# En producción: configurar en el dashboard de Vercel

# Usada por Astro en el servidor (fetch en bloques ---)
API_URL=http://backend:4000

# Usada por componentes Vue en el navegador
PUBLIC_API_URL=http://localhost:4000
```

### B3 — Agregar al `.gitignore` del sitio-publico

```
.env
.env.production
```

### B4 — Actualizar `sitio-publico/src/pages/[slug].astro`

Reemplazar la URL hardcodeada en el fetch del bloque `---`:

Antes:
```js
const res = await fetch(`http://backend:4000/publico/${slug}`)
```

Después:
```js
const API_URL = import.meta.env.API_URL || 'http://backend:4000'
const res = await fetch(`${API_URL}/publico/${slug}`)
```

### B5 — Actualizar `sitio-publico/src/pages/buscar.astro`

Mismo cambio que en `[slug].astro`:
```js
const API_URL = import.meta.env.API_URL || 'http://backend:4000'
const res = await fetch(`${API_URL}/busqueda?q=${encodeURIComponent(query)}`)
```

### B6 — Actualizar `sitio-publico/src/vue-components/BuscadorProfesional.vue`

Reemplazar la URL hardcodeada en el fetch del componente Vue:

Antes:
```js
const res = await fetch(`http://localhost:4000/busqueda?q=${termino}`)
```

Después:
```js
// En Astro, las variables PUBLIC_ son accesibles desde componentes Vue
// via import.meta.env (Vite las expone automáticamente)
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000'
// ...
const res = await fetch(`${API_URL}/busqueda?q=${termino}`)
```

### B7 — Actualizar `sitio-publico/src/vue-components/FormReserva.vue`

Mismo patrón que BuscadorProfesional.vue — reemplazar todas las
ocurrencias de `http://localhost:4000` por `${API_URL}` usando
`import.meta.env.PUBLIC_API_URL`.

### B8 — Actualizar `sitio-publico/src/pages/[slug].astro`

La URL de la foto también necesita actualizarse:

Antes:
```astro
src={`http://localhost:4000${profesional.foto_url}`}
```

Después:
```astro
src={`${import.meta.env.PUBLIC_API_URL || 'http://localhost:4000'}${profesional.foto_url}`}
```

---

## Parte C — CORS en el backend para producción

### C1 — Actualizar configuración CORS en `backend/index.js`

Actualmente el CORS solo permite `localhost:5173` y `localhost:4321`.
En producción necesita también aceptar los dominios de Vercel.

Agregar al `.env` del backend:
```env
# URLs de los frontends (para CORS)
# En desarrollo: localhost
# En producción: URLs de Vercel
FRONTEND_URL=http://localhost:5173
SITIO_URL=http://localhost:4321
```

Agregar al `.env.example` del backend los mismos campos sin valores sensibles.

Actualizar la configuración de CORS en `backend/index.js`:

```js
// Configuración de CORS actualizada
// Lee los orígenes permitidos desde variables de entorno
// para funcionar tanto en desarrollo (localhost) como en producción (Vercel)
const corsOptions = {
  origin: function(origin, callback) {
    // Lista de orígenes permitidos desde el .env
    const permitidos = [
      process.env.FRONTEND_URL,
      process.env.SITIO_URL,
      // Fallbacks para desarrollo local
      'http://localhost:5173',
      'http://localhost:4321'
    ].filter(Boolean) // eliminar valores undefined

    // Permitir requests sin origin (Postman, curl, server-to-server)
    if (!origin || permitidos.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`))
    }
  },
  credentials: true
}

app.use(cors(corsOptions))
```

---

## Parte D — Configuración de Vercel

### D1 — Crear `sitio-publico/vercel.json`

```json
{
  "framework": "astro",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

> Astro en Vercel generalmente se detecta automáticamente,
> pero este archivo evita ambigüedades.

### D2 — Crear `panel-admin/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

> La regla de `rewrites` es crítica para Vue Router en Vercel.
> Sin ella, al entrar directamente a `/login` o `/perfil`
> Vercel devuelve 404 porque no encuentra esos archivos físicos.
> Con la regla: todas las rutas sirven `index.html` y Vue Router
> maneja la navegación del lado del cliente.

### D3 — Crear `deploy/instrucciones-railway.md`

```markdown
# Instrucciones de deploy — Railway (backend + MySQL)

## Pasos

1. Crear cuenta en https://railway.app
2. Nuevo proyecto → "Deploy from GitHub repo"
3. Seleccionar el repositorio SistemaDeTurnosOnline
4. Configurar el directorio raíz: `backend`
5. Railway detecta Node.js automáticamente

## Agregar MySQL
1. En el proyecto → "Add Plugin" → MySQL
2. Railway crea la base de datos y genera las variables de conexión
3. Copiar los valores: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

## Variables de entorno en Railway
Ir a Variables y agregar:
- PORT=4000
- DB_HOST=[valor de MYSQL_HOST generado por Railway]
- DB_USER=[valor de MYSQL_USER]
- DB_PASSWORD=[valor de MYSQL_PASSWORD]
- DB_NAME=[valor de MYSQL_DATABASE]
- JWT_SECRET=[clave aleatoria larga y segura]
- EMAIL_HOST=smtp.gmail.com
- EMAIL_PORT=587
- EMAIL_USER=[tu cuenta Gmail]
- EMAIL_PASS=[contraseña de aplicación Gmail]
- FRONTEND_URL=[URL de Vercel del panel-admin — se obtiene después de deployar]
- SITIO_URL=[URL de Vercel del sitio-publico — ídem]

## Aplicar el schema de la base de datos
Una vez que MySQL esté corriendo en Railway:
1. Ir a la pestaña "Data" del plugin MySQL
2. Ejecutar el contenido de database/schema.sql

## URL final del backend
Railway asigna una URL del tipo:
https://sistemadeturnosonline-production.up.railway.app
Guardar esta URL — se usa en las variables de entorno de Vercel.
```

### D4 — Crear `deploy/instrucciones-vercel.md`

```markdown
# Instrucciones de deploy — Vercel (frontends)

## Sitio público (Astro)

1. Ir a https://vercel.com → New Project
2. Importar el repositorio SistemaDeTurnosOnline
3. Configurar:
   - Framework: Astro (detectado automáticamente)
   - Root directory: sitio-publico
   - Build command: npm run build
   - Output directory: dist
4. Variables de entorno:
   - API_URL = https://tu-backend.railway.app
   - PUBLIC_API_URL = https://tu-backend.railway.app
5. Deploy

## Panel admin (Vue SPA)

1. En Vercel → Add New Project (mismo repo, distinto proyecto)
2. Configurar:
   - Framework: Vite
   - Root directory: panel-admin
   - Build command: npm run build
   - Output directory: dist
3. Variables de entorno:
   - VITE_API_URL = https://tu-backend.railway.app
4. Deploy

## Después del deploy
1. Copiar las URLs de Vercel
2. Volver a Railway → Variables de entorno
3. Actualizar FRONTEND_URL y SITIO_URL con las URLs reales de Vercel
4. Railway hace redeploy automático con las nuevas variables
5. Verificar el flujo completo desde las URLs de producción
```

---

## Parte E — Actualizar README

### E1 — Agregar sección de deploy en el `README.md`

Agregar después de la sección "Levantar el proyecto", sin eliminar nada:

```markdown
## Deploy en producción

El proyecto está preparado para deployarse con:
- **Railway** — backend Node.js + MySQL
- **Vercel** — sitio público (Astro) + panel admin (Vue)

Ver instrucciones detalladas en:
- `deploy/instrucciones-railway.md`
- `deploy/instrucciones-vercel.md`

### URLs de producción
Una vez deployado, actualizar estos valores:

| Servicio | URL |
|---|---|
| Sitio público | https://[tu-proyecto].vercel.app |
| Panel admin | https://[tu-panel].vercel.app |
| API backend | https://[tu-backend].railway.app |
```

---

## Qué NO hacer en esta etapa

- No cambiar ninguna lógica de negocio
- No modificar el backend salvo la configuración de CORS y el `.env`
- No eliminar los fallbacks `|| 'http://localhost:4000'` — son el seguro
  para que el entorno local siga funcionando si no hay `.env`
- No subir `.env` al repositorio — solo `.env.example`
- No hacer el deploy todavía — eso es la guía 5D

---

## Cómo validar que esta etapa está completa

**Verificar que el entorno local sigue funcionando igual:**

1. `docker compose up -d` → 4 servicios OK
2. `http://localhost:4321` → sitio público funciona
3. `http://localhost:5173` → panel admin funciona
4. Hacer una reserva desde el sitio público → funciona
5. Ver el turno en el panel admin → funciona

**Verificar que las variables de entorno están bien:**

```powershell
# En panel-admin — verificar que el .env existe y tiene el valor correcto
cat panel-admin/.env
# → VITE_API_URL=http://localhost:4000

# En sitio-publico
cat sitio-publico/.env
# → PUBLIC_API_URL=http://localhost:4000
# → API_URL=http://backend:4000
```

**Verificar los builds:**

```powershell
# panel-admin
cd panel-admin
npm run build
# → sin errores, carpeta dist/ generada

# sitio-publico
cd ../sitio-publico
npm run build
# → sin errores, carpeta dist/ generada
```

**Verificar que .env no está en el repo:**

```powershell
cd ..
git status
# → NO debe aparecer ningún .env (solo .env.example)
```

### Reporte de validación esperado

```
✅ Etapa 5C — Preparación para deploy completada

Validaciones:
✔ Entorno local — funciona igual que antes
✔ Variables de entorno — .env en panel-admin y sitio-publico
✔ API_URL centralizada en panel-admin/utils/api.js
✔ Todos los archivos api/ usan API_URL importada
✔ Astro usa import.meta.env.API_URL en fetches del servidor
✔ Vue usa import.meta.env.PUBLIC_API_URL en fetches del cliente
✔ CORS actualizado para leer orígenes desde .env
✔ vercel.json creado en panel-admin y sitio-publico
✔ Instrucciones de deploy en deploy/
✔ README actualizado con sección de deploy
✔ .env NO aparece en git status
✔ build panel-admin — OK
✔ build sitio-publico — OK

Archivos creados en esta etapa:
- panel-admin/.env
- panel-admin/.env.example
- panel-admin/src/ArchivosJS/utils/api.js
- panel-admin/src/ArchivosJS/api/*.js (todos actualizados con API_URL)
- panel-admin/vercel.json
- sitio-publico/.env
- sitio-publico/.env.example
- sitio-publico/vercel.json
- sitio-publico/src/pages/[slug].astro (variable de entorno)
- sitio-publico/src/pages/buscar.astro (variable de entorno)
- sitio-publico/src/vue-components/BuscadorProfesional.vue (variable)
- sitio-publico/src/vue-components/FormReserva.vue (variable)
- backend/.env (FRONTEND_URL y SITIO_URL agregados)
- backend/.env.example (ídem)
- backend/index.js (CORS actualizado)
- deploy/instrucciones-railway.md
- deploy/instrucciones-vercel.md
- README.md (sección deploy agregada)

Próximo paso: Guía 5D — Deploy real en Railway y Vercel
(cuando tengas acceso a las plataformas)
```

---

## Notas para el orden de implementación

1. **Primero las variables de entorno** (A1, B1) — sin ellas nada más funciona
2. **Luego `utils/api.js`** (A4) — centralizar antes de actualizar los archivos
3. **Luego actualizar todos los `api/*.js`** (A5) — uno por uno, verificar imports
4. **Luego los archivos de Astro** (B4, B5) — cambios simples de una línea
5. **Luego los componentes Vue del sitio** (B6, B7, B8) — mismo patrón
6. **Luego el CORS del backend** (C1) — requiere rebuild del contenedor
7. **Luego los archivos de configuración** (D1, D2, D3, D4) — no afectan el código
8. **Por último el README** (E1) — documentación, siempre al final

> Después de cada cambio en archivos Vue o Astro, verificar en el navegador
> que el comportamiento no cambió. El riesgo principal es importar API_URL
> desde una ruta incorrecta — si algo deja de funcionar, revisar los imports primero.

> Si el CORS falla después del cambio, hacer:
> `docker compose build backend && docker compose up -d backend`
> y verificar con `docker compose logs backend`
