# Prompt Etapa 4C — Polish visual completo

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapas 4A y 4B completadas. Toda la funcionalidad de Fase 2 operativa.
Esta es la etapa de refinamiento visual — la funcionalidad no se toca.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- Todos los comentarios en español
- Sin librerías de UI externas
- Usar variables CSS del sistema de diseño — nunca hardcodear colores
- No modificar lógica de negocio ni llamadas a la API
- No modificar el backend en ningún caso
```

---

## Contexto de lo que ya existe

El sistema de diseño CSS fue definido desde la Fase 1 con dark mode,
animaciones y variables preparadas pero no activadas. Esta etapa
las activa sin redefinir nada.

Archivos de referencia del sistema de diseño ya existentes:
- `panel-admin/src/styles/global.css` — variables CSS completas con `[data-theme="dark"]`
- `sitio-publico/src/styles/global.css` — ídem para el sitio público

Keyframes ya definidos en ambos `global.css`:
```css
@keyframes fadeInUp   /* para cards y listas */
@keyframes fadeInDown /* para headers y notificaciones */
@keyframes spin       /* para spinners de carga */

.animate-in {
  animation: fadeInUp 300ms cubic-bezier(0.4, 0, 0.2, 1) both;
}
```

---

## Parte A — Corrección pendiente de Fase 2

### A1 — Actualizar `sitio-publico/src/pages/[slug].astro`

Corrección pequeña y puntual: el backend ya devuelve `descripcion` y `direccion`
desde la Etapa 4A, pero el template no los renderiza todavía.

Agregar debajo de la especialidad, solo si los campos tienen valor:

```astro
{profesional.descripcion && (
  <p class="profesional-descripcion">{profesional.descripcion}</p>
)}
{profesional.direccion && (
  <p class="profesional-direccion">📍 {profesional.direccion}</p>
)}
```

Estilos simples para estos dos elementos usando variables CSS.
No modificar nada más de la página en esta parte — el resto se trabaja más adelante.

---

## Parte B — Dark mode en el panel admin

### B1 — Crear `panel-admin/src/ArchivosVue/composables/useTheme.js`

```js
// composables/useTheme.js
// Maneja el estado del tema visual (claro/oscuro) del panel admin.
// Equivalente al ThemeContext de React — cualquier componente que necesite
// leer o cambiar el tema consume este composable.
// El tema se persiste en localStorage y se aplica como atributo en el <html>.
// El CSS ya tiene [data-theme="dark"] definido — este composable solo lo activa.
```

Lógica:
- Leer el tema inicial desde `localStorage` (clave `'tema'`), default `'light'`
- Al cambiar: aplicar `document.documentElement.setAttribute('data-theme', tema)`
  y guardar en `localStorage`
- Exportar: `tema` (ref), `toggleTema()`, `esModoOscuro` (computed boolean)

### B2 — Crear `panel-admin/src/ArchivosVue/components/ThemeToggle.vue`

```js
// components/ThemeToggle.vue
// Botón que alterna entre modo claro y oscuro.
// Usa useTheme() para leer y cambiar el estado del tema.
// Se incrusta en NavBar.vue.
```

- Botón simple con ícono de sol (☀️) en modo claro y luna (🌙) en modo oscuro
- Al hacer click: llamar a `toggleTema()`
- Sin librerías de íconos — usar los emojis directamente o caracteres Unicode
- Estilos con variables CSS, tamaño apropiado para estar en la NavBar

### B3 — Integrar ThemeToggle en `NavBar.vue`

Agregar `<ThemeToggle />` al final de la barra de navegación,
alineado a la derecha o debajo de los links según el layout actual.
No modificar nada más de NavBar.

### B4 — Inicializar el tema en `panel-admin/src/main.js`

Agregar antes de `app.mount('#app')`:
```js
// Aplicar el tema guardado antes de montar la app
// para evitar el flash de modo incorrecto al cargar
const temaGuardado = localStorage.getItem('tema') || 'light'
document.documentElement.setAttribute('data-theme', temaGuardado)
```

---

## Parte C — Dark mode en el sitio público

### C1 — Verificar que `sitio-publico/src/styles/global.css` tiene `[data-theme="dark"]`

Si no tiene las variables de dark mode, agregarlas al final del archivo:

```css
[data-theme="dark"] {
  --bg-base: #0F172A;
  --bg-card: #1E293B;
  --bg-card-hover: #334155;
  --bg-input: #1E293B;
  --border: #334155;
  --border-focus: #3B82F6;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
  --color-primary-light: rgba(37,99,235,0.15);
  --color-accent-light: rgba(16,185,129,0.15);
  --color-danger-light: rgba(239,68,68,0.15);
}
```

### C2 — Agregar toggle de tema en `sitio-publico/src/layouts/Layout.astro`

En el header del Layout, agregar un botón simple de toggle de tema.
Como Astro genera HTML estático, la lógica del toggle va en un
`<script>` inline al final del Layout:

```js
// Script inline en Layout.astro — se ejecuta en el navegador del cliente
// Aplica el tema guardado antes de mostrar el contenido (evita flash)
// y maneja el click del botón toggle.
```

```astro
<script>
  // Aplicar tema guardado inmediatamente al cargar
  const tema = localStorage.getItem('tema') || 'light'
  document.documentElement.setAttribute('data-theme', tema)

  // Manejar el click del toggle
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle')
    if (!btn) return
    btn.addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-theme')
      const nuevo = actual === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', nuevo)
      localStorage.setItem('tema', nuevo)
      btn.textContent = nuevo === 'dark' ? '☀️' : '🌙'
    })
  })
