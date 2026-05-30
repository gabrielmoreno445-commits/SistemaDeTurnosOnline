# Prompt Etapa 5B — Sitio público Fase 3

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapa 5A completada: onboarding funcionando, búsqueda y foto de perfil en el backend.

Reglas que siempre aplican:
- Sin TypeScript — JavaScript puro
- Archivos .astro para páginas y layouts, .vue para componentes interactivos
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Comentarios estratégicos en cada archivo nuevo
- Usar variables CSS del sistema de diseño — nunca hardcodear colores
- No modificar el backend ni el panel-admin en ningún caso
```

---

## Contexto de lo que ya existe

Del sitio-publico, funcionando y sin tocar salvo donde se indique:
- `src/layouts/Layout.astro` — header con toggle de tema
- `src/pages/index.astro` — landing con buscador visual (no funcional aún)
- `src/pages/[slug].astro` — página del profesional con FormReserva.vue
- `src/pages/404.astro` — página de error
- `src/vue-components/FormReserva.vue` — formulario de reserva completo
- `src/styles/global.css` — sistema de diseño con dark mode

Del backend, endpoints nuevos disponibles desde 5A:
- `GET /busqueda?q=termino` — busca profesionales por nombre o especialidad
- `GET /publico/:slug` — ahora incluye `foto_url`

---

## Concepto clave — fetch en Astro vs fetch en Vue

```
Hay dos formas de llamar a la API en el sitio público:

1. Fetch en el bloque --- de Astro (servidor):
   - Ocurre cuando Astro genera la página
   - Usa http://backend:4000 (nombre del servicio Docker)
   - El resultado es HTML estático — no cambia sin recargar
   - Ideal para: datos del profesional, resultados de búsqueda

2. Fetch en un componente Vue (cliente, isla interactiva):
   - Ocurre en el navegador del usuario
   - Usa http://localhost:4000
   - El resultado es reactivo — puede actualizarse sin recargar
   - Ideal para: buscador en tiempo real, formulario de reserva

En esta etapa usamos AMBOS según el caso.
```

---

## Parte A — Foto de perfil en la página del profesional

### A1 — Actualizar `sitio-publico/src/pages/[slug].astro`

El backend ya devuelve `foto_url` en `GET /publico/:slug`.
Agregar la foto al template, antes del nombre del profesional.

```astro
{profesional.foto_url && (
  <img
    src={`http://localhost:4000${profesional.foto_url}`}
    alt={`Foto de ${profesional.nombre}`}
    class="foto-perfil"
  />
)}
```

Estilos para `.foto-perfil`:
```css
.foto-perfil {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border);
  display: block;
  margin: 0 auto 1rem;
}
```

> IMPORTANTE: En producción (Etapa 5C) esta URL cambiará a la del backend
> en Railway. Por ahora `http://localhost:4000` es correcto para desarrollo.

---

## Parte B — Buscador funcional en la landing

### B1 — Crear `sitio-publico/src/vue-components/BuscadorProfesional.vue`

```js
// vue-components/BuscadorProfesional.vue
// Componente Vue que maneja la búsqueda de profesionales en tiempo real.
// Vive en index.astro como isla interactiva (client:load).
//
// Usa debounce de 400ms para no llamar a la API en cada tecla.
// Debounce significa: "esperar X ms después de la última tecla antes de buscar".
// Sin debounce, escribir "pelu" haría 4 llamadas a la API — con debounce, solo 1.
//
// Al hacer click en un resultado navega a la página del profesional.
```

**Estado reactivo:**
```js
termino: ''           // texto del input
resultados: []        // array de profesionales encontrados
cargando: false       // true mientras espera respuesta
error: null           // mensaje de error o null
timerId: null         // referencia al timer del debounce
sinResultados: false  // true cuando la búsqueda no encontró nada
```

