# Prompt Etapa 3C — Panel admin Vue: gestión completa

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapas 1, 2, 3A y 3B completadas y funcionando.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- Archivos .js para lógica pura, .vue para componentes
- async/await en lugar de .then()
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Comentarios estratégicos en cada archivo nuevo
- profesional_id siempre desde el store (JWT) — nunca desde un input
- Diseño funcional simple — el refinamiento visual es Fase 3
- Usar variables CSS del sistema de diseño para todos los estilos
```

---

## Contexto de lo que ya existe

Del panel-admin, funcionando y sin tocar salvo donde se indique:
- `ArchivosVue/stores/authStore.js` — login, logout, restaurarSesion, estaLogueado
- `ArchivosVue/router/index.js` — rutas /login, /register, / con guardia
- `ArchivosVue/pages/LoginPage.vue` — funciona
- `ArchivosVue/pages/RegisterPage.vue` — funciona
- `ArchivosVue/pages/DashboardPage.vue` — muestra bienvenida básica (se actualiza en Parte D)
- `ArchivosJS/api/auth.js` — funciones de autenticación

Del backend, todos los endpoints disponibles:
- GET/POST/PUT/DELETE `/servicios` — protegidos con JWT
- GET/POST/DELETE `/disponibilidad` — protegidos con JWT
- GET `/turnos` + query `?fecha=` — protegido con JWT
- PUT `/turnos/:id/estado` — protegido con JWT

---

## Parte A — Funciones API

### A1 — Crear `panel-admin/src/ArchivosJS/api/servicios.js`

```js
// api/servicios.js
// Funciones de comunicación con el backend para gestión de servicios.
// Todas requieren el token JWT — se pasa como parámetro desde el componente
// que consume estas funciones (lo obtiene del authStore).
// URL base: http://localhost:4000
```

Funciones a crear, todas async con try/catch que lanza el error:

- `obtenerServicios(token)` → GET `/servicios`
- `crearServicio(token, datos)` → POST `/servicios` con `{ nombre, duracion_minutos, precio }`
- `editarServicio(token, id, datos)` → PUT `/servicios/:id`
- `desactivarServicio(token, id)` → DELETE `/servicios/:id`

### A2 — Crear `panel-admin/src/ArchivosJS/api/disponibilidad.js`

```js
// api/disponibilidad.js
// Funciones para configurar los horarios de atención del profesional.
// dia_semana: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles,
//             4=Jueves, 5=Viernes, 6=Sábado
```

Funciones:
- `obtenerDisponibilidad(token)` → GET `/disponibilidad`
- `crearBloque(token, datos)` → POST `/disponibilidad` con `{ dia_semana, hora_inicio, hora_fin }`
- `eliminarBloque(token, id)` → DELETE `/disponibilidad/:id`

### A3 — Crear `panel-admin/src/ArchivosJS/api/turnos.js`

```js
// api/turnos.js
// Funciones para ver y gestionar los turnos desde el panel del profesional.
// El parámetro fecha es opcional — si no se pasa, el backend devuelve los de hoy.
```

Funciones:
- `obtenerTurnos(token, fecha)` → GET `/turnos?fecha=${fecha}` (fecha puede ser undefined)
- `cambiarEstadoTurno(token, id, estado)` → PUT `/turnos/:id/estado` con `{ estado }`

---

## Parte B — Composable de autenticación

### B1 — Crear `panel-admin/src/ArchivosVue/composables/useAuth.js`

```js
// composables/useAuth.js
// Composable que expone los datos y acciones del authStore de forma simple.
// Equivalente a un custom hook de React — centraliza el acceso al store
// para que los componentes no importen el store directamente.
// Uso en cualquier componente: const { profesional, token, logout } = useAuth()
```

Debe exportar:
```js
export function useAuth() {
  const store = useAuthStore()
  return {
    profesional: computed(() => store.profesional),
    token: computed(() => store.token),
    estaLogueado: computed(() => store.estaLogueado),
    logout: store.logout
  }
}
```

---

## Parte C — Componente de navegación

### C1 — Crear `panel-admin/src/ArchivosVue/components/NavBar.vue`

Barra de navegación lateral o superior del panel admin.
Diseño simple funcional.

```js
// components/NavBar.vue
// Barra de navegación del panel admin. Muestra el nombre del profesional
// y los links a las secciones principales. Usa useAuth() para obtener
// los datos del profesional logueado sin importar el store directamente.
```

Contenido:
- Nombre del profesional logueado (desde `useAuth`)
- Links de navegación con `<RouterLink>`:
  - "Turnos de hoy" → `/`
  - "Mis servicios" → `/servicios`
  - "Mis horarios" → `/disponibilidad`
- Botón "Cerrar sesión" que llama a `logout()` y redirige a `/login`
- Resaltar el link activo con `RouterLink` class active

Estilos: usar variables CSS, diseño horizontal o vertical según preferencia,
que sea claro y usable.

---

## Parte D — Dashboard: turnos del día

### D1 — Reemplazar contenido de `panel-admin/src/ArchivosVue/pages/DashboardPage.vue`

Esta página muestra los turnos del día actual y permite cambiar su estado.
Es la pantalla principal del panel.

```js
// pages/DashboardPage.vue
// Pantalla principal del panel admin. Muestra los turnos del día actual
// y permite al profesional confirmar o cancelar cada uno.
// Incluye selector de fecha para ver turnos de otros días.
```

Estado reactivo:
```js
turnos        // array de turnos del día
fecha         // string YYYY-MM-DD, inicializa en la fecha de hoy
cargando      // boolean
error         // string o null
```

Al montar (`onMounted`): llamar a `obtenerTurnos(token, fecha)`

Watch en `fecha`: recargar turnos cuando cambia la fecha

Interfaz:
- Título: "Turnos del día"
- Input `type="date"` para cambiar la fecha visualizada
- Si `cargando`: mensaje "Cargando turnos..."
- Si no hay turnos: "No hay turnos para esta fecha"
- Lista de turnos con cards que muestren:
  - Hora de inicio
  - Nombre del cliente
  - Nombre del servicio
  - Estado actual (badge de color: pendiente=amarillo, confirmado=verde, cancelado=gris)
  - Botones de acción según estado:
    - Si `pendiente`: botones "Confirmar" y "Cancelar"
    - Si `confirmado`: botón "Cancelar"
    - Si `cancelado`: sin botones
- Al hacer click en un botón: llamar a `cambiarEstadoTurno` y recargar la lista
- Incluir `NavBar` en el template

---

## Parte E — Página de servicios

### E1 — Crear `panel-admin/src/ArchivosVue/pages/ServiciosPage.vue`

Gestión completa de servicios del profesional.

```js
// pages/ServiciosPage.vue
// Permite al profesional crear, editar y desactivar sus servicios.
// Un servicio desactivado no aparece en el sitio público ni en el formulario de reserva.
```

Estado reactivo:
```js
servicios       // array
mostrarFormulario  // boolean — controla si se ve el form de nuevo servicio
editando        // objeto servicio o null — si es distinto de null, el form edita ese servicio
formulario      // { nombre, duracion_minutos, precio } — datos del form
cargando        // boolean
error           // string o null
```

Al montar: llamar a `obtenerServicios(token)`

Interfaz:
- Título: "Mis servicios"
- Botón "Agregar servicio" que muestra el formulario
- Formulario (visible cuando `mostrarFormulario` es true):
  - Input nombre (requerido)
  - Input duración en minutos (requerido, type="number", min=15)
  - Input precio (opcional, type="number")
  - Botón "Guardar" y botón "Cancelar"
  - Al guardar: si `editando` no es null → editar; si es null → crear
  - Al cancelar: ocultar form y limpiar `formulario`
- Lista de servicios:
  - Nombre, duración, precio
  - Botón "Editar" → precarga el formulario con los datos del servicio
  - Botón "Desactivar" → llama a `desactivarServicio` y recarga la lista
- Incluir `NavBar`

---

## Parte F — Página de disponibilidad

### F1 — Crear `panel-admin/src/ArchivosVue/pages/DisponibilidadPage.vue`

Configuración de los horarios de atención por día de la semana.

```js
// pages/DisponibilidadPage.vue
// El profesional define en qué días y horarios atiende.
// Estos datos son los que usa el sitio público para mostrar
// los horarios disponibles al cliente al momento de reservar.
// Un profesional puede tener múltiples bloques por día (ej: mañana y tarde).
```

Estado reactivo:
```js
bloques         // array de bloques de disponibilidad
formulario      // { dia_semana, hora_inicio, hora_fin }
cargando        // boolean
error           // string o null

