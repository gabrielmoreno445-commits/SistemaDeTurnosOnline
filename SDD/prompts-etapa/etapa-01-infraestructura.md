# Prompt Etapa 1 — Infraestructura, Docker y base de datos

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro (sitio público) + Vue SPA (panel admin) + Node.js/Express + MySQL 8 + Docker Compose
Es la primera etapa — no hay código previo.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- Archivos .js para lógica pura, .vue para componentes, .astro para páginas
- async/await en lugar de .then()
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Errores del backend: { error: 'mensaje descriptivo en español' }
- Comentarios estratégicos en cada archivo (ver sección correspondiente del prompt global)
- profesional_id siempre desde req.profesional.id (JWT), nunca desde el body
- En backend/index.js solo agregar imports y app.use(), nunca reemplazar el archivo completo
```

---

## Contexto de lo que ya existe

Nada. Es el inicio del proyecto. La carpeta `SistemaDeTurnosOnline/` existe vacía
con solo el archivo `.github/copilot-instructions.md` y la carpeta `SDD/`.

---

## Parte A — Estructura de carpetas

### A1 — Crear toda la estructura de carpetas del proyecto

Crear la siguiente estructura completa. Las carpetas vacías deben incluir
un archivo `.gitkeep` para que Git las rastree.

```
SistemaDeTurnosOnline/
├── sitio-publico/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── vue-components/
│       └── layouts/
│
├── panel-admin/
│   └── src/
│       ├── ArchivosJS/
│       │   ├── api/
│       │   └── utils/
│       └── ArchivosVue/
│           ├── components/
│           ├── composables/
│           ├── pages/
│           ├── router/
│           └── stores/
│
├── backend/
│   ├── routes/
│   ├── middleware/
│   └── db/
│
├── database/
│
└── SDD/
    └── prompts-etapa/
```

---

## Parte B — Docker Compose

### B1 — Crear `docker-compose.yml` en la raíz del proyecto

El archivo debe definir cuatro servicios que levanten con un solo `docker compose up`:

**Servicio `db`** (MySQL 8)
- Imagen: `mysql:8`
- Variables de entorno: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE` (valor: `turnos_db`),
  `MYSQL_USER` (valor: `turnos_user`), `MYSQL_PASSWORD`
- Volumen persistente para los datos: `mysql_data:/var/lib/mysql`
- Volumen para ejecutar el schema al iniciar: `./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql`
- Puerto expuesto: `3306:3306`
- Healthcheck para que los otros servicios esperen a que MySQL esté listo

**Servicio `backend`** (Node.js)
- Build desde `./backend`
- Puerto: `4000:4000`
- Variables de entorno: todas las de conexión a DB + `JWT_SECRET` + `PORT=4000`
- `depends_on` con condición `service_healthy` apuntando al servicio `db`
- Volumen de desarrollo: `./backend:/app` con `node_modules` excluido
- Comando: `npm run dev`

**Servicio `panel-admin`** (Vue SPA con Vite)
- Build desde `./panel-admin`
- Puerto: `5173:5173`
- Volumen de desarrollo: `./panel-admin:/app` con `node_modules` excluido
- Comando: `npm run dev -- --host`

**Servicio `sitio-publico`** (Astro)
- Build desde `./sitio-publico`
- Puerto: `4321:4321`
- Volumen de desarrollo: `./sitio-publico:/app` con `node_modules` excluido
- Comando: `npm run dev -- --host`

Incluir al final la definición del volumen nombrado `mysql_data`.

### B2 — Crear `Dockerfile` para el backend en `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
```

### B3 — Crear `Dockerfile` para el panel-admin en `panel-admin/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

### B4 — Crear `Dockerfile` para el sitio-publico en `sitio-publico/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4321
CMD ["npm", "run", "dev", "--", "--host"]
```

---

## Parte C — Base de datos

### C1 — Crear `database/schema.sql`

El archivo debe contener comentarios estratégicos explicando cada tabla y cada campo.
Estructura requerida:

```sql
-- schema.sql
-- Base de datos del sistema de turnos online.
-- Este archivo se ejecuta automáticamente al levantar el contenedor MySQL por primera vez.
-- Para reiniciar desde cero: docker compose down -v && docker compose up

CREATE DATABASE IF NOT EXISTS turnos_db;
USE turnos_db;

