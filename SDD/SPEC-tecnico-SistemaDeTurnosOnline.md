# SPEC TECNICO - SistemaDeTurnosOnline

> Proyecto: Sistema de turnos online para profesionales independientes
> Tipo: Especificacion tecnica
> Estado: Vigente

## 1. Objetivo tecnico

Definir como esta construido el sistema, como se despliega y como se mantienen sus datos y rutas.

## 2. Arquitectura

El proyecto se divide en tres superficies principales:

1. `sitio-publico` - Astro para la experiencia publica.
2. `panel-admin` - Vue SPA para la gestion del profesional.
3. `backend` - Node.js + Express + MySQL para la logica central.

Existe ademas un modo demo local que reemplaza llamadas al backend por datos en memoria cuando se activa `?demo=1`.

## 3. Stack

- Frontend publico: Astro.
- Frontend admin: Vue 3 + Vue Router + Pinia.
- Backend: Node.js + Express.
- Base de datos: MySQL 8.
- Estilos: CSS propio con variables globales.
- Persistencia de sesion: `localStorage`.
- Demo local: datos mock en memoria.
- Build tooling: Vite en el panel admin.
- Contenedores: Docker Compose para entorno local.

## 4. Estructura tecnica

### 4.1 `sitio-publico`

- `src/pages`
- `src/vue-components`
- `src/layouts`
- `src/styles`

### 4.2 `panel-admin`

- `src/ArchivosJS/api`
- `src/ArchivosJS/utils`
- `src/ArchivosJS/demoMode.js`
- `src/ArchivosJS/demoData.js`
- `src/ArchivosVue/router`
- `src/ArchivosVue/stores`
- `src/ArchivosVue/composables`
- `src/ArchivosVue/components`
- `src/ArchivosVue/pages`
- `src/main.js`

### 4.3 `backend`

- `routes`
- `middleware`
- `utils`
- `db`

## 5. Flujo tecnico de autenticacion

### 5.1 Normal

1. El usuario hace login.
2. El backend devuelve JWT.
3. El token se guarda en `localStorage`.
4. El router restaura la sesion al recargar.
5. El backend valida el header `Authorization: Bearer`.

### 5.2 Demo local

1. La URL activa `?demo=1`.
2. Se persiste el flag demo en `localStorage`.
3. El login consulta funciones demo en lugar del backend.
4. Se guarda un token falso `demo-token`.
5. El store restaura la sesion con datos locales.

## 6. Datos y persistencia

### 6.1 Entidades principales

- profesionales
- servicios
- disponibilidad
- dias_bloqueados
- turnos

### 6.2 Campos clave

- `slug`
- `foto_url`
- `onboarding_completado`
- `descripcion`
- `direccion`
- `zona_cobertura`

### 6.3 Estrategia de datos demo

- `panel-admin/src/ArchivosJS/demoData.js` contiene el estado mock.
- `sitio-publico/src/demoData.js` contiene los datos demo del sitio publico.
- Las APIs del panel y del sitio desvían a datos locales cuando la demo esta activa.

## 7. Rutas tecnicas

### 7.1 Panel admin

- `/`
- `/login`
- `/register`
- `/onboarding`
- `/servicios`
- `/disponibilidad`
- `/perfil`
- `/metricas`

### 7.2 Sitio publico

- `/`
- `/buscar`
- `/:slug`
- `/tu-necesidad`

## 8. API backend

### 8.1 Autenticacion

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### 8.2 Perfil

- `GET /perfil`
- `PUT /perfil`
- `PUT /perfil/password`
- `POST /perfil/foto`
- `DELETE /perfil/foto`

### 8.3 Servicios

- `GET /servicios`
- `POST /servicios`
- `PUT /servicios/:id`
- `DELETE /servicios/:id`

### 8.4 Disponibilidad

- `GET /disponibilidad`
- `POST /disponibilidad`
- `DELETE /disponibilidad/:id`

### 8.5 Dias bloqueados

- `GET /dias-bloqueados`
- `POST /dias-bloqueados`
- `DELETE /dias-bloqueados/:id`

### 8.6 Turnos

- `GET /turnos`
- `PUT /turnos/:id/estado`

### 8.7 Metricas

- `GET /metricas/resumen`
- `GET /metricas/proximos`

### 8.8 Publico

- `GET /publico/:slug`
- `GET /publico/:slug/servicios`
- `GET /publico/:slug/disponibilidad`
- `GET /publico/:slug/turnos-ocupados`
- `POST /publico/turnos`
- `GET /busqueda`

## 9. Variables de entorno

### 9.1 Backend

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

### 9.2 Panel admin

- `VITE_API_URL`
- `VITE_SITIO_PUBLICO_URL`

### 9.3 Sitio publico

- `API_URL`

## 10. Despliegue local

### Docker Compose

- `db`
- `backend`
- `panel-admin`
- `sitio-publico`

El objetivo del entorno local es permitir desarrollo completo con un solo comando.

### Demo sin Docker

El panel admin y el sitio publico pueden probarse en modo demo aun sin levantar backend ni base de datos.

## 11. Despliegue de produccion

- Backend y MySQL: Railway.
- Sitio publico: Vercel.
- Panel admin: Vercel.

## 12. Limpieza y versionado

- No versionar `dist`.
- No versionar `.tmp-edge-profile`.
- No versionar `.vite`, `.astro` ni `node_modules`.
- Versionar solo `*.env.example`, no los `.env` reales.

## 13. Criterios tecnicos de calidad

- La app no debe romper si falla un fetch.
- Las utilidades de almacenamiento deben tolerar `localStorage` no disponible.
- El dashboard debe poder montar sin depender de Docker.
- La demo debe producir una experiencia equivalente al flujo real, aunque con datos mock.

