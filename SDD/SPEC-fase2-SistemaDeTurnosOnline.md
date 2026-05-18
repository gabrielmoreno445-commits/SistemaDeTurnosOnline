# SPEC — Fase 2: SistemaDeTurnosOnline

> **Proyecto:** Sistema de reserva de turnos online para profesionales independientes
> **Fase:** 2 — Experiencia completa + Pulido
> **Fecha:** Mayo 2026
> **Estado:** En planificación — iniciar cuando Fase 1 esté validada al 100%

---

## 1. Descripción de la fase

La Fase 1 entregó un producto funcional de punta a punta: el cliente puede reservar
un turno y el profesional puede verlo y gestionarlo desde su panel.

La Fase 2 convierte ese MVP en una experiencia completa y pulida, atacando tres frentes:

**Frente 1 — Más control para el profesional**
Editar su perfil, bloquear días libres o feriados, ver métricas básicas de su actividad
y filtrar su historial de turnos. El profesional pasa de "ver lo básico" a "gestionar todo".

**Frente 2 — Mejor experiencia para el cliente**
Recibir un email de confirmación al reservar y otro al recibir confirmación del profesional.
Es el primer contacto post-reserva y marca la diferencia entre una herramienta amateur
y una profesional.

**Frente 3 — Polish visual**
Activar todo lo que el sistema de diseño CSS ya tiene preparado desde la Fase 1:
dark mode, animaciones de entrada, micro-interacciones en hover/focus,
y ajuste del diseño para mobile.

---

## 2. Stack tecnológico

| Capa | Tecnología | Novedad en Fase 2 |
|---|---|---|
| Páginas públicas | Astro | Sin cambios de stack |
| Componentes reactivos | Vue.js (islas en Astro) | Sin cambios de stack |
| Panel de administración | Vue.js SPA | Sin cambios de stack |
| Backend | Node.js con Express.js + JWT | Se agrega Nodemailer para emails |
| Notificaciones | Nodemailer (Node) o Python (script) | **Nuevo** |
| Base de datos | MySQL 8 | Se agregan 2 tablas nuevas |
| Entorno | Docker Compose | Sin cambios |

> **Nota sobre las notificaciones:** Nodemailer desde Node es la opción más simple
> porque ya tenemos el servidor corriendo. Python como script separado es opcional
> si el profesor pide aplicar lo visto en clase — ambas opciones están contempladas.

---

## 3. Estructura de carpetas

Solo se agregan carpetas y archivos nuevos. La estructura existente no se toca.

```
SistemaDeTurnosOnline/
├── sitio-publico/
│   └── src/
│       └── vue-components/
│           ├── FormReserva.vue          ← ya existe (Fase 1)
│           └── ConfirmacionReserva.vue  ← nuevo: pantalla post-reserva mejorada
│
├── panel-admin/
│   └── src/
│       ├── ArchivosJS/
│       │   └── api/
│       │       ├── auth.js              ← ya existe
│       │       ├── servicios.js         ← ya existe
│       │       ├── disponibilidad.js    ← ya existe
│       │       ├── turnos.js            ← ya existe
│       │       └── perfil.js            ← nuevo
│       └── ArchivosVue/
│           ├── components/
│           │   ├── NavBar.vue           ← ya existe (agregar link a Perfil)
│           │   ├── MetricaCard.vue      ← nuevo: card de métrica reutilizable
│           │   └── ThemeToggle.vue      ← nuevo: botón dark/light mode
│           ├── composables/
│           │   ├── useAuth.js           ← ya existe
│           │   └── useTheme.js          ← nuevo: manejo del tema
│           └── pages/
│               ├── DashboardPage.vue    ← ya existe (se agrega sección métricas)
│               ├── ServiciosPage.vue    ← ya existe
│               ├── DisponibilidadPage.vue ← ya existe (se agrega bloqueo de fechas)
│               ├── PerfilPage.vue       ← nuevo
│               └── MetricasPage.vue     ← nuevo
│
├── backend/
│   └── routes/
│       ├── auth.js                      ← ya existe
│       ├── servicios.js                 ← ya existe
│       ├── disponibilidad.js            ← ya existe
│       ├── turnos.js                    ← ya existe (se agrega filtros)
│       ├── publico.js                   ← ya existe
│       ├── perfil.js                    ← nuevo
│       └── metricas.js                  ← nuevo
│
├── database/
│   └── schema.sql                       ← se agregan 2 tablas al final
│
└── notificaciones/                      ← nuevo (opcional Python)
    └── enviar_email.py
```

---

## 4. Pantallas nuevas o modificadas

### Panel admin — nuevas
| # | Componente | Ruta Vue | Descripción |
|---|---|---|---|
| 1 | `PerfilPage.vue` | `/perfil` | Editar datos del profesional y cambiar contraseña |
| 2 | `MetricasPage.vue` | `/metricas` | Resumen de actividad: turnos del mes, ingresos, cancelaciones |

