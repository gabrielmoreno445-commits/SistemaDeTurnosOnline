# Prompt Etapa 3A — Backend de turnos

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Etapas 1 y 2 completadas y funcionando: infraestructura, auth completa, JWT activo.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- async/await en lugar de .then()
- Todos los comentarios en español
- Sin librerías de UI externas
- try/catch en cada llamada a la API
- Errores del backend: { error: 'mensaje descriptivo en español' }
- Comentarios estratégicos en cada archivo nuevo
- profesional_id siempre desde req.profesional.id (JWT), nunca desde el body
- En backend/index.js solo agregar imports y app.use() — no reemplazar el archivo
- No modificar archivos de etapas anteriores salvo backend/index.js para agregar rutas
```

---

## Contexto de lo que ya existe

De etapas anteriores, funcionando y sin tocar:
- `backend/routes/auth.js` — register, login, me
- `backend/middleware/authMiddleware.js` — verifica JWT
- `backend/db/connection.js` — pool de conexiones
- `database/schema.sql` — tabla `profesionales`
- `docker-compose.yml` — 4 servicios corriendo

---

## Parte A — Base de datos: nuevas tablas

### A1 — Agregar tablas al `database/schema.sql`

Agregar al final del archivo existente, sin modificar lo que ya está:

```sql
-- Tabla servicios
-- Cada profesional define los servicios que ofrece (ej: corte, coloración, consulta).
-- El campo activo permite ocultar un servicio sin eliminarlo.
-- duracion_minutos se usa para calcular el bloque de tiempo que ocupa un turno.
CREATE TABLE IF NOT EXISTS servicios (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  profesional_id    INT NOT NULL,
  nombre            VARCHAR(100) NOT NULL,
  duracion_minutos  INT NOT NULL DEFAULT 30,
  precio            DECIMAL(10,2),
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  created_at        DATETIME DEFAULT NOW(),
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

-- Tabla disponibilidad
-- Define los bloques horarios en que el profesional atiende cada día de la semana.
-- dia_semana: 0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado
-- Un profesional puede tener múltiples bloques por día (ej: mañana y tarde).
CREATE TABLE IF NOT EXISTS disponibilidad (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  profesional_id  INT NOT NULL,
  dia_semana      TINYINT NOT NULL,
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

-- Tabla turnos
-- Registra cada reserva hecha por un cliente.
-- cliente_* se almacena directamente porque los clientes no tienen cuenta en el sistema.
-- estado: 'pendiente' al crearse, puede cambiar a 'confirmado' o 'cancelado'.
-- hora_inicio se combina con duracion_minutos del servicio para saber cuándo termina.
CREATE TABLE IF NOT EXISTS turnos (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  profesional_id   INT NOT NULL,
  servicio_id      INT NOT NULL,
  cliente_nombre   VARCHAR(100) NOT NULL,
  cliente_email    VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(30),
  fecha            DATE NOT NULL,
  hora_inicio      TIME NOT NULL,
  estado           ENUM('pendiente','confirmado','cancelado') DEFAULT 'pendiente',
  created_at       DATETIME DEFAULT NOW(),
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);
```

### A2 — Aplicar las nuevas tablas al contenedor MySQL

Las tablas nuevas no se crean automáticamente porque MySQL ya inicializó la base
en la Etapa 1. Para aplicarlas sin reiniciar el volumen, ejecutar:

```bash
docker compose exec db mysql -u turnos_user -pturnos_password turnos_db < database/schema.sql
```

Si da error de permisos, usar el usuario root:
```bash
docker compose exec db mysql -u root -proot_password turnos_db < database/schema.sql
```

Verificar que las tres tablas existen:
```bash
docker compose exec db mysql -u turnos_user -pturnos_password -e "SHOW TABLES;" turnos_db
```

---

## Parte B — Rutas de servicios

### B1 — Crear `backend/routes/servicios.js`

Comentario estratégico al inicio:
```js
// routes/servicios.js
// Gestión de servicios del profesional (corte, consulta, masaje, etc.).
// Todas las rutas requieren autenticación — solo el profesional gestiona sus servicios.
// Los servicios se leen públicamente desde routes/publico.js (sin auth).
```

Endpoints:

**GET `/servicios`** — protegido
- Lista todos los servicios del profesional logueado
- Solo devuelve los activos por defecto: `WHERE profesional_id = ? AND activo = 1`
- Responde con array de servicios

**POST `/servicios`** — protegido
- Crea un nuevo servicio
- Recibe: `{ nombre, duracion_minutos, precio }`
- Valida que `nombre` y `duracion_minutos` no estén vacíos
- `profesional_id` desde `req.profesional.id`
- Responde `201` con el servicio creado

**PUT `/servicios/:id`** — protegido
- Edita nombre, duración o precio de un servicio
- Verificar que el servicio pertenece al profesional logueado antes de editar
- Si no pertenece: `403` con error descriptivo

**DELETE `/servicios/:id`** — protegido
- No elimina físicamente — cambia `activo = 0`
- Verificar que pertenece al profesional logueado
- Responde `200` con `{ mensaje: 'Servicio desactivado' }`

---

## Parte C — Rutas de disponibilidad

### C1 — Crear `backend/routes/disponibilidad.js`

Comentario estratégico al inicio:
```js
// routes/disponibilidad.js
// Define los horarios en que el profesional atiende cada día de la semana.
// El sitio público usa estos datos para mostrar los horarios disponibles al cliente.
// dia_semana: 0=Domingo, 1=Lunes, ..., 6=Sábado
```

Endpoints:

**GET `/disponibilidad`** — protegido
- Devuelve todos los bloques de disponibilidad del profesional logueado
- Ordenados por `dia_semana`, luego `hora_inicio`

**POST `/disponibilidad`** — protegido
- Crea un bloque de disponibilidad
- Recibe: `{ dia_semana, hora_inicio, hora_fin }`
- Valida que los tres campos estén presentes
- Valida que `hora_inicio` sea menor que `hora_fin`
- `profesional_id` desde `req.profesional.id`
- Responde `201` con el bloque creado

**DELETE `/disponibilidad/:id`** — protegido
- Elimina un bloque de disponibilidad
- Verificar que pertenece al profesional logueado

---

## Parte D — Rutas de turnos (admin)

### D1 — Crear `backend/routes/turnos.js`

Comentario estratégico al inicio:
```js
// routes/turnos.js
// Gestión de turnos desde el panel del profesional.
// La creación de turnos por parte del cliente va en routes/publico.js (sin auth).
// Aquí solo el profesional puede ver y cambiar el estado de sus turnos.
```

Endpoints:

**GET `/turnos`** — protegido
- Lista los turnos del profesional logueado
- Acepta query param opcional `?fecha=YYYY-MM-DD` para filtrar por día
- Si no se pasa fecha: devuelve los turnos de hoy
- Incluir en la respuesta: datos del turno + nombre del servicio (JOIN con servicios)
- Ordenar por `hora_inicio ASC`

**PUT `/turnos/:id/estado`** — protegido
- Cambia el estado de un turno: `pendiente` → `confirmado` o `cancelado`
- Recibe: `{ estado }` — validar que sea uno de los tres valores permitidos
- Verificar que el turno pertenece al profesional logueado
- Responde `200` con el turno actualizado

---

## Parte E — Rutas públicas (sin autenticación)

### E1 — Crear `backend/routes/publico.js`

Comentario estratégico al inicio:
```js
// routes/publico.js
// Endpoints públicos consumidos por el sitio Astro — no requieren autenticación.
// Son de solo lectura excepto POST /publico/turnos que crea una reserva.
// El acceso es por slug del profesional, no por id, para no exponer datos internos.
```

Endpoints:

**GET `/publico/:slug`** — sin auth
- Devuelve los datos públicos del profesional (nombre, especialidad, slug)
- NO devolver email, password_hash, created_at
- Si el slug no existe: `404` con `{ error: 'Profesional no encontrado' }`

**GET `/publico/:slug/servicios`** — sin auth
- Lista los servicios activos del profesional con ese slug
- Solo servicios con `activo = 1`

**GET `/publico/:slug/disponibilidad`** — sin auth
- Devuelve los bloques de disponibilidad del profesional

**GET `/publico/:slug/turnos-ocupados`** — sin auth
- Acepta query param requerido `?fecha=YYYY-MM-DD`
- Devuelve los horarios ya ocupados para esa fecha
- Solo turnos con estado `pendiente` o `confirmado` (no los cancelados)
- Responde con array de `{ hora_inicio, duracion_minutos }` para que el frontend
  pueda calcular qué horarios están bloqueados

**POST `/publico/turnos`** — sin auth
- Crea un nuevo turno (la reserva del cliente)
- Recibe: `{ slug, servicio_id, cliente_nombre, cliente_email, cliente_telefono, fecha, hora_inicio }`
- Validar que `slug`, `servicio_id`, `cliente_nombre`, `cliente_email`, `fecha` y `hora_inicio` no estén vacíos
- Resolver el `profesional_id` desde el slug
- Verificar que el servicio pertenece a ese profesional
- Verificar que el horario no esté ya ocupado (no debe haber otro turno con misma fecha y hora_inicio para ese profesional, con estado pendiente o confirmado)
- Si el horario está ocupado: `409` con `{ error: 'El horario seleccionado ya no está disponible' }`
- Insertar con `estado = 'pendiente'`
- Responder `201` con `{ mensaje: 'Turno reservado correctamente', turno_id }`

---

## Parte F — Registrar rutas en `backend/index.js`

Agregar al final de la lista de rutas, sin modificar nada más:

```js
// Rutas de gestión (requieren auth)
const serviciosRoutes = require('./routes/servicios')
const disponibilidadRoutes = require('./routes/disponibilidad')
const turnosRoutes = require('./routes/turnos')
app.use('/servicios', serviciosRoutes)
app.use('/disponibilidad', disponibilidadRoutes)
app.use('/turnos', turnosRoutes)

// Rutas públicas (sin auth — consumidas por el sitio Astro)
const publicoRoutes = require('./routes/publico')
app.use('/publico', publicoRoutes)
```

---

## Qué NO hacer en esta etapa

- No modificar `routes/auth.js`, `authMiddleware.js` ni `connection.js`
- No crear componentes Vue ni páginas Astro (eso es 3B y 3C)
- No agregar campos extra a las tablas definidas
- No implementar notificaciones por email (Fase 3 del proyecto)
- No eliminar turnos físicamente — solo cambiar estado
- No instalar dependencias nuevas salvo que sean estrictamente necesarias

---

## Cómo validar que esta etapa está completa

Ejecutar en orden con `curl.exe` en PowerShell (usar variables `$body` para el JSON):

**Verificar tablas:**
```powershell
docker compose exec db mysql -u turnos_user -pturnos_password -e "SHOW TABLES;" turnos_db
```
→ Debe mostrar: `profesionales`, `servicios`, `disponibilidad`, `turnos`

**Servicios:**
```powershell
# Primero obtener token con login
$body = '{"email":"maria@test.com","password":"123456"}'
curl.exe -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d $body
# Guardar el token en $token

# Crear servicio
$body = '{"nombre":"Corte de cabello","duracion_minutos":30,"precio":1500}'
curl.exe -X POST http://localhost:4000/servicios -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $body
# → 201 con el servicio creado

# Listar servicios
curl.exe http://localhost:4000/servicios -H "Authorization: Bearer $token"
# → array con el servicio creado
```

**Disponibilidad:**
```powershell
$body = '{"dia_semana":1,"hora_inicio":"09:00","hora_fin":"18:00"}'
curl.exe -X POST http://localhost:4000/disponibilidad -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $body
# → 201

curl.exe http://localhost:4000/disponibilidad -H "Authorization: Bearer $token"
# → array con el bloque creado
```

**Rutas públicas:**
```powershell
curl.exe http://localhost:4000/publico/maria-garcia
# → datos públicos del profesional (sin email ni password_hash)

curl.exe http://localhost:4000/publico/maria-garcia/servicios
# → array de servicios activos

curl.exe "http://localhost:4000/publico/maria-garcia/turnos-ocupados?fecha=2026-06-01"
# → array vacío (aún no hay turnos)
```

**Crear turno (reserva del cliente):**
```powershell
$body = '{"slug":"maria-garcia","servicio_id":1,"cliente_nombre":"Juan Perez","cliente_email":"juan@test.com","cliente_telefono":"1234567","fecha":"2026-06-01","hora_inicio":"10:00"}'
curl.exe -X POST http://localhost:4000/publico/turnos -H "Content-Type: application/json" -d $body
# → 201 con { mensaje: 'Turno reservado correctamente', turno_id: 1 }

# Intentar el mismo horario de nuevo
curl.exe -X POST http://localhost:4000/publico/turnos -H "Content-Type: application/json" -d $body
# → 409 con { error: 'El horario seleccionado ya no está disponible' }
```

**Gestión de turno desde el panel:**
```powershell
curl.exe "http://localhost:4000/turnos?fecha=2026-06-01" -H "Authorization: Bearer $token"
# → array con el turno creado, incluyendo nombre del servicio

$body = '{"estado":"confirmado"}'
curl.exe -X PUT http://localhost:4000/turnos/1/estado -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $body
# → 200 con el turno actualizado
```

### Reporte de validación esperado

```
✅ Etapa 3A — Backend de turnos completado

Validaciones:
✔ SHOW TABLES — 4 tablas presentes
✔ POST /servicios — 201, servicio creado
✔ GET /servicios — array con servicios
✔ POST /disponibilidad — 201, bloque creado
✔ GET /disponibilidad — array con bloques
✔ GET /publico/:slug — datos públicos sin campos sensibles
✔ GET /publico/:slug/servicios — servicios activos
✔ GET /publico/:slug/turnos-ocupados — array vacío inicial
✔ POST /publico/turnos — 201, turno creado
✔ POST /publico/turnos (mismo horario) — 409
✔ GET /turnos?fecha — turno con nombre de servicio
✔ PUT /turnos/:id/estado — estado actualizado
✔ archivos anteriores — sin modificaciones
✔ dependencias — sin cambios no autorizados

Archivos creados en esta etapa:
- backend/routes/servicios.js
- backend/routes/disponibilidad.js
- backend/routes/turnos.js
- backend/routes/publico.js
- backend/index.js (solo se agregaron 4 rutas al final)
- database/schema.sql (se agregaron 3 tablas al final)

Próximo paso: Etapa 3B — Sitio público Astro + componente Vue de reserva
```

---

## Notas para el orden de implementación

1. **Primero las tablas** (Parte A) — las rutas las necesitan para funcionar
2. **Verificar las tablas** con `SHOW TABLES` antes de seguir
3. **Luego las rutas** en cualquier orden (B, C, D, E)
4. **Registrar todas en index.js** (Parte F) al final
5. **Verificar logs** después de reiniciar: `docker compose logs backend`
   Si hay `Cannot find module` repetir `docker compose build backend && docker compose up -d backend`
6. **Probar con curl.exe** antes de dar la etapa por completa
