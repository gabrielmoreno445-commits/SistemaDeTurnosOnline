# SPEC — Fase 1: SistemaDeTurnosOnline

> **Proyecto:** Sistema de reserva de turnos online para profesionales independientes
> **Fase:** 1 — Infraestructura + Autenticación + Esqueleto funcional
> **Fecha:** Mayo 2026
> **Estado:** En planificación

---

## 1. Descripción del proyecto

Aplicación web que permite a profesionales independientes (peluqueros, dentistas,
psicólogos, masajistas, etc.) tener una página pública donde sus clientes pueden
ver los turnos disponibles y reservar uno, sin necesidad de contactar por WhatsApp.

El profesional accede a un panel de administración para ver y gestionar sus turnos.

**Quién usa qué:**
- **Cliente final** → entra al link público del profesional, ve disponibilidad y reserva
- **Profesional** → se loguea en el panel admin, ve sus turnos del día y puede gestionarlos

Esta fase cubre únicamente la infraestructura base, autenticación del profesional,
y el esqueleto navegable de ambas partes (pública y admin). Sin datos reales de turnos aún.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Páginas públicas | Astro (genera HTML estático, carga rápida) |
| Componentes reactivos en páginas públicas | Vue.js (dentro de Astro como isla interactiva) |
| Panel de administración | Vue.js SPA (Vue Router, Pinia, Composables) |
| Backend | Node.js con Express.js, autenticación con JWT |
| Base de datos | MySQL 8 |
| Entorno de desarrollo | Docker Compose |
| Asistente de código | Codex en VS Code |

> **Nota para el aprendizaje:** Vue.js usa conceptos equivalentes a lo aprendido en React.
> `Vue Router` ≈ `React Router` · `Pinia` ≈ `React Context` · `Composables` ≈ `Custom Hooks`

---

## 3. Estructura de carpetas

```
SistemaDeTurnosOnline/
├── sitio-publico/               ← Astro (lo que ve el cliente)
│   ├── src/
│   │   ├── pages/               ← rutas de Astro (.astro)
│   │   │   └── [slug].astro     ← página pública del profesional
│   │   ├── components/          ← componentes .astro reutilizables
│   │   ├── vue-components/      ← componentes .vue que Astro incrusta
│   │   │   └── FormReserva.vue  ← (se construye en Fase 2)
│   │   └── layouts/
│   │       └── Layout.astro
│   ├── public/                  ← assets estáticos
│   └── astro.config.mjs
│
├── panel-admin/                 ← Vue SPA (lo que ve el profesional)
│   ├── src/
│   │   ├── ArchivosJS/
│   │   │   ├── api/             ← funciones fetch al backend (una por entidad)
│   │   │   └── utils/           ← funciones auxiliares puras
│   │   ├── ArchivosVue/
│   │   │   ├── components/      ← componentes reutilizables .vue
│   │   │   ├── composables/     ← lógica reutilizable (equiv. custom hooks)
│   │   │   ├── pages/           ← una página por pantalla .vue
│   │   │   ├── router/          ← index.js con rutas y guardia de auth
│   │   │   ├── stores/          ← Pinia stores (equiv. Context)
│   │   │   │   └── authStore.js
│   │   │   └── App.vue
│   │   └── main.js
│   └── vite.config.js
│
├── backend/                     ← Node.js + Express
│   ├── routes/                  ← un archivo por entidad
│   │   └── auth.js
│   ├── middleware/
│   │   └── authMiddleware.js    ← verifica JWT en cada request protegido
│   ├── db/
│   │   └── connection.js        ← conexión a MySQL
│   └── index.js                 ← entrada del servidor
│
├── database/
│   └── schema.sql               ← tablas del proyecto
│
├── SDD/                         ← documentación (este SPEC y los prompts)
│   ├── SPEC-fase1.md
│   ├── prompt-global.md
│   └── prompts-etapa/
│
└── docker-compose.yml           ← levanta todo con un comando
```

---

## 4. Pantallas — Fase 1

### Sitio público (Astro)
| # | Archivo | Ruta | Descripción |
|---|---|---|---|
| 1 | `index.astro` | `/` | Landing general de la plataforma |
| 2 | `[slug].astro` | `/:slug` | Página pública del profesional (esqueleto vacío en Fase 1) |

### Panel admin (Vue SPA)
| # | Componente | Ruta Vue | Descripción |
|---|---|---|---|
| 1 | `Login.vue` | `/login` | Formulario de acceso con email y contraseña |
| 2 | `Register.vue` | `/register` | Registro de nuevo profesional |
| 3 | `Dashboard.vue` | `/` | Pantalla principal del panel (vacía en Fase 1, muestra "bienvenido") |

> En Fase 1 el panel muestra el esqueleto navegable con rutas funcionando y auth activa.
> Los datos de turnos y servicios se agregan en Fase 2.

