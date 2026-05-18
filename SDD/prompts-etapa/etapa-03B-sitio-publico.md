# Prompt Etapa 3B — Sitio público Astro + componente Vue de reserva

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro (sitio público) + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapas 1, 2 y 3A completadas. Backend con todos los endpoints funcionando.

Reglas que siempre aplican:
- Sin TypeScript — JavaScript puro
- Archivos .astro para páginas y layouts, .vue para componentes interactivos
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Comentarios estratégicos en cada archivo nuevo
- Diseño funcional simple — el refinamiento visual es Etapa 3C (Fase 3)
- Usar las variables CSS del sistema de diseño para todos los estilos
- No hardcodear colores — siempre var(--nombre-variable)
```

---

## Contexto de lo que ya existe

De etapas anteriores, funcionando y sin tocar:
- `sitio-publico/astro.config.mjs` — integración Vue habilitada
- `sitio-publico/src/pages/index.astro` — página de bienvenida placeholder
- `backend/routes/publico.js` — todos los endpoints públicos listos:
  - GET /publico/:slug
  - GET /publico/:slug/servicios
  - GET /publico/:slug/disponibilidad
  - GET /publico/:slug/turnos-ocupados?fecha=
  - POST /publico/turnos

---

## Concepto clave — Islas de Astro (leer antes de implementar)

```
Astro genera HTML estático en el servidor.
Por defecto, los componentes Vue se renderizan como HTML sin interactividad.
Para activar la interactividad de un componente Vue dentro de Astro
se usa la directiva client:load en la etiqueta del componente:

  <FormReserva client:load slug={slug} />

Esto le dice a Astro: "este componente necesita JavaScript en el navegador".
Sin client:load → HTML estático, sin reactividad Vue.
Con client:load → el componente Vue se hidrata y funciona como SPA.

Esta es la esencia del microfrontend con Astro:
cada isla decide si necesita ser interactiva o no.
```

---

## Parte A — Sistema de diseño CSS global

### A1 — Crear `sitio-publico/src/styles/global.css`

Archivo con todas las variables CSS y estilos base.
Comentario estratégico al inicio explicando el sistema.

```css
/* styles/global.css */
/* Sistema de diseño del sitio público. */
/* Todas las variables se definen aquí — nunca hardcodear colores en componentes. */
/* El modo oscuro se activa con [data-theme="dark"] en el html (Fase 3). */

:root {
  /* Colores primarios */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-light: #EFF6FF;

  /* Acento */
  --color-accent: #10B981;
  --color-accent-hover: #059669;

  /* Estados */
  --color-danger: #EF4444;
  --color-danger-light: #FEF2F2;
  --color-warning: #F59E0B;
  --color-success: #10B981;
  --color-success-light: #ECFDF5;

  /* Superficies */
  --bg-base: #F8FAFC;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F1F5F9;
  --bg-input: #F8FAFC;

  /* Bordes */
  --border: #E2E8F0;
  --border-focus: #2563EB;

  /* Texto */
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
  --text-on-primary: #FFFFFF;

  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.10);

  /* Bordes redondeados */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* Transición global */
  --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-base);
}
```

---

## Parte B — Layout base

### B1 — Crear `sitio-publico/src/layouts/Layout.astro`

Layout base que envuelven todas las páginas. Debe:
- Importar `global.css`
- Aceptar props: `title` (string)
- Incluir la tipografía Inter desde Google Fonts en el `<head>`
- Estructura mínima: header simple con el nombre de la plataforma,
  slot para el contenido, footer simple

Comentario estratégico al inicio:
```
---
// layouts/Layout.astro
// Layout base del sitio público. Lo usan todas las páginas (.astro).
// Importa el sistema de diseño CSS y define la estructura HTML común.
// Props: title (string) — se usa en la etiqueta <title> del head.
---
```

---

## Parte C — Página de inicio

### C1 — Reemplazar `sitio-publico/src/pages/index.astro`

Landing simple de la plataforma. Diseño funcional — sin animaciones aún.

Contenido:
- Título principal: "Reservá tu turno online"
- Subtítulo: "Encontrá profesionales y agendá en segundos, sin llamadas ni mensajes"
- Un campo de texto con botón (no funcional en esta etapa, solo visual)
  placeholder: "Buscá por nombre o especialidad..."
- Sección con 3 cards simples explicando cómo funciona:
  1. "Elegí tu profesional"
  2. "Seleccioná fecha y horario"
  3. "Confirmá tu turno"
- Usar `Layout.astro` como wrapper
- Todos los estilos con variables CSS — sin valores hardcodeados

---

## Parte D — Página pública del profesional

### D1 — Crear `sitio-publico/src/pages/[slug].astro`

Esta es la página central del sitio. Carga los datos del profesional
y renderiza el componente Vue de reserva como isla interactiva.

Comentario estratégico al inicio:
```
---
// pages/[slug].astro
// Página pública de cada profesional. La ruta dinámica [slug] permite
// que cada profesional tenga su propia URL: tudominio.com/maria-garcia
//
// Flujo:
// 1. Astro obtiene el slug de la URL (Astro.params.slug)
// 2. Consulta el backend para obtener los datos del profesional
// 3. Si no existe el slug: redirige a 404
// 4. Renderiza los datos estáticos del profesional en HTML
// 5. Incrusta FormReserva.vue como isla interactiva (client:load)
//    La isla recibe el slug como prop y desde ahí maneja todo el flujo de reserva
---
```

Lógica de Astro (en el bloque `---`):
```js
const { slug } = Astro.params