### Panel admin — modificadas
| # | Componente | Ruta Vue | Qué cambia |
|---|---|---|---|
| 3 | `DashboardPage.vue` | `/` | Se agregan cards de métricas rápidas arriba de los turnos |
| 4 | `DisponibilidadPage.vue` | `/disponibilidad` | Se agrega sección para bloquear fechas específicas |
| 5 | `NavBar.vue` | — | Se agrega link a Perfil y el botón ThemeToggle |

### Sitio público — modificadas
| # | Componente | Qué cambia |
|---|---|---|
| 6 | `FormReserva.vue` | Al confirmar reserva: mostrar pantalla de éxito mejorada con resumen |

---

## 5. Base de datos

### Modelo completo — Fase 2
```
profesionales  1──N  servicios
profesionales  1──N  disponibilidad
profesionales  1──N  dias_bloqueados   ← nuevo
profesionales  1──N  turnos
turnos         N──1  servicios
```

### Tablas nuevas

#### `dias_bloqueados`
| Campo | Tipo | Notas |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| profesional_id | INT FK | → profesionales.id |
| fecha | DATE NOT NULL | Fecha específica bloqueada |
| motivo | VARCHAR(200) | Opcional: "Feriado", "Vacaciones", etc. |
| created_at | DATETIME | DEFAULT NOW() |

> Cuando un cliente intenta ver horarios para una fecha bloqueada,
> el sitio público muestra "El profesional no atiende este día".

#### `metricas_cache` *(opcional)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| profesional_id | INT FK | → profesionales.id |
| mes | CHAR(7) | Formato: "2026-05" |
| total_turnos | INT | |
| turnos_confirmados | INT | |
| turnos_cancelados | INT | |
| ingresos_estimados | DECIMAL(10,2) | Suma de precios de servicios confirmados |
| updated_at | DATETIME | DEFAULT NOW() |

> Esta tabla es opcional — las métricas también se pueden calcular
> con queries en tiempo real en el endpoint de métricas.
> Se decide al implementar según performance.

### Tablas modificadas

#### `profesionales` — campos nuevos
| Campo | Tipo | Notas |
|---|---|---|
| descripcion | TEXT | Texto libre sobre el profesional (aparece en el sitio público) |
| direccion | VARCHAR(200) | Dirección del consultorio/local (opcional) |

---

## 6. API REST — nuevos endpoints

### Perfil del profesional
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| PUT | `/perfil` | Actualizar nombre, especialidad, teléfono, descripción, dirección | Sí |
| PUT | `/perfil/password` | Cambiar contraseña (requiere password actual) | Sí |

### Métricas
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/metricas/resumen` | Turnos del mes actual: total, confirmados, cancelados, ingresos | Sí |
| GET | `/metricas/proximos` | Próximos 5 turnos confirmados | Sí |

### Días bloqueados
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/dias-bloqueados` | Lista de fechas bloqueadas del profesional | Sí |
| POST | `/dias-bloqueados` | Bloquear una fecha específica | Sí |
| DELETE | `/dias-bloqueados/:id` | Desbloquear una fecha | Sí |

### Turnos — filtros nuevos (modificación de endpoint existente)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/turnos` | Agrega query params: `?estado=`, `?servicio_id=`, `?desde=`, `?hasta=` | Sí |

