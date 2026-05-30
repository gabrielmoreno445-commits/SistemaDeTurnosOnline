# SPEC — Fase 3: SistemaDeTurnosOnline

> **Proyecto:** Sistema de reserva de turnos online para profesionales independientes
> **Fase:** 3 — Producto comercializable
> **Fecha:** Mayo 2026
> **Estado:** En planificación — iniciar cuando Fase 2 esté en GitHub

---

## 1. Descripción de la fase

Las Fases 1 y 2 construyeron un producto completo pero "cerrado": para que un
nuevo profesional use el sistema, alguien tiene que registrarlo manualmente y
el sistema vive solo en `localhost`.

La Fase 3 abre el producto al mundo en tres frentes:

**Frente 1 — Registro público y onboarding guiado**
Cualquier profesional puede registrarse solo desde el sitio público y ser guiado
paso a paso para configurar su perfil, servicios y horarios antes de recibir
su primer turno. Sin intervención manual. Sin quedar con el panel vacío sin saber
qué hacer.

**Frente 2 — Deploy en producción**
El sistema deja de vivir en `localhost` y pasa a ser accesible desde internet
con URLs reales. Cualquier persona con el link puede reservar un turno o
acceder al panel admin desde cualquier dispositivo.

**Frente 3 — Mejoras de experiencia**
Foto de perfil del profesional, página pública más atractiva con descripción
completa, y un buscador funcional en la landing para encontrar profesionales
por nombre o especialidad.

---

## 2. Stack tecnológico

| Capa | Tecnología | Novedad en Fase 3 |
|---|---|---|
| Páginas públicas | Astro | Sin cambios de stack |
| Componentes reactivos | Vue.js (islas en Astro) | Sin cambios de stack |
| Panel admin | Vue.js SPA | Sin cambios de stack |
| Backend | Node.js + Express.js + JWT | Endpoint de búsqueda + subida de imágenes |
| Base de datos | MySQL 8 | 1 campo nuevo en profesionales |
| Almacenamiento de imágenes | Multer (Node.js) | **Nuevo** — subida de foto de perfil |
| Deploy backend + DB | Railway | **Nuevo** — plataforma de deploy |
| Deploy sitio público | Vercel | **Nuevo** — deploy Astro |
| Deploy panel admin | Vercel | **Nuevo** — deploy Vue SPA |
| Entorno local | Docker Compose | Sin cambios |

---

## 3. Estructura de carpetas

Solo se agregan archivos nuevos. La estructura existente no se toca.

```
SistemaDeTurnosOnline/
│
├── sitio-publico/
│   └── src/
│       ├── pages/
│       │   ├── index.astro          ← se actualiza: buscador funcional
│       │   ├── [slug].astro         ← se actualiza: foto de perfil
│       │   └── buscar.astro         ← nueva: resultados de búsqueda
│       └── vue-components/
│           └── BuscadorProfesional.vue  ← nueva: isla Vue del buscador
│
├── panel-admin/
│   └── src/
│       ├── ArchivosJS/
│       │   └── api/
│       │       └── onboarding.js    ← nueva
│       └── ArchivosVue/
│           ├── pages/
│           │   └── OnboardingPage.vue   ← nueva: wizard de configuración
│           └── components/
│               └── OnboardingStep.vue  ← nueva: componente de paso
│
├── backend/
│   ├── routes/
│   │   ├── onboarding.js            ← nueva
│   │   └── busqueda.js              ← nueva
│   └── uploads/                     ← nueva: carpeta para fotos de perfil
│       └── .gitkeep
│
├── deploy/                          ← nueva: configs de producción
│   ├── railway.json                 ← config de Railway para el backend
│   ├── vercel-sitio.json            ← config de Vercel para Astro
│   └── vercel-panel.json            ← config de Vercel para Vue
│
└── docker-compose.yml               ← sin cambios (solo para desarrollo local)
```

---

## 4. Pantallas nuevas o modificadas

### Panel admin — nueva
| # | Componente | Ruta Vue | Descripción |
|---|---|---|---|
| 1 | `OnboardingPage.vue` | `/onboarding` | Wizard de 4 pasos post-registro |

### Panel admin — modificada
| # | Componente | Qué cambia |
|---|---|---|
| 2 | `RegisterPage.vue` | Al registrarse exitosamente redirige a `/onboarding` en lugar de `/login` |
| 3 | `PerfilPage.vue` | Se agrega sección para subir foto de perfil |
| 4 | `router/index.js` | Ruta `/onboarding` con lógica especial: solo accesible si `onboarding_completado = false` |

### Sitio público — modificadas
| # | Archivo | Qué cambia |
|---|---|---|
| 5 | `index.astro` | El buscador del header pasa a ser funcional |
| 6 | `[slug].astro` | Muestra foto de perfil si existe |
| 7 | `buscar.astro` | Nueva página de resultados de búsqueda |