</script>
```

---

## Parte D — Animaciones de entrada

### D1 — Aplicar `.animate-in` en el panel admin

En cada página que muestre listas de cards, aplicar `.animate-in`
con delays escalonados. Los keyframes ya existen en `global.css`.

**DashboardPage.vue** — en las MetricaCards y en las cards de turnos:
```html
<!-- En las MetricaCards -->
<MetricaCard
  v-for="(metrica, index) in metricas"
  :key="index"
  class="animate-in"
  :style="{ animationDelay: `${index * 80}ms` }"
  ...
/>

<!-- En las cards de turnos -->
<div
  v-for="(turno, index) in turnos"
  :key="turno.id"
  class="card animate-in"
  :style="{ animationDelay: `${index * 60}ms` }"
>
```

**ServiciosPage.vue** — en las cards de servicios:
```html
<div
  v-for="(servicio, index) in servicios"
  :key="servicio.id"
  class="card animate-in"
  :style="{ animationDelay: `${index * 60}ms` }"
>
```

**MetricasPage.vue** — en las MetricaCards:
igual que en DashboardPage, delay de 80ms entre cards.

### D2 — Aplicar animaciones en el sitio público

**FormReserva.vue** — en las cards de servicios y en los botones de horarios:
```html
<!-- Cards de servicios -->
<div
  v-for="(servicio, index) in servicios"
  :key="servicio.id"
  class="servicio-card animate-in"
  :style="{ animationDelay: `${index * 70}ms` }"
>

<!-- Botones de horarios -->
<button
  v-for="(horario, index) in horariosDisponibles"
  :key="horario"
  class="horario-btn animate-in"
  :style="{ animationDelay: `${index * 40}ms` }"
>
```

---

## Parte E — Micro-interacciones

### E1 — Estilos hover y active en el panel admin

Agregar en `panel-admin/src/styles/global.css`, al final del archivo:

```css
/* Micro-interacciones — botones */
button, .btn {
  transition: transform var(--transition), box-shadow var(--transition),
              background-color var(--transition);
}
button:hover:not(:disabled), .btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
button:active:not(:disabled), .btn:active:not(:disabled) {
  transform: scale(0.97);
}
button:disabled, .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Cards interactivas */
.card {
  transition: transform var(--transition), box-shadow var(--transition);
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Loading spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
  display: inline-block;
}

/* Transición de color en badges de estado */
.badge {
  transition: background-color var(--transition), color var(--transition);
}
```

### E2 — Reemplazar textos "Cargando..." por spinner

En todas las páginas que muestran "Cargando..." cuando `cargando === true`,
reemplazar el texto por el spinner:

```html
<!-- Antes -->
<p v-if="cargando">Cargando...</p>

<!-- Después -->
<div v-if="cargando" class="cargando-container">
  <span class="spinner"></span>
</div>
```

Agregar en `global.css`:
```css
.cargando-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}
```

Páginas donde aplicar: DashboardPage, ServiciosPage, DisponibilidadPage,
MetricasPage, PerfilPage, y FormReserva.vue en el sitio público.

### E3 — Focus ring en inputs

Verificar que todos los inputs del panel admin y del sitio público
tienen el focus ring definido en el sistema de diseño. Si no está aplicado,
agregar en ambos `global.css`:

```css
input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  transition: border-color var(--transition), box-shadow var(--transition);
}
```

---

## Parte F — Responsive mobile

### F1 — NavBar responsive en el panel admin

Actualizar `NavBar.vue` para que en pantallas < 768px se muestre
un menú hamburguesa en lugar de los links horizontales.

Estado reactivo: `menuAbierto: false`

Comportamiento:
- En desktop (≥ 768px): links horizontales, comportamiento actual
- En mobile (< 768px): botón ☰ que al hacer click abre/cierra el menú
- Al navegar a una ruta: cerrar el menú automáticamente (`router.afterEach`)

CSS usando media queries con las variables del sistema:
```css
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-links.abierto { display: flex; flex-direction: column; }
  .hamburguesa { display: block; }
}
@media (min-width: 769px) {
  .hamburguesa { display: none; }
}
```

### F2 — Responsive en páginas del panel admin

Agregar en `global.css` del panel admin, clases de layout responsive:

```css
/* Grid responsive para cards de métricas */
.metricas-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
@media (max-width: 900px) {
  .metricas-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .metricas-grid { grid-template-columns: 1fr; }
}