// Helper para mostrar nombre del día
const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
```

Al montar: llamar a `obtenerDisponibilidad(token)`

Interfaz:
- Título: "Mis horarios de atención"
- Formulario para agregar un bloque:
  - Select de día de la semana (Lunes a Domingo)
  - Input hora inicio (type="time")
  - Input hora fin (type="time")
  - Botón "Agregar horario"
- Lista de bloques agrupados por día de la semana:
  - Mostrar cada bloque como: "Lunes: 09:00 - 18:00"
  - Botón "Eliminar" por cada bloque
- Incluir `NavBar`

---

## Parte G — Actualizar el router

### G1 — Agregar rutas nuevas en `panel-admin/src/ArchivosVue/router/index.js`

Agregar las dos rutas nuevas a la lista existente.
No modificar nada más del archivo — solo agregar:

```js
{
  path: '/servicios',
  component: () => import('../pages/ServiciosPage.vue'),
  meta: { requiereAuth: true }
},
{
  path: '/disponibilidad',
  component: () => import('../pages/DisponibilidadPage.vue'),
  meta: { requiereAuth: true }
}
```

---

## Qué NO hacer en esta etapa

- No modificar `authStore.js`, `LoginPage.vue` ni `RegisterPage.vue`
- No modificar ningún archivo del backend ni del sitio-publico
- No agregar roles ni permisos (hay un solo tipo de usuario)
- No implementar búsqueda ni filtros avanzados de turnos (Fase 3)
- No instalar librerías de UI externas
- No agregar notificaciones por email (Fase 3)
- No hacer eliminación física de servicios — solo desactivar

---

## Cómo validar que esta etapa está completa

1. `http://localhost:5173/login` → iniciar sesión con maria@test.com
2. Redirige al Dashboard → muestra los turnos del día (o mensaje de vacío)
3. NavBar visible con los 3 links y el botón de cerrar sesión
4. Click en "Mis servicios" → `/servicios` → lista de servicios cargada
5. Crear un nuevo servicio → aparece en la lista
6. Editar el servicio → los cambios se reflejan
7. Desactivar el servicio → desaparece de la lista
8. Click en "Mis horarios" → `/disponibilidad` → lista de bloques
9. Agregar un bloque (ej: Lunes 09:00-18:00) → aparece en la lista
10. Eliminar el bloque → desaparece
11. En el Dashboard: cambiar la fecha → carga los turnos de ese día
12. Si hay turnos: confirmar uno → el badge cambia a verde
13. Cancelar un turno → el badge cambia a gris y desaparecen los botones
14. Cerrar sesión → redirige a `/login`
15. `npm run build` en `panel-admin/` → sin errores

