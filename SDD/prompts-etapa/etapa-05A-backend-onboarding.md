# Prompt Etapa 5A — Backend Fase 3 + Onboarding Vue

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Fases 1 y 2 completas y en GitHub. Todos los endpoints funcionando.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- async/await en lugar de .then()
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Errores del backend: { error: 'mensaje descriptivo en español' }
- Comentarios estratégicos en cada archivo nuevo
- profesional_id siempre desde req.profesional.id (JWT), nunca desde el body
- En backend/index.js solo agregar imports y app.use() al final — no reemplazar
- No modificar archivos de Fases 1 y 2 salvo donde se indique explícitamente
- Diseño funcional simple — variables CSS del sistema de diseño, sin hardcodear colores
```

---

## Contexto de lo que ya existe

Del backend, funcionando y sin tocar salvo donde se indique:
- `routes/auth.js` — register, login, me
- `routes/perfil.js` — PUT /perfil y PUT /perfil/password
- `routes/servicios.js`, `routes/disponibilidad.js`, `routes/turnos.js`
- `routes/publico.js` — endpoints sin auth para el sitio Astro
- `routes/metricas.js`, `routes/diasBloqueados.js`
- `middleware/authMiddleware.js`
- `utils/email.js` — Nodemailer

Del panel-admin, funcionando y sin tocar salvo donde se indique:
- `ArchivosVue/stores/authStore.js`
- `ArchivosVue/router/index.js` — rutas con guardia de auth
- `ArchivosVue/pages/RegisterPage.vue` — solo se modifica la redirección final
- `ArchivosVue/pages/PerfilPage.vue` — solo se agrega sección de foto
- `ArchivosJS/api/` — todas las funciones API existentes

---

## Parte A — Base de datos: campos nuevos

### A1 — Agregar campos al final de `database/schema.sql`

```sql
-- Campos nuevos en profesionales (Fase 3)
-- foto_url: ruta relativa a la imagen subida. Null si el profesional no subió foto.
-- onboarding_completado: controla si el profesional completó el wizard inicial.
--   0 = recién registrado, debe completar el onboarding antes de usar el panel.
--   1 = onboarding completo, acceso libre al panel.
--   Se guarda en DB (no localStorage) para que persista entre dispositivos.
ALTER TABLE profesionales
  ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completado TINYINT(1) NOT NULL DEFAULT 0;