/* Layout principal con sidebar */
.panel-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}
@media (max-width: 768px) {
  .panel-layout { grid-template-columns: 1fr; }
}
```

Aplicar `.metricas-grid` en DashboardPage y MetricasPage donde se muestran
las MetricaCards.

### F3 — Responsive en el sitio público

**`FormReserva.vue`** — grid de horarios responsive:
```css
.horarios-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
@media (max-width: 600px) {
  .horarios-grid { grid-template-columns: repeat(2, 1fr); }
}
```

**`[slug].astro`** — ancho máximo centrado:
```css
.pagina-profesional {
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
```

**`index.astro`** — cards de "cómo funciona" responsive:
```css
.como-funciona {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 700px) {
  .como-funciona { grid-template-columns: 1fr; }
}
```

---

## Qué NO hacer en esta etapa

- No modificar lógica de negocio ni llamadas a la API en ningún archivo
- No modificar el backend
- No instalar librerías de animación externas (Framer Motion, GSAP, etc.)
- No redefinir variables CSS — solo usar las que ya existen
- No agregar nuevas páginas ni rutas
- No cambiar la estructura HTML de los componentes — solo agregar clases y estilos

---

## Cómo validar que esta etapa está completa

### Panel admin
1. `http://localhost:5173` en modo claro → click en toggle → cambia a modo oscuro
2. Recargar la página → sigue en modo oscuro (persiste en localStorage)
3. En DashboardPage → las MetricaCards y turnos aparecen con animación fadeInUp
4. Hover sobre una card → se eleva ligeramente
5. Click en un botón → efecto de scale visible
6. Redimensionar a < 768px → NavBar muestra hamburguesa, los links se colapsan
7. En mobile: abrir menú → navegar a una página → el menú se cierra automáticamente
8. Las métricas se muestran en grilla de 2 columnas en tablet, 1 en mobile

### Sitio público
9. `http://localhost:4321/maria-garcia` → muestra descripción y dirección del profesional
10. Toggle de tema en el header → alterna dark/light
11. Las cards de servicios aparecen con animación al cargar
12. Los botones de horarios aparecen con animación escalonada
13. En mobile (< 600px): los horarios se muestran en 2 columnas en vez de 4
14. Las 3 cards de "cómo funciona" en la landing se apilan en mobile

### Builds
15. `npm run build` en `panel-admin/` → sin errores ni warnings críticos
16. `npm run build` en `sitio-publico/` → sin errores

### Reporte de validación esperado

```
✅ Etapa 4C — Polish visual completado
✅ Fase 2 completa

Validaciones:
✔ Dark mode panel-admin — toggle + persistencia en localStorage
✔ Dark mode sitio-publico — toggle funcional
✔ Descripción y dirección visibles en página del profesional
✔ Animaciones fadeInUp en listas de cards — panel y sitio público
✔ Micro-interacciones botones — hover y active
✔ Spinners reemplazando textos de carga
✔ Focus ring en inputs
✔ NavBar responsive con hamburguesa en mobile
✔ Métricas en grilla responsive
✔ FormReserva horarios en 2 columnas en mobile
✔ build panel-admin — OK
✔ build sitio-publico — OK

Archivos modificados en esta etapa:
- sitio-publico/src/pages/[slug].astro (descripcion + direccion + estilos)
- sitio-publico/src/layouts/Layout.astro (toggle + script de tema)
- sitio-publico/src/styles/global.css (dark mode + responsive)
- sitio-publico/src/vue-components/FormReserva.vue (animate-in + responsive)
- panel-admin/src/main.js (inicializar tema antes de montar)
- panel-admin/src/styles/global.css (micro-interacciones + responsive)
- panel-admin/src/ArchivosVue/composables/useTheme.js (nuevo)
- panel-admin/src/ArchivosVue/components/ThemeToggle.vue (nuevo)
- panel-admin/src/ArchivosVue/components/NavBar.vue (ThemeToggle + hamburguesa)
- panel-admin/src/ArchivosVue/pages/DashboardPage.vue (animate-in + grid)
- panel-admin/src/ArchivosVue/pages/ServiciosPage.vue (animate-in)
- panel-admin/src/ArchivosVue/pages/MetricasPage.vue (animate-in + grid)

🎉 Próximo paso: revisar SPEC 3 o presentar el producto terminado
```

---

## Notas para el orden de implementación

1. **Parte A primero** — corrección pequeña, cierra la deuda de 4B antes del polish
2. **Dark mode** (B y C) — el cambio más visible, verificarlo bien antes de seguir
3. **Animaciones** (D) — agregar clase por clase, verificar que no rompen el layout
4. **Micro-interacciones** (E) — pure CSS, bajo riesgo
5. **Responsive** (F) — dejar para el final porque requiere redimensionar
   el navegador para probar; conviene tener todo lo demás estable primero

> Si alguna animación causa un "flash" o comportamiento extraño al recargar,
> verificar que `.animate-in` no se aplica a elementos que están ocultos con `v-if`.
> En ese caso, mover la clase al elemento interno visible en lugar del wrapper condicional.