---

## 5. Base de datos

### Modelo — Fase 1
```
profesionales  1──N  turnos   (Fase 2)
profesionales  1──N  servicios  (Fase 2)
```
En esta fase solo se crea la tabla `profesionales`. Las demás se agregan en el SPEC 2.

### Tablas

#### `profesionales`
| Campo | Tipo | Notas |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| nombre | VARCHAR(100) | nombre visible al público |
| email | VARCHAR(150) | UNIQUE, se usa para el login |
| password_hash | VARCHAR(255) | bcrypt |
| slug | VARCHAR(100) | UNIQUE, define la URL pública ej: `/maria-garcia` |
| especialidad | VARCHAR(150) | ej: "Peluquería", "Odontología" |
| telefono | VARCHAR(30) | opcional |
| created_at | DATETIME | DEFAULT NOW() |

> `slug` es el identificador único de la URL pública del profesional.
> Se genera automáticamente desde el nombre al registrarse (ej: "María García" → "maria-garcia").

---

## 6. API REST — Fase 1

### Autenticación
| Método | Ruta | Descripción | Auth requerida |
|---|---|---|---|
| POST | `/auth/register` | Registrar nuevo profesional | No |
| POST | `/auth/login` | Login → devuelve JWT | No |
| GET | `/auth/me` | Devuelve datos del profesional logueado | Sí |

> Todas las rutas excepto `/auth/register` y `/auth/login`
> requieren header `Authorization: Bearer <token>`

### Respuesta de `/auth/login` (ejemplo)
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

### Errores — formato estándar
```json
{ "error": "mensaje descriptivo en español" }
```

---

## 7. Tareas — Sprint Fase 1

### Semana 1 — Infraestructura y base de datos
- [ ] **01** Estructura de carpetas completa del proyecto — `infra`
- [ ] **02** `docker-compose.yml` con servicios: backend, mysql, panel-admin, sitio-publico — `infra`
- [ ] **03** `database/schema.sql` con tabla `profesionales` — `DB`
- [ ] **04** `backend/db/connection.js` conexión a MySQL — `BE`
- [ ] **05** `POST /auth/register` y `POST /auth/login` con bcrypt + JWT — `BE`
- [ ] **06** `GET /auth/me` con authMiddleware — `BE`

### Semana 2 — Frontend esqueleto
- [ ] **07** Setup de Astro con integración Vue habilitada — `sitio-publico`
- [ ] **08** `Layout.astro` con sistema de diseño CSS (variables, dark mode, tipografía) — `sitio-publico`
- [ ] **09** `index.astro` — landing simple de la plataforma — `sitio-publico`
- [ ] **10** `[slug].astro` — página vacía del profesional (solo título y slug) — `sitio-publico`
- [ ] **11** Setup de Vue SPA con Vite + Vue Router + Pinia — `panel-admin`
- [ ] **12** `authStore.js` en Pinia (login, logout, restaurar sesión desde localStorage) — `panel-admin`
- [ ] **13** Guardia de rutas en Vue Router (redirige a `/login` si no hay token) — `panel-admin`
- [ ] **14** `Login.vue` y `Register.vue` con llamada al backend — `panel-admin`
- [ ] **15** `Dashboard.vue` — pantalla de bienvenida con nombre del profesional — `panel-admin`

---

## 8. Decisiones técnicas

- **JWT:** Token en `localStorage` con clave `"token"`, enviado como header `Authorization: Bearer` en cada request protegido
- **profesional_id:** Siempre extraído del JWT en el backend (`req.profesional.id`), nunca desde el body del request
- **slug:** Se genera en el backend al registrarse, el profesional no lo escribe manualmente en Fase 1
- **Astro + Vue:** Astro maneja las páginas públicas como HTML estático. Vue se "incrusta" como isla interactiva solo donde hace falta interactividad (en Fase 1 no hay islas Vue aún en el sitio público)
- **Pinia vs Vuex:** Se usa Pinia porque es el store oficial recomendado en Vue 3 (más simple que Vuex)
- **Docker Compose:** Levanta backend + MySQL + panel-admin + sitio-publico con un solo `docker compose up`
- **Sin TypeScript:** JavaScript puro en todo el proyecto
- **Sin librerías de UI externas:** Todo el diseño con las variables CSS del sistema de diseño propio

---

## 9. Fuera de scope — Fase 1

- Gestión de turnos (Fase 2)
- Formulario de reserva para el cliente (Fase 2)
- Configuración de horarios del profesional (Fase 2)
- Listado de servicios/precios (Fase 2)
- Editar perfil del profesional (Fase 3)
- Cancelación de turnos (Fase 3)
- Notificaciones por email (Fase 3)
- Dark mode toggle (Fase 3)
- Filtros y búsqueda (Fase 3)
- Roles (hay un único rol: profesional)
