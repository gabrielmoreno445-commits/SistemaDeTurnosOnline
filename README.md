# SistemaDeTurnosOnline

Sistema web de reserva de turnos para profesionales independientes. El proyecto combina:

- Sitio publico en Astro con una experiencia de busqueda y reserva
- Panel administrativo en Vue 3 + Pinia
- Backend en Node.js + Express
- Base de datos MySQL
- Entorno Docker Compose para levantar todo el stack

El estado actual del proyecto contempla dos formas de uso:

1. Modo real con Docker, usando backend y MySQL.
2. Modo demo sin Docker, para revisar la interfaz y el flujo academico sin depender de servicios externos.

## Estado actual

- El sitio publico funciona en modo real y en modo demo.
- El panel admin funciona en modo real y en modo demo.
- La base de datos del contenedor Docker es independiente de la MySQL local de Windows.
- El login de demo usa credenciales de prueba y no requiere Docker.

## Credenciales de demo

Usar estas credenciales cuando el modo demo este activo:

- Email: `maria@test.com`
- Contraseña: `12345`

Para activar demo en el panel:

- `http://localhost:5173/login?demo=1`

Para activar demo en el sitio publico:

- `http://localhost:4321/?demo=1`
- `http://localhost:4321/tu-necesidad?demo=1`
- `http://localhost:4321/buscar?q=Maria&demo=1`
- `http://localhost:4321/maria-garcia?demo=1`

## URLs locales

### Con Docker

- Sitio publico: `http://localhost:4321`
- Panel admin: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check backend: `http://localhost:4000/health`
- MySQL: `localhost:3306`

### Sin Docker

Si levantaste cada app por separado en tu maquina:

- Sitio publico: `http://127.0.0.1:4321`
- Panel admin: `http://127.0.0.1:5173` o el puerto disponible que indique Vite
- Backend: `http://127.0.0.1:4000`

## Requisitos

### Para correr con Docker

- Docker Desktop instalado y en ejecucion
- Puertos `4000`, `4321`, `5173` y `3306` disponibles

### Para correr sin Docker

- Node.js instalado en cada subproyecto
- npm instalado
- Backend configurado si queres usar modo real

## Como levantar el proyecto con Docker

```bash
docker compose up -d
```

Verificar contenedores:

```bash
docker compose ps
```

Detener el stack:

```bash
docker compose down
```

Detener y borrar datos de la base de datos del contenedor:

```bash
docker compose down -v
```

## Como correr la demo sin Docker

La demo no depende del backend real para las pantallas principales.

### Panel admin

1. Ir a `panel-admin`
2. Ejecutar:

```bash
npm install
npm run dev
```

3. Abrir:

```text
http://localhost:5173/login?demo=1
```

### Sitio publico

1. Ir a `sitio-publico`
2. Ejecutar:

```bash
npm install
npm run dev
```

3. Abrir una URL con `demo=1`, por ejemplo:

```text
http://localhost:4321/?demo=1
```

## Variables de entorno

### Backend

Copiar `backend/.env.example` a `backend/.env`.

```env
PORT=4000
DB_HOST=db
DB_PORT=3306
DB_USER=turnos_user
DB_PASSWORD=turnos_password
DB_NAME=turnos_db
JWT_SECRET=cambiar_por_clave_segura

# URLs de los frontends permitidos por CORS
FRONTEND_URL=http://localhost:5173
SITIO_URL=http://localhost:4321

# Email opcional
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tucuenta@gmail.com
EMAIL_PASS=contrasena_de_aplicacion_gmail
EMAIL_FROM=SistemaDeTurnos <tucuenta@gmail.com>
```

Si las variables de email no estan configuradas, el sistema sigue funcionando y solo se omiten los envios.

### Panel admin

Copiar `panel-admin/.env.example` a `panel-admin/.env`:

```env
VITE_API_URL=URL_del_backend_en_Railway_o_http://localhost:4000
VITE_SITIO_PUBLICO_URL=http://localhost:4321
```

### Sitio publico

Copiar `sitio-publico/.env.example` a `sitio-publico/.env`:

```env
API_URL=http://backend:4000
PUBLIC_API_URL=http://localhost:4000
```

## Estructura del proyecto

```text
SistemaDeTurnosOnline/
├── sitio-publico/          Sitio publico en Astro + Vue
├── panel-admin/            Panel administrativo en Vue 3 + Pinia
├── backend/                API REST en Node.js + Express
├── database/               Schema SQL inicial
├── deploy/                 Instrucciones de despliegue
├── SDD/                    Documentacion tecnica y prompts
└── docker-compose.yml      Orquestacion local
```

## Funcionalidades principales

### Sitio publico

- Busqueda de profesionales
- Perfil publico por slug
- Reserva de turnos
- Seleccion de fecha, horario y modalidad
- Modo demo para pruebas academicas

### Panel admin

- Registro e inicio de sesion
- Dashboard con agenda y resumen
- Gestion de servicios
- Gestion de disponibilidad
- Bloqueo de dias
- Edicion de perfil
- Cambio de contraseña
- Metricas basicas
- Modo demo sin backend real

## API principal

### Autenticacion

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Servicios

- `GET /servicios`
- `POST /servicios`
- `PUT /servicios/:id`
- `DELETE /servicios/:id`

### Disponibilidad

- `GET /disponibilidad`
- `POST /disponibilidad`
- `DELETE /disponibilidad/:id`

### Turnos

- `GET /turnos`
- `PUT /turnos/:id/estado`

### Perfil

- `GET /perfil`
- `PUT /perfil`
- `PUT /perfil/password`

### Metricas

- `GET /metricas/resumen`
- `GET /metricas/proximos`

### Dias bloqueados

- `GET /dias-bloqueados`
- `POST /dias-bloqueados`
- `DELETE /dias-bloqueados/:id`

### Publico

- `GET /publico/:slug`
- `GET /publico/:slug/servicios`
- `GET /publico/:slug/disponibilidad`
- `GET /publico/:slug/turnos-ocupados`
- `POST /publico/turnos`

## Base de datos

Tablas principales:

- `profesionales`
- `servicios`
- `disponibilidad`
- `turnos`
- `dias_bloqueados`

El schema esta en `database/schema.sql` y se aplica automaticamente cuando el contenedor MySQL se inicializa por primera vez.

Importante:

- El volumen `mysql_data` guarda la base de datos del contenedor.
- Eso no borra tu MySQL local de Windows.
- El puerto `3306` puede generar conflicto si ya tenes otro MySQL corriendo en la maquina.

## Despliegue

El proyecto tambien tiene guias separadas para produccion:

- `deploy/instrucciones-railway.md`
- `deploy/instrucciones-vercel.md`

## Notas tecnicas

- Astro se usa para las paginas publicas.
- Vue se usa para las islas interactivas y para el panel admin.
- Pinia centraliza la sesion del profesional.
- JWT se guarda en `localStorage` para simplificar la SPA.
- El envio de email es opcional y no interrumpe el flujo si falta configuracion.

## Autor

Proyecto academico desarrollado como sistema de turnos online para profesionales independientes.