### Reporte de validación esperado

```
✅ Etapa 3C — Panel admin completado

Validaciones:
✔ Login → Dashboard con NavBar
✔ Dashboard — turnos del día visibles
✔ Cambio de fecha — recarga turnos correctamente
✔ Confirmar turno — estado actualizado
✔ Cancelar turno — estado actualizado
✔ Servicios — CRUD completo (crear, editar, desactivar)
✔ Disponibilidad — crear y eliminar bloques
✔ Cerrar sesión — redirige a /login
✔ build panel-admin — OK

Archivos creados en esta etapa:
- panel-admin/src/ArchivosJS/api/servicios.js
- panel-admin/src/ArchivosJS/api/disponibilidad.js
- panel-admin/src/ArchivosJS/api/turnos.js
- panel-admin/src/ArchivosVue/composables/useAuth.js
- panel-admin/src/ArchivosVue/components/NavBar.vue
- panel-admin/src/ArchivosVue/pages/DashboardPage.vue (actualizado)
- panel-admin/src/ArchivosVue/pages/ServiciosPage.vue
- panel-admin/src/ArchivosVue/pages/DisponibilidadPage.vue
- panel-admin/src/ArchivosVue/router/index.js (2 rutas agregadas)

Próximo paso: ¡FASE 1 COMPLETA! → Revisar SPEC 2 para planificar la Fase 2
```

---

## Notas para el orden de implementación

1. **Primero las funciones API** (Parte A) — los composables y páginas las necesitan
2. **Luego el composable useAuth** (Parte B) — NavBar y páginas lo usan
3. **Luego NavBar** (Parte C) — todas las páginas lo incluyen
4. **Luego DashboardPage** (Parte D) — es la pantalla principal, verificar que funciona sola
5. **Luego ServiciosPage** (Parte E) — independiente del Dashboard
6. **Luego DisponibilidadPage** (Parte F) — independiente
7. **Por último el router** (Parte G) — registrar las rutas nuevas

Verificar después de cada página que la navegación desde NavBar funciona
y que la guardia de rutas sigue activa (intentar acceder a `/servicios`
sin estar logueado debe redirigir a `/login`).