// Obtener datos del profesional desde el backend
// En Astro, este fetch ocurre en el SERVIDOR al momento de renderizar
let profesional = null
try {
  const res = await fetch(`http://backend:4000/publico/${slug}`)
  if (!res.ok) return Astro.redirect('/404')
  const data = await res.json()
  profesional = data
} catch (e) {
  return Astro.redirect('/404')
}
```

> IMPORTANTE: la URL del fetch usa `http://backend:4000` (nombre del servicio Docker),
> NO `http://localhost:4000`. Dentro de Docker los servicios se comunican por nombre.

Contenido HTML de la página:
- Nombre del profesional (grande, como título)
- Especialidad del profesional
- Línea separadora
- El componente Vue: `<FormReserva client:load slug={slug} />`
- Importar FormReserva al inicio del bloque `---`

---

## Parte E — Componente Vue: formulario de reserva

### E1 — Crear `sitio-publico/src/vue-components/FormReserva.vue`

Este es el componente central del microfrontend. Es Vue puro corriendo
como isla interactiva dentro de Astro. Maneja todo el flujo de reserva.

Comentario estratégico al inicio:
```js
// vue-components/FormReserva.vue
// Componente Vue que maneja el flujo completo de reserva de turno.
// Vive dentro de la página Astro [slug].astro como isla interactiva (client:load).
// Al ser una isla, tiene su propio estado reactivo Vue independiente del resto de la página.
//
// Flujo del componente:
// 1. Al montar: carga servicios y disponibilidad del profesional (via API)
// 2. El cliente elige un servicio
// 3. El cliente elige una fecha
// 4. El componente calcula los horarios disponibles (disponibilidad - turnos ocupados)
// 5. El cliente elige un horario
// 6. El cliente completa nombre, email y teléfono
// 7. Se envía la reserva al backend
// 8. Se muestra confirmación o error
```

**Props que recibe:**
```js
props: {
  slug: { type: String, required: true }
}
```

**Estado reactivo (ref/reactive):**
```js
// Datos del profesional
servicios        // array — lista de servicios disponibles
disponibilidad   // array — bloques horarios del profesional

// Selección del usuario
servicioSeleccionado   // objeto servicio o null
fechaSeleccionada      // string YYYY-MM-DD o ''
horariosDisponibles    // array de strings HH:MM calculados
horarioSeleccionado    // string HH:MM o ''

// Datos del cliente
clienteNombre    // string
clienteEmail     // string
clienteTelefono  // string

// Estado UI
cargando         // boolean
error            // string o null
exito            // boolean — true cuando la reserva se completó
```

**Al montar el componente (`onMounted`):**
- Llamar al backend para obtener servicios: `GET /publico/:slug/servicios`
- Llamar al backend para obtener disponibilidad: `GET /publico/:slug/disponibilidad`
- Si alguna llamada falla: mostrar error descriptivo

**Cuando cambia `fechaSeleccionada` (`watch`):**
- Si hay fecha y servicio seleccionado: recalcular horarios disponibles
- Llamar a `GET /publico/:slug/turnos-ocupados?fecha=YYYY-MM-DD`
- Calcular horarios disponibles con esta lógica:

```js
// Lógica para calcular horarios disponibles
// 1. Obtener el día de la semana de la fecha seleccionada (0=Dom, 1=Lun...)
// 2. Filtrar los bloques de disponibilidad que correspondan a ese día
// 3. Para cada bloque, generar slots de tiempo según la duración del servicio:
//    - Si el bloque es 09:00-18:00 y el servicio dura 30 min:
//      generar: 09:00, 09:30, 10:00, 10:30... hasta 17:30 (último que entra completo)
// 4. Eliminar los slots que ya están ocupados (turnos-ocupados)
//    Un slot está ocupado si hay un turno que empieza en ese horario
// 5. Eliminar slots pasados si la fecha es hoy
```

**Al hacer submit del formulario:**
- Validar que todos los campos requeridos estén completos
- Si falta algo: setear `error` con mensaje descriptivo
- Llamar a `POST /publico/turnos` con todos los datos
- Si responde `201`: setear `exito = true` y mostrar mensaje de confirmación
- Si responde `409` (horario ocupado): mostrar error y limpiar `horarioSeleccionado`
- Si falla por otro motivo: mostrar el error recibido

**Estructura visual del formulario (pasos secuenciales):**