-- Tabla profesionales
-- Almacena los usuarios del panel admin (los profesionales independientes).
-- El campo slug define la URL pública del profesional: tudominio.com/:slug
-- Ejemplo de slug: "maria-garcia" generado desde el nombre "María García"
CREATE TABLE IF NOT EXISTS profesionales (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nombre          VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  slug            VARCHAR(100)  NOT NULL UNIQUE,
  especialidad    VARCHAR(150),
  telefono        VARCHAR(30),
  created_at      DATETIME      DEFAULT NOW()
);
```

---

## Parte D — Backend base

### D1 — Inicializar proyecto Node en `backend/`

Ejecutar `npm init -y` y luego instalar las dependencias necesarias para esta etapa:
- `express` — servidor web
- `mysql2` — driver para MySQL (usar la versión con soporte de promesas)
- `dotenv` — variables de entorno
- `nodemon` — recarga automática en desarrollo (como devDependency)

Agregar en `package.json` los scripts:
```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}
```

### D2 — Crear `backend/.env`

```
PORT=4000
DB_HOST=db
DB_PORT=3306
DB_USER=turnos_user
DB_PASSWORD=turnos_password
DB_NAME=turnos_db
JWT_SECRET=clave_secreta_cambiar_en_produccion
```

Crear también `backend/.env.example` con los mismos campos pero sin valores sensibles,
y agregar `.env` al `backend/.gitignore`.

### D3 — Crear `backend/db/connection.js`

Módulo que exporta un pool de conexiones a MySQL usando `mysql2/promise`.
Debe incluir comentarios estratégicos explicando por qué se usa pool en lugar de
una conexión simple, y cómo se consumen las conexiones desde las rutas.

```js
// db/connection.js
// Crea y exporta un pool de conexiones a MySQL.
// Se usa pool (y no conexión única) para manejar múltiples requests simultáneos
// sin bloquear el servidor. Cada ruta toma una conexión del pool cuando la necesita
// y la devuelve automáticamente al terminar.
```

### D4 — Crear `backend/index.js`

Servidor Express base con:
- Carga de variables de entorno con `dotenv`
- Middleware `express.json()` para parsear el body
- Middleware de CORS para permitir requests desde `localhost:5173` y `localhost:4321`
- Ruta de salud: `GET /health` que devuelve `{ status: 'ok', proyecto: 'SistemaDeTurnosOnline' }`
- El servidor escucha en el `PORT` definido en `.env`
- Comentario estratégico al inicio explicando la estructura del archivo y cómo agregar rutas

```js
// index.js
// Punto de entrada del servidor Express.
// Para agregar una nueva entidad: importar su router y registrarlo con app.use()
// NUNCA reemplazar este archivo completo — solo agregar imports y app.use() al final de la lista
```

### D5 — Instalar CORS

```
npm install cors
```

---

## Parte E — Setup inicial de frontends

### E1 — Inicializar proyecto Astro en `sitio-publico/`

Ejecutar el comando de creación de Astro con la plantilla mínima:
```
npm create astro@latest . -- --template minimal --no-install --no-git
```
Luego instalar dependencias con `npm install`.

Agregar la integración de Vue para que Astro pueda usar componentes `.vue`:
```
npx astro add vue
```

Esto modifica automáticamente `astro.config.mjs` para incluir el plugin de Vue.

### E2 — Inicializar proyecto Vue SPA en `panel-admin/`

Ejecutar la creación con Vite:
```
npm create vite@latest . -- --template vue
```
Luego instalar dependencias:
```
npm install
npm install vue-router pinia
```

---

## Qué NO hacer en esta etapa

- No crear rutas de autenticación todavía (eso es Etapa 2)
- No crear componentes Vue ni páginas Astro con contenido real (solo el setup)
- No instalar Vuetify, PrimeVue, Tailwind, Bootstrap ni ninguna librería de UI
- No crear el `authMiddleware.js` todavía
- No tocar la estructura de carpetas una vez creada
- No anticipar tablas de Fase 2 (`turnos`, `servicios`, `disponibilidad`)

---

## Cómo validar que esta etapa está completa

Ejecutar en orden y verificar cada resultado:

1. `docker compose up` desde la raíz → los cuatro servicios levantan sin errores en los logs
2. `curl http://localhost:4000/health` → devuelve `{ "status": "ok", "proyecto": "SistemaDeTurnosOnline" }`
3. `http://localhost:4321` en el navegador → página de Astro visible (puede ser la de bienvenida por defecto)
4. `http://localhost:5173` en el navegador → página de Vue visible (puede ser la de bienvenida por defecto)
5. Conectarse a MySQL con cualquier cliente (TablePlus, DBeaver, MySQL Workbench) en `localhost:3306` con las credenciales del `.env` → la base `turnos_db` existe y tiene la tabla `profesionales`
6. Detener con `docker compose down` → sin errores
7. Volver a levantar con `docker compose up` → los datos de la DB persisten (gracias al volumen)

### Reporte de validación esperado al terminar

```
✅ Etapa 1 — Infraestructura completada

Validaciones:
✔ docker compose up — 4 servicios OK
✔ GET /health — { status: 'ok' }
✔ sitio-publico en :4321 — visible
✔ panel-admin en :5173 — visible
✔ MySQL — turnos_db y tabla profesionales creadas
✔ docker compose down && up — datos persistentes

Archivos creados en esta etapa:
- docker-compose.yml
- backend/Dockerfile
- backend/.env + .env.example + .gitignore
- backend/package.json
- backend/index.js
- backend/db/connection.js
- database/schema.sql
- sitio-publico/ (setup Astro + integración Vue)
- panel-admin/ (setup Vue + Vue Router + Pinia)
- [carpetas con .gitkeep]

Próximo paso: Etapa 2 — Autenticación backend (register, login, authMiddleware)
```

---

## Notas para el orden de implementación

El orden importa en esta etapa:

1. **Primero las carpetas** (Parte A) — todo lo demás necesita saber dónde vivir
2. **Luego el schema.sql** (Parte C) — Docker lo necesita para inicializar MySQL
3. **Luego el docker-compose.yml** (Parte B) — necesita el schema ya escrito
4. **Luego el backend base** (Parte D) — para poder probar `/health` apenas levante Docker
5. **Por último los frontends** (Parte E) — son independientes, pero conviene tenerlos al final para verificar que los tres servicios conviven bien

No ejecutar `docker compose up` hasta haber creado el `schema.sql` y el `backend/index.js`.
MySQL intentará ejecutar el schema al primer arranque — si el archivo no existe, el contenedor falla.