```

### A2 — Aplicar al contenedor MySQL

```bash
docker compose exec db mysql -u turnos_user -pturnos_password turnos_db < database/schema.sql
```

Verificar:
```bash
docker compose exec db mysql -u turnos_user -pturnos_password -e "DESCRIBE profesionales;" turnos_db
```
→ Deben aparecer `foto_url` y `onboarding_completado` al final.

---

## Parte B — Ruta de onboarding

### B1 — Crear `backend/routes/onboarding.js`

```js
// routes/onboarding.js
// Controla el estado del wizard de configuración inicial del profesional.
// El onboarding guía al profesional recién registrado para que configure
// perfil, servicios y horarios antes de recibir su primer turno.
// Una vez completado (onboarding_completado = 1) no puede volver a este flujo.
```

**GET `/onboarding/estado`** — protegido
- Devuelve el estado del onboarding del profesional logueado
- Responde: `{ completado: true|false }`
- Consulta `onboarding_completado` desde la tabla `profesionales`

**POST `/onboarding/completar`** — protegido
- Marca el onboarding como completado
- Actualiza `onboarding_completado = 1` donde `id = req.profesional.id`
- Responde: `{ mensaje: 'Onboarding completado correctamente' }`

---

## Parte C — Ruta de búsqueda pública

### C1 — Crear `backend/routes/busqueda.js`

```js
// routes/busqueda.js
// Permite buscar profesionales por nombre o especialidad desde el sitio público.
// Solo devuelve profesionales con onboarding_completado = 1, lo que garantiza
// que tienen al menos un servicio y un horario configurados.
// Sin auth — es un endpoint público consumido por el sitio Astro.
```

**GET `/busqueda?q=termino`** — sin auth
- Query param `q` requerido — si no viene, responder `400`
- Buscar en `nombre` y `especialidad` con `LIKE %termino%`
- Solo profesionales con `onboarding_completado = 1`
- Máximo 20 resultados ordenados por nombre ASC
- Devolver solo campos públicos: `{ id, nombre, especialidad, slug, foto_url }`
- Si `q` tiene menos de 2 caracteres: responder `400` con error descriptivo

---

## Parte D — Foto de perfil con Multer

### D1 — Instalar Multer

```bash
npm install multer
```

### D2 — Crear `backend/uploads/.gitkeep`

Crear la carpeta `backend/uploads/` con un archivo `.gitkeep` para que Git
la rastree pero no suba las imágenes (agregar `backend/uploads/*.jpg`,
`backend/uploads/*.png`, `backend/uploads/*.webp` al `.gitignore` del backend).

### D3 — Crear `backend/utils/multerConfig.js`

```js
// utils/multerConfig.js
// Configuración de Multer para la subida de fotos de perfil.
// Multer es un middleware de Node.js para manejar multipart/form-data.
// Restringe el tipo de archivo a imágenes y el tamaño a 2MB
// para evitar subidas abusivas al servidor.
```

Configuración:
- Destino: `backend/uploads/`
- Nombre del archivo: `profesional-${id}-${Date.now()}${extension}`
  (el `id` viene de `req.profesional.id` — requiere que el middleware de auth
  corra antes que Multer)
- Tipos aceptados: `image/jpeg`, `image/png`, `image/webp`
- Si el tipo no es válido: lanzar error `'Solo se permiten imágenes JPG, PNG o WebP'`
- Tamaño máximo: 2MB (2 * 1024 * 1024 bytes)

### D4 — Agregar endpoints de foto en `backend/routes/perfil.js`

Agregar al final del archivo existente, sin modificar lo que ya está:

```js
// utils/multerConfig.js se importa al inicio del archivo
const upload = require('../utils/multerConfig')

// POST /perfil/foto — protegido
// Recibe la imagen como multipart/form-data con campo "foto"
// Multer guarda el archivo en uploads/ y adjunta req.file con los datos
// Actualiza foto_url en la base de datos con la ruta relativa
// Si el profesional ya tenía foto: eliminar el archivo anterior del disco
// Responde 200 con { foto_url: '/uploads/nombre-del-archivo.jpg' }

// DELETE /perfil/foto — protegido
// Elimina la foto actual del disco y pone foto_url = NULL en la base de datos
// Si no tenía foto: responder 404 con error descriptivo
```

### D5 — Servir los archivos estáticos en `backend/index.js`

Agregar junto a los otros middlewares (no al final de las rutas):
```js
// Sirve las fotos de perfil subidas como archivos estáticos
// La URL pública queda: http://localhost:4000/uploads/nombre-archivo.jpg
app.use('/uploads', express.static('uploads'))
```

---

## Parte E — Registrar rutas nuevas en `backend/index.js`

Agregar al final de la lista de rutas existente:

```js
// Rutas de Fase 3
const onboardingRoutes = require('./routes/onboarding')
const busquedaRoutes = require('./routes/busqueda')
app.use('/onboarding', onboardingRoutes)
app.use('/busqueda', busquedaRoutes)
```

---

## Parte F — Frontend: función API de onboarding

### F1 — Crear `panel-admin/src/ArchivosJS/api/onboarding.js`

```js
// api/onboarding.js
// Funciones para interactuar con el wizard de onboarding.
// obtenerEstado se llama al loguearse para saber si redirigir al wizard.
// completarOnboarding se llama al finalizar el último paso del wizard.
```

Funciones:
- `obtenerEstado(token)` → GET `/onboarding/estado` → devuelve `{ completado }`
- `completarOnboarding(token)` → POST `/onboarding/completar`

---

## Parte G — Guardia de onboarding en el router

### G1 — Actualizar `panel-admin/src/ArchivosVue/router/index.js`

Agregar la ruta del onboarding y actualizar la guardia global.
No modificar las rutas existentes.

**Ruta nueva:**
```js
{
  path: '/onboarding',
  component: () => import('../pages/OnboardingPage.vue'),
  meta: { requiereAuth: true, esOnboarding: true }
}
```

**Actualizar `router.beforeEach`:**
```js
// Guardia actualizada — lógica de onboarding agregada:
// Después de verificar que el profesional está logueado,
// consultar el estado del onboarding:
// - Si onboarding_completado = false y la ruta NO es /onboarding → redirigir a /onboarding
// - Si onboarding_completado = true y la ruta ES /onboarding → redirigir a /
// El estado del onboarding se guarda en authStore para no consultar la API en cada navegación
```

Agregar en `authStore.js` (solo agregar, no modificar lo existente):
```js
// Estado nuevo en authStore
onboardingCompletado: false

// Acción nueva
async verificarOnboarding(token) {
  // Llama a obtenerEstado(token) de api/onboarding.js
  // Guarda el resultado en onboardingCompletado
}
```

---

## Parte H — Wizard de onboarding

### H1 — Crear `panel-admin/src/ArchivosVue/pages/OnboardingPage.vue`

```js
// pages/OnboardingPage.vue
// Wizard de configuración inicial para profesionales recién registrados.
// Guía al profesional en 4 pasos antes de habilitarle el acceso completo al panel.
// Una vez completado, POST /onboarding/completar marca el flag en la DB
// y el profesional nunca vuelve a ver esta pantalla.
//
// Pasos:
// 1 — Completar perfil (nombre, especialidad, descripción, dirección)
// 2 — Crear al menos 1 servicio
// 3 — Agregar al menos 1 horario de atención
// 4 — Pantalla de éxito con link a su página pública
```

**Estado reactivo:**
```js
pasoActual: 1        // 1, 2, 3 o 4
pasos: [
  { numero: 1, titulo: 'Tu perfil',    completado: false },
  { numero: 2, titulo: 'Tus servicios', completado: false },
  { numero: 3, titulo: 'Tus horarios', completado: false },
  { numero: 4, titulo: '¡Listo!',      completado: false }
]
cargando: false
error: null
```

**Paso 1 — Perfil:**
- Formulario con: nombre (requerido), especialidad, descripción, dirección, teléfono
- Precargado con los datos actuales del profesional (desde authStore)
- Botón "Continuar" → llama a `PUT /perfil` → si OK, avanza a paso 2

**Paso 2 — Servicios:**
- Muestra los servicios ya creados (si hay)
- Mini formulario inline: nombre + duración + precio + botón "Agregar"
- El botón "Continuar" solo se habilita si `servicios.length >= 1`
- Reutilizar las funciones de `api/servicios.js` ya existentes

**Paso 3 — Horarios:**
- Muestra los bloques ya creados (si hay)
- Mini formulario inline: día semana + hora inicio + hora fin + botón "Agregar"
- El botón "Continuar" solo se habilita si `bloques.length >= 1`
- Reutilizar las funciones de `api/disponibilidad.js` ya existentes

**Paso 4 — ¡Listo!:**
- Mensaje de bienvenida con el nombre del profesional
- Mostrar el link de su página pública:
  ```
  Tu página pública está lista:
  [link clickeable al sitio público + slug]
  ```
- Botón "Ir a mi panel" → llama a `completarOnboarding(token)`
  → actualiza `onboardingCompletado = true` en el store
  → redirige a `/`

**Indicador de progreso visual:**
Barra o steps en la parte superior mostrando los 4 pasos,
con el paso actual resaltado. Puede ser tan simple como:
```
① Tu perfil  →  ② Servicios  →  ③ Horarios  →  ④ ¡Listo!
```

---

## Parte I — Actualizar RegisterPage y PerfilPage

### I1 — Modificar `panel-admin/src/ArchivosVue/pages/RegisterPage.vue`

Solo cambiar la redirección al finalizar el registro exitosamente.
Actualmente redirige a `/login`. Cambiar a:
```js
// Después del registro exitoso, hacer login automático y redirigir al onboarding
// 1. Llamar a loginProfesional(email, password) con los datos del formulario
// 2. Si login OK: guardar token en authStore, setear onboardingCompletado = false
// 3. Redirigir a /onboarding
```

> Esto mejora la UX: el profesional no tiene que loguearse manualmente
> después de registrarse — queda logueado y va directo al wizard.

### I2 — Agregar sección de foto en `panel-admin/src/ArchivosVue/pages/PerfilPage.vue`

Agregar una tercera sección debajo de las dos existentes (datos y contraseña).
No modificar nada de lo que ya funciona.

```js
// Sección nueva: Foto de perfil
// Muestra la foto actual si existe, o un placeholder si no hay.
// Permite subir una nueva foto o eliminar la actual.
```

Estado reactivo adicional:
```js
fotoUrl: null        // URL de la foto actual (desde authStore o null)
subiendoFoto: false
errorFoto: null
```

Interfaz:
- Si hay foto: mostrarla en un círculo (como avatar)
- Si no hay foto: mostrar un ícono placeholder (puede ser texto "Sin foto")
- Input `type="file"` que acepta solo imágenes
- Botón "Subir foto" → hace POST a `/perfil/foto` con `FormData`
- Botón "Eliminar foto" (solo si hay foto) → DELETE `/perfil/foto`
- Al subir exitosamente: actualizar `fotoUrl` con la nueva URL

---

## Qué NO hacer en esta etapa

- No modificar el sitio-publico — el buscador y la foto en la página pública van en 5B
- No modificar rutas existentes del backend salvo `perfil.js` (solo agregar)
- No modificar `authStore.js` más allá de agregar `onboardingCompletado` y `verificarOnboarding`
- No instalar librerías de UI externas
- No implementar el deploy todavía — eso es el Prompt 5C

---

## Cómo validar que esta etapa está completa

**Base de datos:**
```powershell
docker compose exec db mysql -u turnos_user -pturnos_password -e "DESCRIBE profesionales;" turnos_db
```
→ `foto_url` y `onboarding_completado` presentes

**Onboarding backend:**
```powershell
$body = '{"email":"maria@test.com","password":"123456"}'
curl.exe -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d $body
# Copiar token

curl.exe http://localhost:4000/onboarding/estado -H "Authorization: Bearer $token"
# → { completado: false } (maria fue registrada antes del onboarding)

curl.exe -X POST http://localhost:4000/onboarding/completar -H "Authorization: Bearer $token"
# → { mensaje: 'Onboarding completado correctamente' }

curl.exe http://localhost:4000/onboarding/estado -H "Authorization: Bearer $token"
# → { completado: true }
```

**Búsqueda:**
```powershell
curl.exe "http://localhost:4000/busqueda?q=pelu"
# → array con maria-garcia (solo si onboarding_completado = 1)

curl.exe "http://localhost:4000/busqueda?q=x"
# → array vacío

curl.exe "http://localhost:4000/busqueda"
# → 400 con error descriptivo
```

**Foto de perfil:**
```powershell
# Subir una imagen de prueba (debe existir el archivo test.jpg en el directorio)
curl.exe -X POST http://localhost:4000/perfil/foto -H "Authorization: Bearer $token" -F "foto=@test.jpg"
# → 200 con { foto_url: '/uploads/profesional-1-...' }

# Verificar que la imagen es accesible
curl.exe http://localhost:4000/uploads/profesional-1-[timestamp].jpg
# → debe devolver la imagen (HTTP 200)

# Eliminar foto
curl.exe -X DELETE http://localhost:4000/perfil/foto -H "Authorization: Bearer $token"
# → 200 con mensaje
```

**Onboarding frontend:**
1. Registrar un profesional nuevo desde `http://localhost:5173/register`
2. → debe redirigir automáticamente a `/onboarding` (logueado)
3. Completar paso 1 (perfil) → avanza a paso 2
4. Agregar un servicio en paso 2 → botón "Continuar" se habilita → avanza a paso 3
5. Agregar un horario en paso 3 → avanza a paso 4
6. Click en "Ir a mi panel" → redirige al Dashboard
7. Intentar volver a `http://localhost:5173/onboarding` → redirige al Dashboard
8. Verificar que el login de un profesional ya existente (maria@test.com)
   con `onboarding_completado = 1` va directo al Dashboard sin pasar por el wizard
9. `npm run build` en `panel-admin/` → sin errores

### Reporte de validación esperado

```
✅ Etapa 5A — Backend Fase 3 + Onboarding completado

Validaciones:
✔ DB — foto_url y onboarding_completado presentes
✔ GET /onboarding/estado — devuelve completado correcto
✔ POST /onboarding/completar — actualiza en DB
✔ GET /busqueda?q= — resultados correctos
✔ GET /busqueda (sin q) — 400
✔ POST /perfil/foto — imagen subida y accesible
✔ DELETE /perfil/foto — eliminada correctamente
✔ Registro → login automático → /onboarding
✔ Wizard paso 1 → 2 → 3 → 4 → Dashboard
✔ Profesional con onboarding completo → Dashboard directo
✔ /onboarding inaccesible si ya completado
✔ build panel-admin — OK

Archivos creados en esta etapa:
- database/schema.sql (2 campos agregados al final)
- backend/routes/onboarding.js
- backend/routes/busqueda.js
- backend/utils/multerConfig.js
- backend/uploads/.gitkeep
- backend/routes/perfil.js (2 endpoints agregados al final)
- backend/index.js (2 rutas + static de uploads)
- panel-admin/src/ArchivosJS/api/onboarding.js
- panel-admin/src/ArchivosVue/pages/OnboardingPage.vue
- panel-admin/src/ArchivosVue/pages/RegisterPage.vue (redirección modificada)
- panel-admin/src/ArchivosVue/pages/PerfilPage.vue (sección foto agregada)
- panel-admin/src/ArchivosVue/router/index.js (ruta + guardia actualizadas)
- panel-admin/src/ArchivosVue/stores/authStore.js (2 adiciones)

Próximo paso: Etapa 5B — Sitio público Fase 3
```

---

## Notas para el orden de implementación

1. **Primero la DB** (Parte A) — aplicar antes de arrancar con el backend
2. **Backend nuevo** (B, C, D, E) — probar con curl antes del frontend
3. **API de onboarding** (F) — función JS que el router necesita
4. **Guardia del router** (G) — antes de crear la página, para que la redirección funcione
5. **Wizard OnboardingPage** (H) — lo más complejo, dejarlo para cuando el backend esté sólido
6. **RegisterPage y PerfilPage** (I) — últimas modificaciones, bajo riesgo

> Después de agregar Multer hacer siempre:
> `docker compose build backend && docker compose up -d backend`
> y verificar logs antes de probar la subida de imágenes.
