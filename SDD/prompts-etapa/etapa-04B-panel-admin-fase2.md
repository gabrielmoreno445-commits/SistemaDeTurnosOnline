# Prompt Etapa 4B — Panel admin Fase 2

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapa 4A completada: todos los endpoints de Fase 2 funcionando en el backend.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- Archivos .js para lógica pura, .vue para componentes
- async/await en lugar de .then()
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Comentarios estratégicos en cada archivo nuevo
- Diseño funcional simple — el refinamiento visual completo es Etapa 4C
- Usar variables CSS del sistema de diseño para todos los estilos
- No hardcodear colores — siempre var(--nombre-variable)
- No modificar archivos de Fase 1 salvo donde se indique explícitamente
```

---

## Contexto de lo que ya existe

Del panel-admin, funcionando y sin tocar salvo donde se indique:
- `ArchivosVue/stores/authStore.js` — login, logout, restaurarSesion
- `ArchivosVue/composables/useAuth.js` — expone profesional, token, logout
- `ArchivosVue/components/NavBar.vue` — navegación con 3 links
- `ArchivosVue/router/index.js` — rutas con guardia de auth
- `ArchivosVue/pages/DashboardPage.vue` — turnos del día con filtro de fecha
- `ArchivosVue/pages/ServiciosPage.vue` — CRUD de servicios
- `ArchivosVue/pages/DisponibilidadPage.vue` — gestión de horarios semanales
- `ArchivosVue/pages/LoginPage.vue` y `RegisterPage.vue`
- `ArchivosJS/api/auth.js`, `servicios.js`, `disponibilidad.js`, `turnos.js`
- `src/styles/global.css` — sistema de diseño CSS

Del backend, nuevos endpoints disponibles en esta etapa:
- `PUT /perfil` y `PUT /perfil/password`
- `GET/POST/DELETE /dias-bloqueados`
- `GET /metricas/resumen` y `GET /metricas/proximos`
- `GET /turnos` actualizado con filtros por estado, servicio_id, desde, hasta

---

## Parte A — Funciones API nuevas

### A1 — Crear `panel-admin/src/ArchivosJS/api/perfil.js`

```js
// api/perfil.js
// Funciones para actualizar los datos del profesional desde el panel admin.
// Separa la edición del perfil del cambio de contraseña — son endpoints distintos
// con validaciones distintas en el backend.
```

Funciones:
- `actualizarPerfil(token, datos)` → PUT `/perfil`
  - datos: `{ nombre, especialidad, telefono, descripcion, direccion }`
- `cambiarPassword(token, passwordActual, passwordNuevo)` → PUT `/perfil/password`

### A2 — Crear `panel-admin/src/ArchivosJS/api/diasBloqueados.js`

```js
// api/diasBloqueados.js
// Funciones para gestionar las fechas en que el profesional no atiende.
// Estas fechas bloquean la disponibilidad en el sitio público automáticamente.
```

Funciones:
- `obtenerDiasBloqueados(token)` → GET `/dias-bloqueados`
- `bloquearFecha(token, fecha, motivo)` → POST `/dias-bloqueados`
- `desbloquearFecha(token, id)` → DELETE `/dias-bloqueados/:id`

### A3 — Crear `panel-admin/src/ArchivosJS/api/metricas.js`

```js
// api/metricas.js
// Funciones para obtener datos de actividad del profesional.
// Los datos se calculan en tiempo real en el backend — no hay caché en el frontend.
```

Funciones:
- `obtenerResumen(token)` → GET `/metricas/resumen`
- `obtenerProximos(token)` → GET `/metricas/proximos`

---

## Parte B — Componente MetricaCard

### B1 — Crear `panel-admin/src/ArchivosVue/components/MetricaCard.vue`

Componente reutilizable para mostrar una métrica con título y valor.
Se usa tanto en `DashboardPage` como en `MetricasPage`.

```js
// components/MetricaCard.vue
// Card reutilizable para mostrar una métrica individual.
// Recibe un título, un valor y un color opcional para el valor.
// Lo usan DashboardPage (métricas rápidas) y MetricasPage (vista completa).
```

Props:
```js
titulo: String     // ej: "Turnos del mes"
valor: [String, Number]  // ej: 24 o "$18.500"
color: String      // opcional, default 'var(--color-primary)'
               // puede recibir 'var(--color-accent)' o 'var(--color-danger)'