---

## 5. Base de datos

### Modelo completo — Fase 3
Sin tablas nuevas. Solo un campo nuevo en `profesionales`:

#### `profesionales` — campo nuevo
| Campo | Tipo | Notas |
|---|---|---|
| foto_url | VARCHAR(255) | Ruta relativa a la imagen subida. Null si no tiene foto |
| onboarding_completado | TINYINT(1) | DEFAULT 0. Pasa a 1 al completar el wizard |

> `onboarding_completado` controla si el profesional ve el wizard al entrar
> al panel por primera vez. Una vez completado, nunca vuelve a aparecer.

---

## 6. API REST — nuevos endpoints

### Onboarding
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/onboarding/estado` | Devuelve si el onboarding está completado | Sí |
| POST | `/onboarding/completar` | Marca el onboarding como completado | Sí |

### Búsqueda pública
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/busqueda?q=termino` | Busca profesionales por nombre o especialidad | No |

> Devuelve array de `{ nombre, especialidad, slug, foto_url }`
> Solo profesionales con `onboarding_completado = 1` aparecen en búsquedas
> (garantiza que tienen al menos un servicio y horario configurados)

### Foto de perfil
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/perfil/foto` | Sube foto de perfil (multipart/form-data) | Sí |
| DELETE | `/perfil/foto` | Elimina la foto actual | Sí |

### Rutas públicas — modificación
| Método | Ruta | Qué cambia |
|---|---|---|
| GET | `/publico/:slug` | Agrega `foto_url` a la respuesta |

---

## 7. Onboarding — flujo detallado

El wizard tiene 4 pasos. El profesional no puede saltearlos
pero sí puede volver al paso anterior.

```
Paso 1 — Bienvenida y perfil
  Campos: nombre, especialidad, descripción, dirección, teléfono
  (precargados con los datos del registro)
  Botón: "Continuar"

Paso 2 — Tus servicios
  Crear al menos 1 servicio (nombre, duración, precio)
  Muestra los servicios creados en tiempo real
  Botón: "Continuar" (habilitado solo si hay al menos 1 servicio)

Paso 3 — Tus horarios
  Agregar al menos 1 bloque de disponibilidad
  Selector de día + hora inicio + hora fin
  Botón: "Continuar" (habilitado solo si hay al menos 1 bloque)

Paso 4 — ¡Listo! Tu página pública
  Muestra el link de la página pública del profesional
  Link clickeable: tudominio.com/:slug
  Botón: "Ir a mi panel" → llama a POST /onboarding/completar
         y redirige al Dashboard
```

**Lógica de la guardia de onboarding en el router:**
- Al loguearse: llamar a `GET /onboarding/estado`
- Si `completado = false` → redirigir a `/onboarding`
- Si `completado = true` → dejar pasar normalmente
- La ruta `/onboarding` no es accesible si `completado = true`
  (redirige al dashboard)

---

## 8. Deploy — arquitectura de producción

```
Cliente (navegador)
      │
      ├── tudominio.vercel.app          → sitio-publico (Astro en Vercel)
      ├── panel.tudominio.vercel.app    → panel-admin (Vue en Vercel)
      └── api.tudominio.railway.app     → backend (Node en Railway)
                                              │
                                        MySQL en Railway
```

### Plataformas elegidas y por qué

**Railway** para backend + MySQL
- Soporta deploy desde GitHub directamente
- MySQL incluido como plugin (sin configurar servidor aparte)
- Variables de entorno desde el dashboard
- Free tier suficiente para demo/portfolio

**Vercel** para Astro y Vue
- Deploy automático al hacer push a GitHub
- Astro tiene integración oficial con Vercel
- Vue SPA funciona con configuración mínima
- Free tier permanente para proyectos personales

### Variables de entorno en producción

**Railway (backend):**
```
PORT=4000
DB_HOST=[generado por Railway]
DB_USER=[generado por Railway]
DB_PASSWORD=[generado por Railway]
DB_NAME=turnos_db
JWT_SECRET=[clave segura aleatoria]
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=[tu cuenta Gmail]
EMAIL_PASS=[contraseña de aplicación]
FRONTEND_URL=https://panel.tudominio.vercel.app
SITIO_URL=https://tudominio.vercel.app
```

**Vercel (panel-admin):**
```
VITE_API_URL=https://api.tudominio.railway.app
```

**Vercel (sitio-publico):**
```
API_URL=https://api.tudominio.railway.app
```

### Cambios de código para producción

El único cambio de lógica necesario es reemplazar las URLs hardcodeadas:

**En el panel-admin:** todas las llamadas a `http://localhost:4000`
pasan a usar `import.meta.env.VITE_API_URL`

**En el sitio-publico:** el fetch en `[slug].astro` pasa de
`http://backend:4000` (Docker interno) a `import.meta.env.API_URL`