**Lógica del debounce:**
```js
// Al escribir en el input:
function alEscribir() {
  // Cancelar el timer anterior si existe
  clearTimeout(timerId)

  // Si el término tiene menos de 2 caracteres: limpiar resultados y salir
  if (termino.length < 2) {
    resultados = []
    sinResultados = false
    return
  }

  // Iniciar nuevo timer — la búsqueda se ejecuta 400ms después de la última tecla
  timerId = setTimeout(buscar, 400)
}

async function buscar() {
  cargando = true
  error = null
  try {
    const res = await fetch(`http://localhost:4000/busqueda?q=${termino}`)
    const data = await res.json()
    resultados = data
    sinResultados = data.length === 0
  } catch (e) {
    error = 'No se pudo realizar la búsqueda'
  } finally {
    cargando = false
  }
}
```

**Interfaz:**
- Input de texto con placeholder "Buscá por nombre o especialidad..."
- Mientras `cargando`: spinner debajo del input
- Si `sinResultados`: mensaje "No encontramos profesionales con ese término"
- Si hay `resultados`: lista de cards con:
  - Foto circular (si tiene) o placeholder gris
  - Nombre del profesional
  - Especialidad
  - Botón o click en la card → navega a `/:slug`
    (usar `window.location.href = '/' + slug` para navegar desde Vue en Astro)
- Si el input queda vacío: ocultar los resultados
- Estilos con variables CSS — diseño limpio y minimalista

### B2 — Actualizar `sitio-publico/src/pages/index.astro`

Reemplazar el buscador visual estático actual por el componente Vue:

```astro
---
// Importar el componente Vue
import BuscadorProfesional from '../vue-components/BuscadorProfesional.vue'
---

<!-- Reemplazar el buscador estático por la isla Vue -->
<BuscadorProfesional client:load />
```

El resto de la página (las 3 cards de "cómo funciona", el header, el footer)
no se toca.

---

## Parte C — Página de resultados de búsqueda

### C1 — Crear `sitio-publico/src/pages/buscar.astro`

Página que muestra resultados de búsqueda con renderizado en el servidor.
Se accede via `http://localhost:4321/buscar?q=termino`.

```astro
---
// pages/buscar.astro
// Página de resultados de búsqueda renderizada en el servidor por Astro.
// Lee el query param ?q= de la URL y llama al backend para obtener resultados.
// A diferencia del BuscadorProfesional.vue (reactivo), esta página es estática
// y es útil cuando el usuario llega desde un link o un motor de búsqueda.
//
// Ejemplo: https://tudominio.com/buscar?q=psicologo
// → Astro genera el HTML con los resultados en el servidor → bueno para SEO

import Layout from '../layouts/Layout.astro'

const query = Astro.url.searchParams.get('q') || ''
let resultados = []
let error = false

if (query.length >= 2) {
  try {
    const res = await fetch(`http://backend:4000/busqueda?q=${encodeURIComponent(query)}`)
    if (res.ok) {
      resultados = await res.json()
    }
  } catch (e) {
    error = true
  }
}
---
```

**Template:**
- Usar `Layout.astro` como wrapper con título "Resultados para: {query}"
- Si `query` está vacío: mensaje "Ingresá un término para buscar"
- Si `error`: mensaje de error genérico
- Si `resultados` vacío: "No encontramos profesionales con ese término"
- Si hay resultados: grilla de cards con nombre, especialidad, foto y link al slug
- Cada card es un link `<a href={`/${prof.slug}`}>` — HTML puro, sin Vue

**Estilos:**
```css
.resultados-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}
@media (max-width: 768px) {
  .resultados-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .resultados-grid { grid-template-columns: 1fr; }
}

.resultado-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  text-decoration: none;
  color: var(--text-primary);
  transition: transform var(--transition), box-shadow var(--transition);
  display: block;
}
.resultado-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

---

## Parte D — Conectar el buscador con la página de resultados

### D1 — Agregar opción de búsqueda completa en `BuscadorProfesional.vue`

Agregar debajo de los resultados en dropdown un link:

```html
<!-- Si hay resultados o está buscando -->
<a
  v-if="termino.length >= 2"
  :href="`/buscar?q=${termino}`"
  class="ver-todos"
>
  Ver todos los resultados para "{{ termino }}"
</a>
```

Esto conecta el buscador reactivo (Vue) con la página de resultados
estática (Astro) — el usuario puede elegir navegar a la página completa.

---

## Parte E — Mejoras en la página del profesional

### E1 — Enriquecer el header de `[slug].astro`