```

Diseño: card simple con el título en texto secundario arriba
y el valor grande abajo. Sin animaciones — eso es 4C.

---

## Parte C — Página de perfil

### C1 — Crear `panel-admin/src/ArchivosVue/pages/PerfilPage.vue`

Página con dos secciones: editar datos del perfil y cambiar contraseña.

```js
// pages/PerfilPage.vue
// Permite al profesional actualizar sus datos visibles en el sitio público
// y cambiar su contraseña de acceso al panel.
// Los cambios de perfil se reflejan en el sitio público inmediatamente.
```

**Sección 1 — Datos del perfil:**

Estado reactivo:
```js
formulario: {
  nombre: '',         // prellenado con datos del profesional logueado
  especialidad: '',
  telefono: '',
  descripcion: '',
  direccion: ''
}
cargando: false
mensaje: null        // mensaje de éxito
error: null
```

Al montar (`onMounted`): precargar el formulario con los datos actuales
del profesional obtenidos desde `authStore` (ya están en el token/store).

Al hacer submit:
- Llamar a `actualizarPerfil(token, formulario)`
- Si es exitoso: mostrar `mensaje = 'Perfil actualizado correctamente'`
- Si falla: mostrar el error

Campos del formulario:
- Nombre (requerido)
- Especialidad
- Teléfono
- Descripción (textarea — "Texto que verán tus clientes en tu página pública")
- Dirección ("Dirección de tu consultorio o local")
- Botón "Guardar cambios"

**Sección 2 — Cambiar contraseña:**

Estado reactivo separado:
```js
passwords: {
  actual: '',
  nuevo: '',
  confirmar: ''    // validación solo en frontend
}
cargandoPass: false
mensajePass: null
errorPass: null
```

Validaciones en frontend antes de enviar:
- `nuevo` y `confirmar` deben coincidir → si no: `errorPass = 'Las contraseñas no coinciden'`
- `nuevo` debe tener al menos 6 caracteres

Al hacer submit:
- Llamar a `cambiarPassword(token, passwords.actual, passwords.nuevo)`
- Si es exitoso: limpiar los tres campos y mostrar mensaje de éxito
- Si falla: mostrar el error del backend

Incluir `NavBar` en el template.

---

## Parte D — Página de métricas

### D1 — Crear `panel-admin/src/ArchivosVue/pages/MetricasPage.vue`

Vista completa de actividad del profesional.

```js
// pages/MetricasPage.vue
// Muestra el resumen de actividad del mes actual y los próximos turnos confirmados.
// Usa MetricaCard para mostrar cada número de forma clara y visual.
```

Estado reactivo:
```js
resumen: null    // objeto con total_turnos, confirmados, cancelados, pendientes, ingresos
proximos: []     // array de próximos turnos
cargando: false
error: null
```

Al montar: llamar a `obtenerResumen(token)` y `obtenerProximos(token)` en paralelo
usando `Promise.all` — comentario estratégico explicando por qué paralelo y no secuencial.

Interfaz:
- Título "Actividad del mes"
- Fila de 4 `MetricaCard`:
  - "Total turnos" → `resumen.total_turnos`
  - "Confirmados" → `resumen.turnos_confirmados` (color: `var(--color-accent)`)
  - "Cancelados" → `resumen.turnos_cancelados` (color: `var(--color-danger)`)
  - "Ingresos estimados" → `$${resumen.ingresos_estimados}` (color: `var(--color-primary)`)
- Sección "Próximos turnos confirmados"
  - Lista de hasta 5 turnos con: fecha, hora, cliente, servicio
  - Si no hay próximos: "No tenés turnos confirmados próximos"
- Incluir `NavBar`

---

## Parte E — Actualizar DashboardPage

### E1 — Agregar métricas rápidas al inicio de `DashboardPage.vue`

Agregar al principio del template (antes de la sección de turnos),
sin modificar nada de la lógica existente de turnos:

- Llamar a `obtenerResumen(token)` en el `onMounted` existente (junto con `obtenerTurnos`)
- Agregar estado: `resumen: null`
- Mostrar una fila de 3 `MetricaCard` con: total turnos del mes, confirmados, ingresos
- Si `resumen` es null: no mostrar la fila (sin mensaje de error — es secundario)

Comentario estratégico en la sección agregada:
```js
// Métricas rápidas — se cargan junto con los turnos del día.
// Si fallan, no bloquean la vista principal de turnos.
// La vista completa de métricas está en /metricas.
```

---

## Parte F — Actualizar DisponibilidadPage

### F1 — Agregar sección de días bloqueados en `DisponibilidadPage.vue`

Agregar una segunda sección debajo de la sección existente de bloques horarios.
No modificar nada de la lógica existente de disponibilidad semanal.

Estado reactivo adicional:
```js
diasBloqueados: []
formularioBloqueado: { fecha: '', motivo: '' }
cargandoBloqueo: false
errorBloqueo: null
```

Al montar: cargar también `obtenerDiasBloqueados(token)` junto con la disponibilidad.

Nueva sección en el template:
- Título "Días que no atendés"
- Descripción: "Bloqueá fechas específicas como feriados o vacaciones.
  Tus clientes no podrán reservar en esos días."
- Formulario:
  - Input fecha (type="date", mínimo hoy)
  - Input motivo (opcional, placeholder: "ej: Feriado, Vacaciones...")
  - Botón "Bloquear fecha"
- Lista de fechas bloqueadas:
  - Formato: "09 Jul 2026 — Feriado nacional"
  - Botón "Desbloquear" por cada una
- Incluir mensajes de error con `var(--color-danger)`

---

## Parte G — Actualizar NavBar y Router

### G1 — Agregar links en `NavBar.vue`

Agregar dos links a los ya existentes, sin modificar el resto:
- "Métricas" → `/metricas`
- "Mi perfil" → `/perfil`

### G2 — Agregar rutas en `router/index.js`

Agregar al final de la lista de rutas existente, sin modificar nada más:
```js
{
  path: '/perfil',
  component: () => import('../pages/PerfilPage.vue'),
  meta: { requiereAuth: true }
},
{
  path: '/metricas',
  component: () => import('../pages/MetricasPage.vue'),
  meta: { requiereAuth: true }
}
```

---

## Qué NO hacer en esta etapa

- No modificar `authStore.js`, `LoginPage.vue`, `RegisterPage.vue`
- No modificar `ServiciosPage.vue` — no hay cambios en servicios en esta etapa
- No agregar animaciones ni dark mode — eso es Etapa 4C
- No instalar librerías de UI externas
- No modificar archivos del backend ni del sitio-publico

---

## Cómo validar que esta etapa está completa

1. `http://localhost:5173/login` → iniciar sesión con maria@test.com / 123456
2. Dashboard → muestra fila de 3 MetricaCards arriba de los turnos
3. Click en "Métricas" en NavBar → `/metricas` → 4 cards + lista de próximos
4. Click en "Mi perfil" en NavBar → `/perfil` → formulario precargado con datos actuales
5. Editar descripción y dirección → guardar → mensaje de éxito
6. Verificar en el sitio público: `http://localhost:4321/maria-garcia`
   → descripción y dirección visibles