```
Paso 1: Elegí un servicio
  → cards o botones con nombre, duración y precio de cada servicio
  → al seleccionar uno se marca visualmente y aparece el Paso 2

Paso 2: Elegí una fecha
  → input type="date" con fecha mínima = hoy
  → al seleccionar fecha aparece el Paso 3

Paso 3: Elegí un horario
  → botones con cada horario disponible calculado
  → si no hay horarios: mensaje "No hay horarios disponibles para esta fecha"
  → al seleccionar horario aparece el Paso 4

Paso 4: Tus datos
  → input nombre (requerido)
  → input email (requerido)
  → input teléfono (opcional)
  → botón "Confirmar reserva"

Estado de éxito:
  → Reemplazar el formulario completo con:
    "¡Turno reservado! Te esperamos el [fecha] a las [hora]."
    Nombre del servicio y profesional.
```

**Estilos:**
- Usar variables CSS del sistema de diseño
- Los servicios como cards clicables con borde resaltado al seleccionar
- Los horarios como botones en grilla (3-4 por fila)
- Botón "Confirmar reserva" deshabilitado mientras `cargando` es true
- Mensajes de error en `var(--color-danger)`
- Mensaje de éxito en `var(--color-success)`
- Diseño mobile-first, máximo ancho de 600px centrado

---

## Parte F — Página 404

### F1 — Crear `sitio-publico/src/pages/404.astro`

Página simple que se muestra cuando el slug no existe.
Mensaje: "Profesional no encontrado" con link a la página de inicio.

---

## Qué NO hacer en esta etapa

- No agregar animaciones ni micro-interacciones (son para Fase 3)
- No modificar ningún archivo del backend ni del panel-admin
- No usar `localStorage` en el componente Vue del sitio público
  (los clientes no tienen sesión — cada reserva es anónima)
- No crear un calendario visual complejo — input type="date" es suficiente
- No instalar librerías de UI, calendarios ni date-pickers externos
- No usar `http://localhost:4000` en el fetch del bloque Astro
  — usar `http://backend:4000` (nombre del servicio Docker)

---

## Cómo validar que esta etapa está completa

1. `http://localhost:4321` → muestra la landing del sitio con las 3 cards explicativas
2. `http://localhost:4321/maria-garcia` → muestra la página de María García
   con su nombre, especialidad y el formulario de reserva
3. En el formulario: los servicios cargados desde el backend son visibles
4. Seleccionar servicio + fecha → aparecen los horarios disponibles calculados
5. Seleccionar horario → aparecen los campos de datos del cliente
6. Completar datos y confirmar → aparece mensaje de éxito
7. Verificar en el backend que el turno se creó:
   ```powershell
   $body = '{"email":"maria@test.com","password":"123456"}'
   curl.exe -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d $body
   # Copiar token
   curl.exe "http://localhost:4000/turnos?fecha=FECHA-USADA" -H "Authorization: Bearer TOKEN"
   # → debe aparecer el turno recién creado
   ```
8. Intentar reservar el mismo horario nuevamente → mensaje de error de conflicto
9. `http://localhost:4321/slug-inexistente` → redirige a la página 404
10. `npm run build` en `sitio-publico/` → sin errores

### Reporte de validación esperado

```
✅ Etapa 3B — Sitio público completado

Validaciones:
✔ Landing en :4321 — visible con contenido
✔ Página del profesional — nombre y especialidad correctos
✔ Servicios — cargados desde el backend
✔ Horarios — calculados correctamente según disponibilidad
✔ Reserva exitosa — turno creado en la base de datos
✔ Conflicto de horario — error 409 mostrado al usuario
✔ Slug inexistente — redirige a 404
✔ build sitio-publico — OK

Archivos creados en esta etapa:
- sitio-publico/src/styles/global.css
- sitio-publico/src/layouts/Layout.astro
- sitio-publico/src/pages/index.astro (reemplazado)
- sitio-publico/src/pages/[slug].astro
- sitio-publico/src/pages/404.astro
- sitio-publico/src/vue-components/FormReserva.vue

Próximo paso: Etapa 3C — Panel admin Vue: gestión de turnos, servicios y disponibilidad
```

---

## Notas para el orden de implementación

1. **Primero el sistema de diseño** (Parte A) — Layout lo necesita
2. **Luego el Layout** (Parte B) — las páginas lo necesitan
3. **Luego index.astro** (Parte C) — para verificar que Astro levanta bien
4. **Luego [slug].astro sin el componente Vue** (Parte D) — verificar que
   el fetch al backend funciona y los datos del profesional aparecen
5. **Por último FormReserva.vue** (Parte E) — es lo más complejo,
   conviene tener todo lo demás estable antes

> Si el fetch en [slug].astro falla con error de red, verificar que
> se está usando `http://backend:4000` y NO `http://localhost:4000`.
> Dentro del contenedor Docker, `localhost` apunta al propio contenedor
> y no al servicio backend.
