# Contexto global del proyecto — SistemaDeTurnosOnline

## Qué es este proyecto
Aplicación web de reserva de turnos online para profesionales independientes
(peluqueros, dentistas, psicólogos, masajistas, etc.).

- El **cliente final** entra al link público del profesional, ve la disponibilidad
  y reserva un turno sin necesidad de contactar por WhatsApp.
- El **profesional** accede a un panel de administración para ver y gestionar sus turnos.

---

## Stack — no sugerir alternativas salvo que se pida explícitamente

| Capa | Tecnología |
|---|---|
| Páginas públicas | Astro — genera HTML estático |
| Componentes reactivos (en Astro) | Vue.js — islas interactivas dentro de Astro |
| Panel de administración | Vue.js SPA — Vue Router + Pinia + Composables |
| Backend | Node.js con Express.js + JWT |
| Base de datos | MySQL 8 |
| Entorno | Docker Compose |

---

## Estructura de carpetas — respetar siempre

```
SistemaDeTurnosOnline/
├── sitio-publico/               ← Astro
│   └── src/
│       ├── pages/               ← archivos .astro (rutas)
│       ├── components/          ← componentes .astro
│       ├── vue-components/      ← componentes .vue que Astro incrusta
│       └── layouts/
│
├── panel-admin/                 ← Vue SPA
│   └── src/
│       ├── ArchivosJS/
│       │   ├── api/             ← funciones fetch al backend (una por entidad)
│       │   └── utils/           ← funciones auxiliares puras
│       ├── ArchivosVue/
│       │   ├── components/      ← componentes .vue reutilizables
│       │   ├── composables/     ← lógica reutilizable (equiv. a custom hooks)
│       │   ├── pages/           ← una página por pantalla .vue
│       │   ├── router/          ← index.js con rutas y guardia de auth
│       │   ├── stores/          ← Pinia stores (equiv. a React Context)
│       │   └── App.vue
│       └── main.js
│
├── backend/
│   ├── routes/                  ← un archivo .js por entidad
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── db/
│   │   └── connection.js
│   └── index.js
│
├── database/
│   └── schema.sql
│
└── docker-compose.yml
```

---

## Base de datos — tablas del proyecto (acumulativo por fase)

### Fase 1
- `profesionales` → id, nombre, email, password_hash, slug, especialidad, telefono, created_at

### Fase 2 (se agrega en el SPEC 2, no anticipar)
- `servicios` → id, profesional_id, nombre, duracion_minutos, precio
- `disponibilidad` → id, profesional_id, dia_semana, hora_inicio, hora_fin
- `turnos` → id, profesional_id, cliente_nombre, cliente_email, cliente_telefono,
             servicio_id, fecha, hora_inicio, estado, created_at

---

## Reglas de código — aplicar siempre sin excepción

- JavaScript puro (sin TypeScript, sin JSX en el panel admin)
- Archivos `.js` para lógica pura, `.vue` para componentes Vue, `.astro` para páginas Astro
- `async/await` en lugar de `.then()`
- **Todos los comentarios en español**
- Sin librerías de UI externas (sin Vuetify, sin PrimeVue, sin Tailwind, sin Bootstrap)
- `try/catch` en cada llamada a la API
- Errores del backend siempre con este formato: `{ error: 'mensaje descriptivo en español' }`
- No duplicar componentes, composables ni funciones que ya existen

---

## Comentarios estratégicos en el código — regla obligatoria

En cada archivo generado, dejar comentarios que expliquen el "por qué", no solo el "qué".
Son para que cualquier programador que abra el archivo entienda las decisiones tomadas.

**Dónde dejar comentarios estratégicos obligatoriamente:**
- Al inicio de cada archivo: qué hace ese archivo y de qué depende
- En cada función o método no trivial: qué recibe, qué devuelve, por qué existe
- En cada ruta del backend: qué protección tiene y qué devuelve
- En cada store de Pinia: qué estado maneja y quién lo consume
- En cada guardia de rutas: por qué redirige y a dónde
- En el schema.sql: por qué cada campo existe y qué restricciones tiene

**Formato esperado (ejemplo en backend):**
```js
// routes/auth.js
// Maneja el registro y login de profesionales.
// No requiere token JWT — son los únicos endpoints públicos del backend.

// POST /auth/register
// Crea un nuevo profesional. Genera el slug automáticamente desde el nombre.
// El password se hashea con bcrypt antes de guardarse (nunca se guarda en texto plano).
router.post('/register', async (req, res) => { ... })
```

**Formato esperado (ejemplo en Vue store):**
```js
// stores/authStore.js
// Store de Pinia que centraliza el estado de autenticación del profesional.
// Es el equivalente a AuthContext en React.
// Lo consumen: guardia de rutas, Header.vue, cualquier página que necesite saber quién está logueado.
```

---

## Autenticación

- JWT en `localStorage` con clave `"token"`
- Header en cada request protegido: `Authorization: Bearer <token>`
- `profesional_id` en registros: **siempre desde `req.profesional.id` (JWT)**, nunca desde el body
- El authMiddleware verifica el token y adjunta `req.profesional` con los datos del profesional

---

## Diseño visual — estrategia por fases

El diseño sigue una progresión deliberada a lo largo del proyecto:

- **Fase 1 y 2:** Diseño funcional simple. Usar las variables CSS del sistema de diseño
  (colores, tipografía, radios, sombras) pero sin invertir tiempo en perfección visual.
  Prioridad: que funcione y sea usable.

- **Fase 3 (etapa final):** Refinamiento visual completo. Animaciones, micro-interacciones,
  dark mode toggle, ajustes de espaciado, estados hover/focus pulidos.
  El sistema de diseño CSS ya está preparado para esto desde el inicio.

> En fases 1 y 2 no agregar estilos decorativos ni animaciones. El sistema de diseño
> se importa desde el inicio para mantener consistencia, pero los componentes
> se estilizan con lo mínimo necesario para ser funcionales.

---

## Validación al finalizar cada etapa — regla obligatoria

Al terminar cada etapa de trabajo, antes de considerar la tarea completa,
Codex debe ejecutar la siguiente validación y reportar el resultado:

### Checklist de validación (ejecutar en orden)
1. `docker compose up` → todos los servicios levantan sin errores en los logs
2. `npm run build` en `sitio-publico/` → sin errores
3. `npm run build` en `panel-admin/` → sin errores
4. Probar manualmente cada endpoint nuevo con curl o desde el frontend
5. Verificar que los archivos de etapas anteriores no fueron modificados
6. Confirmar que no se instalaron dependencias no autorizadas

### Formato de reporte esperado al finalizar
```
✅ Etapa [N] — [nombre] completada

Validaciones:
✔ docker compose up — OK
✔ build sitio-publico — OK
✔ build panel-admin — OK
✔ endpoints probados — [listar cuáles]
✔ archivos anteriores — sin modificaciones
✔ dependencias — sin cambios no autorizados

Archivos creados en esta etapa:
- [ruta/archivo1.js]
- [ruta/archivo2.vue]

Próximo paso sugerido: [nombre de la siguiente etapa]
```

Si alguna validación falla, Codex debe detener el avance, reportar el error
con detalle y proponer la corrección antes de continuar.

---

## Fase actual: 1 — Infraestructura + Autenticación + Esqueleto funcional

Solo implementar lo definido en el SPEC de la Fase 1.
No agregar features de Fase 2 o Fase 3.
Si algo no está en el SPEC, preguntar antes de implementarlo.