### Rutas públicas — modificaciones
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/publico/:slug` | Agrega campos: descripcion, direccion | No |
| GET | `/publico/:slug/turnos-ocupados` | Verifica también `dias_bloqueados` | No |
| POST | `/publico/turnos` | Dispara email de confirmación al cliente | No |

---

## 7. Notificaciones por email

### Opción A — Nodemailer desde Node (recomendada)
Instalar `nodemailer` en el backend. Al crear un turno en `POST /publico/turnos`,
enviar un email al cliente con:
- Nombre del profesional
- Servicio reservado
- Fecha y hora
- Dirección (si existe)

Al cambiar estado a `confirmado` en `PUT /turnos/:id/estado`, enviar otro email
avisando la confirmación.

Configuración via variables de entorno en `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tucuenta@gmail.com
EMAIL_PASS=app_password_de_gmail
```

### Opción B — Script Python (si el profesor lo requiere)
Un script `notificaciones/enviar_email.py` que:
- Recibe los datos del turno como argumentos o desde un archivo JSON
- Usa la librería `smtplib` de Python (incluida en la librería estándar)
- Se puede llamar desde Node con `child_process.exec()` o ejecutar manualmente

> Esta opción permite aplicar los conceptos básicos de Python vistos en clase
> en un contexto real y útil del proyecto.

---

## 8. Polish visual — activar el sistema de diseño

Todo el trabajo de pulido visual usa variables CSS ya definidas en Fase 1.
No hay que redefinir colores ni crear nuevas variables — solo activar lo que
el sistema de diseño ya tiene preparado.

### Dark mode
- `ThemeToggle.vue` — botón en el NavBar que alterna entre `light` y `dark`
- `useTheme.js` — composable que maneja el estado del tema en `localStorage`
  y aplica `document.documentElement.setAttribute('data-theme', tema)`
- El CSS ya tiene `[data-theme="dark"]` definido en `global.css` desde Fase 1

### Animaciones
Aplicar las keyframes ya definidas en el sistema de diseño:
- `.animate-in` con `fadeInUp` en cards de turnos y servicios
- Delays escalonados en listas: `style="animation-delay: Xms"`
- Transición suave en cambios de estado de turnos (badge de color)

### Responsive mobile
- NavBar: colapsar en menú hamburguesa en pantallas < 768px
- FormReserva: una columna en mobile, dos en desktop
- Cards de horarios: 2 por fila en mobile, 4 en desktop
- Panel admin: sidebar colapsable en mobile

### Micro-interacciones
- Botones: `transform: scale(0.97)` en active
- Cards de servicios: `translateY(-2px)` en hover
- Inputs: focus ring con `box-shadow` ya definido en el sistema
- Loading states: spinner animado durante llamadas a la API

---

## 9. Tareas — Sprint Fase 2

### Semana 1 — Backend nuevos endpoints
- [ ] **01** Agregar campos `descripcion` y `direccion` a tabla `profesionales` — `DB`
- [ ] **02** Crear tabla `dias_bloqueados` en schema.sql — `DB`
- [ ] **03** `PUT /perfil` y `PUT /perfil/password` — `BE`
- [ ] **04** `GET/POST/DELETE /dias-bloqueados` — `BE`
- [ ] **05** `GET /metricas/resumen` y `GET /metricas/proximos` — `BE`
- [ ] **06** Actualizar `GET /turnos` con filtros por estado, servicio y fechas — `BE`
- [ ] **07** Actualizar `GET /publico/:slug/turnos-ocupados` para verificar dias_bloqueados — `BE`
- [ ] **08** Integrar Nodemailer en `POST /publico/turnos` y `PUT /turnos/:id/estado` — `BE`

### Semana 2 — Panel admin nuevas páginas
- [ ] **09** `PerfilPage.vue` — editar datos y cambiar contraseña — `panel-admin`
- [ ] **10** `MetricasPage.vue` — cards de resumen y próximos turnos — `panel-admin`
- [ ] **11** Actualizar `DashboardPage.vue` con métricas rápidas — `panel-admin`
- [ ] **12** Actualizar `DisponibilidadPage.vue` con sección de días bloqueados — `panel-admin`
- [ ] **13** Actualizar `NavBar.vue` con link a Perfil — `panel-admin`
- [ ] **14** Actualizar filtros en `DashboardPage.vue` (por estado y servicio) — `panel-admin`

### Semana 3 — Polish visual
- [ ] **15** `useTheme.js` composable y `ThemeToggle.vue` — `panel-admin`
- [ ] **16** Dark mode en sitio-publico (mismo sistema de variables) — `sitio-publico`
- [ ] **17** Animaciones `animate-in` en listas de cards — ambos frontends
- [ ] **18** Responsive mobile: NavBar hamburguesa — `panel-admin`
- [ ] **19** Responsive mobile: FormReserva — `sitio-publico`
- [ ] **20** Micro-interacciones en botones y cards — ambos frontends
- [ ] **21** Script Python de emails (opcional) — `notificaciones/`

---

## 10. Decisiones técnicas

- **Nodemailer sobre Python para emails:** menos fricción, mismo entorno Node.
  Python queda como opción adicional para practicar lo visto en clase.
- **Días bloqueados como tabla aparte:** más flexible que un campo en `disponibilidad`.
  Permite bloquear fechas puntuales sin tocar la configuración semanal.
- **Métricas en tiempo real:** queries directas a MySQL, sin tabla de caché en primera instancia.
  Si hay problemas de performance, se agrega `metricas_cache` como optimización.
- **Dark mode con CSS variables:** sin librerías adicionales. El sistema de diseño
  ya tiene todo preparado — solo activar el toggle.
- **responsive sin framework CSS:** usando CSS Grid y Flexbox nativos con
  las variables ya definidas. Sin Bootstrap, sin Tailwind.

---

## 11. Fuera de scope — Fase 2

- Múltiples profesionales gestionados por un administrador central (Fase 3)
- Registro público de nuevos profesionales sin intervención manual (Fase 3)
- Plan de precios y pagos online (Fase 3)
- Deploy en producción / dominio real (Fase 3)
- App mobile nativa
- Recordatorios automáticos 24hs antes del turno
- Integración con Google Calendar
- Sistema de reseñas/calificaciones
- Foto de perfil del profesional