7. Cambiar contraseña con datos incorrectos → error del backend visible
8. Cambiar contraseña con datos correctos → mensaje de éxito, campos limpios
9. En `/disponibilidad` → sección "Días que no atendés" visible debajo de los horarios
10. Bloquear fecha 2026-07-09 con motivo "Feriado" → aparece en la lista
11. En el sitio público: ir a `http://localhost:4321/maria-garcia`
    → seleccionar esa fecha en el formulario → mensaje de día bloqueado
12. Desbloquear la fecha → desaparece de la lista
13. Guardia de rutas: ir a `http://localhost:5173/perfil` sin sesión → redirige a `/login`
14. `npm run build` en `panel-admin/` → sin errores

### Reporte de validación esperado

```
✅ Etapa 4B — Panel admin Fase 2 completado

Validaciones:
✔ Dashboard — MetricaCards visibles con datos del mes
✔ MetricasPage — 4 cards + próximos turnos
✔ PerfilPage — formulario precargado, actualización exitosa
✔ Perfil actualizado visible en sitio público
✔ Cambio de contraseña — validaciones frontend + backend OK
✔ DisponibilidadPage — sección días bloqueados funcional
✔ Día bloqueado — visible en sitio público como fecha no disponible
✔ NavBar — 5 links presentes y funcionando
✔ Guardia de rutas — rutas nuevas protegidas
✔ build panel-admin — OK

Archivos creados en esta etapa:
- panel-admin/src/ArchivosJS/api/perfil.js
- panel-admin/src/ArchivosJS/api/diasBloqueados.js
- panel-admin/src/ArchivosJS/api/metricas.js
- panel-admin/src/ArchivosVue/components/MetricaCard.vue
- panel-admin/src/ArchivosVue/pages/PerfilPage.vue
- panel-admin/src/ArchivosVue/pages/MetricasPage.vue
- panel-admin/src/ArchivosVue/pages/DashboardPage.vue (sección métricas agregada)
- panel-admin/src/ArchivosVue/pages/DisponibilidadPage.vue (sección días bloqueados)
- panel-admin/src/ArchivosVue/components/NavBar.vue (2 links agregados)
- panel-admin/src/ArchivosVue/router/index.js (2 rutas agregadas)

Próximo paso: Etapa 4C — Polish visual completo
```

---

## Notas para el orden de implementación

1. **Primero las funciones API** (Parte A) — las páginas las necesitan
2. **MetricaCard** (Parte B) — antes de las páginas que lo usan
3. **PerfilPage y MetricasPage** (C y D) — páginas nuevas, independientes entre sí
4. **Actualizaciones a páginas existentes** (E y F) — hacerlas con cuidado,
   verificar que lo que ya funcionaba sigue funcionando después de cada cambio
5. **NavBar y Router** (G) — último paso, registrar todo junto

Después de agregar las métricas al Dashboard, verificar que la carga
de turnos del día sigue funcionando aunque las métricas fallen.
La UI de turnos no debe depender de que las métricas carguen correctamente.