La página del profesional actualmente muestra nombre y especialidad.
Mejorar el header visual para que sea más atractivo como "carta de presentación":

```astro
<div class="profesional-header">
  <!-- Foto (ya agregada en Parte A) -->

  <div class="profesional-info">
    <h1 class="profesional-nombre">{profesional.nombre}</h1>
    <p class="profesional-especialidad">{profesional.especialidad}</p>

    {profesional.descripcion && (
      <p class="profesional-descripcion">{profesional.descripcion}</p>
    )}

    {profesional.direccion && (
      <p class="profesional-direccion">
        <span class="icono">📍</span> {profesional.direccion}
      </p>
    )}
  </div>
</div>
```

Estilos del header:
```css
.profesional-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  gap: 1rem;
}
.profesional-nombre {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}
.profesional-especialidad {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 1rem;
}
.profesional-descripcion {
  color: var(--text-secondary);
  max-width: 500px;
  line-height: 1.6;
}
.profesional-direccion {
  color: var(--text-muted);
  font-size: 0.9rem;
}
```

---

## Qué NO hacer en esta etapa

- No modificar el backend ni el panel-admin
- No modificar `FormReserva.vue` — el formulario de reserva ya funciona
- No instalar librerías de calendarios, sliders ni UI externas
- No hardcodear colores — siempre var(--nombre-variable)
- No usar `http://backend:4000` en los componentes Vue
  (esa URL solo funciona dentro de Docker, no en el navegador)
  — en Vue usar siempre `http://localhost:4000`

---

## Cómo validar que esta etapa está completa

1. `http://localhost:4321` → el input del buscador es funcional
2. Escribir "mar" → aparecen resultados después de 400ms (debounce)
3. Escribir "x" (1 letra) → no se hace búsqueda, no aparecen resultados
4. Click en un resultado → navega a la página del profesional
5. Click en "Ver todos los resultados" → va a `/buscar?q=mar`
6. `http://localhost:4321/buscar?q=pelu` → página con resultados renderizados
7. `http://localhost:4321/buscar?q=zzz` → "No encontramos profesionales..."
8. `http://localhost:4321/maria-garcia` → muestra foto si fue subida desde el panel
9. Verificar que la foto aparece tanto en modo claro como oscuro
10. En mobile (< 480px): los resultados de búsqueda se muestran en 1 columna
11. `npm run build` en `sitio-publico/` → sin errores

### Reporte de validación esperado

```
✅ Etapa 5B — Sitio público Fase 3 completado

Validaciones:
✔ Buscador reactivo — debounce de 400ms funcionando
✔ Resultados en dropdown — cards con foto y especialidad
✔ Link "Ver todos" — navega a /buscar?q=
✔ Página /buscar — resultados renderizados por Astro
✔ Foto de perfil en [slug].astro — visible si existe
✔ Header del profesional — nombre, especialidad, descripción, dirección
✔ Responsive — grilla de resultados en mobile
✔ build sitio-publico — OK

Archivos creados/modificados en esta etapa:
- sitio-publico/src/vue-components/BuscadorProfesional.vue (nuevo)
- sitio-publico/src/pages/index.astro (buscador Vue integrado)
- sitio-publico/src/pages/buscar.astro (nuevo)
- sitio-publico/src/pages/[slug].astro (foto + header mejorado)

Próximo paso: Etapa 5C — Deploy en producción
```

---

## Notas para el orden de implementación

1. **Primero la foto en `[slug].astro`** (Parte A) — cambio simple, verificar rápido
2. **Luego `BuscadorProfesional.vue`** (Parte B) — componente nuevo, el más complejo
3. **Luego integrarlo en `index.astro`** (Parte B2) — una vez que el componente funciona solo
4. **Luego `buscar.astro`** (Parte C) — página nueva independiente
5. **Luego conectar ambos** (Parte D) — el link "Ver todos" es el último paso

> Si el buscador Vue no muestra resultados, verificar en la consola del navegador
> que el fetch llega a `http://localhost:4000/busqueda?q=...` y que el backend
> está respondiendo. El error más común es confundir `backend:4000` (Docker)
> con `localhost:4000` (navegador).