**En el backend:** agregar header CORS para los dominios de Vercel

---

## 9. Foto de perfil — implementación

Librería: **Multer** (middleware de Node.js para multipart/form-data)

```
npm install multer
```

Configuración:
- Destino: `backend/uploads/` (carpeta local en Railway)
- Nombre del archivo: `profesional-{id}-{timestamp}.jpg`
- Tamaño máximo: 2MB
- Tipos aceptados: `image/jpeg`, `image/png`, `image/webp`

La URL pública de la foto se arma como:
```
https://api.tudominio.railway.app/uploads/profesional-1-1234567890.jpg
```

El backend sirve la carpeta `uploads/` como estático:
```js
app.use('/uploads', express.static('uploads'))
```

---

## 10. Buscador de profesionales

**Endpoint:** `GET /busqueda?q=termino`

Busca en `nombre` y `especialidad` con `LIKE %termino%`.
Solo devuelve profesionales con `onboarding_completado = 1`.
Máximo 20 resultados.

**Componente Vue:** `BuscadorProfesional.vue`
- Input de búsqueda reactivo
- Debounce de 400ms antes de hacer el fetch (no llama a la API en cada tecla)
- Muestra resultados como cards clicables
- Click en una card → navega a `/:slug`
- Si no hay resultados: "No encontramos profesionales con ese término"

**Página de resultados:** `buscar.astro`
- Lee el query param `?q=` de la URL
- Hace el fetch al backend en el servidor (como en `[slug].astro`)
- Renderiza los resultados como cards estáticas con link a cada profesional

---

## 11. Tareas — Sprint Fase 3

### Semana 1 — Onboarding
- [ ] **01** Agregar campos `foto_url` y `onboarding_completado` al schema — `DB`
- [ ] **02** `GET /onboarding/estado` y `POST /onboarding/completar` — `BE`
- [ ] **03** Lógica de guardia de onboarding en Vue Router — `panel-admin`
- [ ] **04** `OnboardingPage.vue` con wizard de 4 pasos — `panel-admin`
- [ ] **05** Actualizar `RegisterPage.vue` para redirigir a `/onboarding` — `panel-admin`

### Semana 2 — Foto de perfil y buscador
- [ ] **06** Instalar Multer, crear `POST /perfil/foto` y `DELETE /perfil/foto` — `BE`
- [ ] **07** Agregar sección de foto en `PerfilPage.vue` — `panel-admin`
- [ ] **08** Mostrar foto en `[slug].astro` — `sitio-publico`
- [ ] **09** `GET /busqueda?q=` — `BE`
- [ ] **10** `BuscadorProfesional.vue` con debounce — `sitio-publico`
- [ ] **11** `buscar.astro` — página de resultados — `sitio-publico`
- [ ] **12** Conectar buscador en `index.astro` — `sitio-publico`

### Semana 3 — Deploy
- [ ] **13** Adaptar URLs hardcodeadas a variables de entorno — `panel-admin` + `sitio-publico`
- [ ] **14** Actualizar CORS en backend para dominios de producción — `BE`
- [ ] **15** Crear proyecto en Railway + configurar MySQL + deploy backend — `infra`
- [ ] **16** Deploy `sitio-publico` en Vercel — `infra`
- [ ] **17** Deploy `panel-admin` en Vercel — `infra`
- [ ] **18** Verificar flujo completo en producción — `QA`
- [ ] **19** Actualizar README con URLs de producción — `docs`

---

## 12. Decisiones técnicas

- **Railway sobre Heroku:** Heroku eliminó su free tier. Railway es la alternativa
  más directa para Node.js + MySQL con tier gratuito funcional.
- **Vercel sobre Netlify para Astro:** Vercel tiene integración oficial con Astro
  y detecta el framework automáticamente sin configuración extra.
- **Multer sobre Cloudinary:** Multer es local y sin cuenta externa, ideal para
  demo/portfolio. En un SaaS real se usaría Cloudinary o S3.
- **Debounce en buscador:** evita llamadas a la API en cada tecla. 400ms es
  el balance entre responsividad y carga al servidor.
- **onboarding_completado en DB:** más confiable que localStorage porque
  persiste aunque el profesional cambie de dispositivo o borre el caché.
- **Solo profesionales con onboarding en búsquedas:** garantiza que cualquier
  profesional que aparezca en resultados tiene al menos un servicio y un horario
  configurados — evita páginas públicas vacías.

---

## 13. Fuera de scope — Fase 3

- Plan de precios y pagos online (Stripe, MercadoPago)
- Subdominios personalizados por profesional (`maria.tuapp.com`)
- App mobile nativa
- Panel de superadmin para gestionar todos los profesionales
- Recordatorios automáticos 24hs antes del turno
- Integración con Google Calendar
- Sistema de reseñas y calificaciones
- Estadísticas avanzadas con gráficos
- Exportar turnos a PDF o Excel
