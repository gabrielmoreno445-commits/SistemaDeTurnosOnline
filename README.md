# SistemaDeTurnosOnline

Sistema web de reserva de turnos para profesionales independientes (peluqueros, psicólogos, odontólogos, masajistas, etc.).

El cliente final reserva un turno desde una página pública sin necesidad de crear una cuenta. El profesional gestiona sus turnos, servicios y horarios desde un panel privado.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Páginas públicas | [Astro](https://astro.build) — HTML estático con carga ultrarrápida |
| Componentes interactivos | [Vue.js](https://vuejs.org) — islas reactivas dentro de Astro (microfrontend) |
| Panel de administración | Vue.js SPA — Vue Router + Pinia + Composables |
| Backend | Node.js + Express.js + JWT |
| Base de datos | MySQL 8 |
| Entorno | Docker Compose |

> **Patrón microfrontend:** Astro genera las páginas públicas como HTML estático. Vue se incrusta solo donde hace falta interactividad, usando la directiva `client:load`. Esto combina el SEO y la velocidad de Astro con la reactividad de Vue.

---

## Estructura del proyecto

```
SistemaDeTurnosOnline/
├── sitio-publico/          # Astro — lo que ve el cliente final
│   └── src/
│       ├── pages/          # [slug].astro — página dinámica por profesional
│       ├── vue-components/ # FormReserva.vue — isla interactiva de reserva
│       └── layouts/
│
├── panel-admin/            # Vue SPA — lo que ve el profesional
│   └── src/
│       ├── ArchivosJS/
│       │   └── api/        # funciones fetch al backend (una por entidad)
│       └── ArchivosVue/
│           ├── pages/      # Dashboard, Servicios, Disponibilidad, Perfil, Métricas
│           ├── stores/     # authStore.js (Pinia)
│           ├── composables/ # useAuth.js, useTheme.js
│           ├── components/ # NavBar, MetricaCard, ThemeToggle
│           └── router/     # Vue Router con guardia de auth
│
├── backend/                # Node.js + Express
│   ├── routes/             # auth, servicios, disponibilidad, turnos, perfil, metricas, publico
│   ├── middleware/         # authMiddleware.js
│   ├── utils/              # email.js (Nodemailer)
│   └── db/                 # connection.js (pool MySQL)
│
├── database/
│   └── schema.sql          # tablas: profesionales, servicios, disponibilidad, turnos, dias_bloqueados
│
├── SDD/                    # Documentación: SPECs y prompts de desarrollo
└── docker-compose.yml
```

---

## Levantar el proyecto

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Puertos `4000`, `4321`, `5173` y `3306` disponibles

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/SistemaDeTurnosOnline.git
cd SistemaDeTurnosOnline

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores (JWT_SECRET, credenciales de email, etc.)

# 3. Levantar todos los servicios
docker compose up -d

# 4. Verificar que todo esté corriendo
docker compose ps
```

| Servicio | URL |
|---|---|
| Sitio público (Astro) | http://localhost:4321 |
| Panel admin (Vue) | http://localhost:5173 |
| API backend | http://localhost:4000 |
| MySQL | localhost:3306 |

```bash
# Detener
docker compose down

# Detener y eliminar datos (resetear DB)
docker compose down -v
```

---

## Variables de entorno

Copiar `backend/.env.example` a `backend/.env` y completar:

```env
PORT=4000
DB_HOST=db
DB_USER=turnos_user
DB_PASSWORD=turnos_password
DB_NAME=turnos_db
JWT_SECRET=cambiar_por_clave_segura

# Email (opcional — requiere contraseña de aplicación de Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tucuenta@gmail.com
EMAIL_PASS=contraseña_de_aplicacion
EMAIL_FROM=SistemaDeTurnos <tucuenta@gmail.com>
```

> Si las variables de email no están configuradas, el sistema funciona normalmente. El fallo de email nunca interrumpe el flujo de reserva.

---

## Funcionalidades

### Sitio público (cliente final)
- Página pública por profesional: `/:slug` (ej: `/maria-garcia`)
- Ver servicios, duración y precio
- Seleccionar fecha y ver horarios disponibles en tiempo real
- Reservar turno sin necesidad de crear cuenta
- Detección automática de días bloqueados por el profesional
- Confirmación por email al reservar (si está configurado)
- Dark mode · Diseño responsive mobile

### Panel de administración (profesional)
- Registro y login con JWT
- Dashboard con turnos del día y métricas rápidas del mes
- Confirmar o cancelar turnos
- Gestión de servicios (crear, editar, desactivar)
- Configuración de horarios de atención por día de la semana
- Bloqueo de fechas específicas (feriados, vacaciones)
- Página de métricas: turnos del mes, ingresos estimados, próximos turnos
- Edición de perfil (nombre, especialidad, descripción, dirección)
- Cambio de contraseña
- Dark mode · Diseño responsive mobile

---

## API — endpoints principales

```
POST   /auth/register          Registro de profesional
POST   /auth/login             Login → JWT
GET    /auth/me                Datos del profesional logueado

GET    /servicios              Listar servicios propios
POST   /servicios              Crear servicio
PUT    /servicios/:id          Editar servicio
DELETE /servicios/:id          Desactivar servicio

GET    /disponibilidad         Ver horarios de atención
POST   /disponibilidad         Agregar bloque horario
DELETE /disponibilidad/:id     Eliminar bloque

GET    /turnos                 Ver turnos (filtros: fecha, estado, servicio, rango)
PUT    /turnos/:id/estado      Cambiar estado del turno

GET    /perfil                 —
PUT    /perfil                 Actualizar datos de perfil
PUT    /perfil/password        Cambiar contraseña

GET    /metricas/resumen       Métricas del mes actual
GET    /metricas/proximos      Próximos 5 turnos confirmados

GET    /dias-bloqueados        Ver fechas bloqueadas
POST   /dias-bloqueados        Bloquear una fecha
DELETE /dias-bloqueados/:id    Desbloquear

── Rutas públicas (sin auth) ──────────────────────────────────
GET    /publico/:slug                        Datos del profesional
GET    /publico/:slug/servicios              Servicios activos
GET    /publico/:slug/disponibilidad         Horarios de atención
GET    /publico/:slug/turnos-ocupados        Horarios ocupados por fecha
POST   /publico/turnos                       Crear reserva
```

> Todas las rutas excepto `/auth/register`, `/auth/login` y `/publico/*` requieren header `Authorization: Bearer <token>`

---

## Base de datos

```
profesionales  1──N  servicios
profesionales  1──N  disponibilidad
profesionales  1──N  dias_bloqueados
profesionales  1──N  turnos
turnos         N──1  servicios
```

El schema completo está en `database/schema.sql` y se aplica automáticamente al levantar el contenedor MySQL por primera vez.

---

## Decisiones técnicas

- **Microfrontend con Astro + Vue:** Astro para SEO y velocidad en páginas públicas. Vue como isla interactiva solo donde hace falta reactividad (formulario de reserva).
- **Pinia sobre Vuex:** store oficial de Vue 3, más simple y con mejor soporte de TypeScript si se migra en el futuro.
- **JWT en localStorage:** solución directa para SPA. En producción evaluar cookies HttpOnly.
- **slug generado automáticamente:** desde el nombre del profesional al registrarse, sin input manual.
- **Fallo silencioso en emails:** el error de Nodemailer se loguea pero nunca interrumpe la respuesta al cliente.
- **Sin TypeScript:** proyecto educativo — JavaScript puro para mantener el foco en los conceptos de stack.

---

## Capturas

> *Agregar capturas de pantalla del sitio público y del panel admin una vez desplegado.*

---

## Autor

Proyecto desarrollado como trabajo práctico integrando Vue.js, Astro (microfrontend), Node.js y MySQL con entorno Docker.
