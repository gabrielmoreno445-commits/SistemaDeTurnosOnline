# Prompt Etapa 4A — Backend Fase 2

## Recordatorio de contexto

```
Proyecto: SistemaDeTurnosOnline
Stack: Astro + Vue SPA (panel-admin) + Node.js/Express + MySQL 8 + Docker Compose
Fase 1 completa y validada. Todos los endpoints de Fase 1 funcionando.

Reglas que siempre aplican:
- JavaScript puro, sin TypeScript
- async/await en lugar de .then()
- Todos los comentarios en español
- try/catch en cada llamada a la API
- Errores del backend: { error: 'mensaje descriptivo en español' }
- Comentarios estratégicos en cada archivo nuevo
- profesional_id siempre desde req.profesional.id (JWT), nunca desde el body
- En backend/index.js solo agregar imports y app.use() al final — no reemplazar
- No modificar rutas existentes de Fase 1 salvo donde se indique explícitamente
```

---

## Contexto de lo que ya existe

Funcionando y sin tocar salvo donde se indique:
- `backend/routes/auth.js` — register, login, me
- `backend/routes/servicios.js` — CRUD de servicios
- `backend/routes/disponibilidad.js` — bloques horarios semanales
- `backend/routes/turnos.js` — GET con ?fecha, PUT estado
- `backend/routes/publico.js` — endpoints sin auth para el sitio Astro
- `backend/middleware/authMiddleware.js` — verifica JWT
- `backend/db/connection.js` — pool MySQL
- `database/schema.sql` — tablas: profesionales, servicios, disponibilidad, turnos

---

## Parte A — Base de datos: nuevos campos y tabla

### A1 — Agregar al final de `database/schema.sql`

Sin modificar nada de lo que ya existe. Solo agregar al final:

```sql
-- Tabla dias_bloqueados
-- Permite al profesional marcar fechas específicas en que no atiende
-- (feriados, vacaciones, ausencias puntuales).
-- El sitio público consulta esta tabla al calcular disponibilidad.
-- Es independiente de la disponibilidad semanal — bloquea días puntuales
-- sin alterar la configuración de horarios habitual.
CREATE TABLE IF NOT EXISTS dias_bloqueados (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  profesional_id  INT NOT NULL,
  fecha           DATE NOT NULL,
  motivo          VARCHAR(200),
  created_at      DATETIME DEFAULT NOW(),
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
  UNIQUE KEY unico_dia (profesional_id, fecha)
);

-- Campos nuevos en profesionales
-- descripcion: texto libre que aparece en la página pública del profesional
-- direccion: dirección del consultorio/local, también pública
ALTER TABLE profesionales
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS direccion VARCHAR(200);
```

### A2 — Aplicar los cambios al contenedor MySQL

```bash
docker compose exec db mysql -u turnos_user -pturnos_password turnos_db < database/schema.sql
```

Verificar que la tabla nueva existe y que los campos se agregaron:
```bash
docker compose exec db mysql -u turnos_user -pturnos_password -e "SHOW TABLES; DESCRIBE profesionales;" turnos_db
```

---

## Parte B — Ruta de perfil

### B1 — Crear `backend/routes/perfil.js`

```js
// routes/perfil.js
// Permite al profesional editar sus datos de perfil y cambiar su contraseña.
// Todas las rutas requieren autenticación JWT.
// El profesional_id se obtiene siempre de req.profesional.id — nunca del body.
```

**PUT `/perfil`** — protegido
- Recibe: `{ nombre, especialidad, telefono, descripcion, direccion }`
- Todos los campos son opcionales — solo actualiza los que vienen en el body
- No permite cambiar email ni slug (son identificadores únicos del profesional)
- Actualiza la tabla `profesionales` donde `id = req.profesional.id`
- Responde `200` con los datos actualizados del profesional

**PUT `/perfil/password`** — protegido
- Recibe: `{ password_actual, password_nuevo }`
- Validar que ambos campos estén presentes
- Buscar el profesional en la base de datos para obtener su `password_hash`
- Verificar `password_actual` con `bcryptjs.compare`
- Si no coincide: `401` con `{ error: 'La contraseña actual es incorrecta' }`
- Hashear `password_nuevo` con bcryptjs (10 rondas)
- Actualizar `password_hash` en la base de datos
- Responder `200` con `{ mensaje: 'Contraseña actualizada correctamente' }`

---

## Parte C — Ruta de días bloqueados

### C1 — Crear `backend/routes/diasBloqueados.js`

```js
// routes/diasBloqueados.js
// Gestión de fechas en que el profesional no atiende.
// El sitio público consulta estos datos para bloquear esas fechas
// en el calendario de reservas del cliente.
```

**GET `/dias-bloqueados`** — protegido
- Lista todas las fechas bloqueadas del profesional logueado
- Ordenadas por fecha ASC
- Responde con array de `{ id, fecha, motivo }`

**POST `/dias-bloqueados`** — protegido
- Recibe: `{ fecha, motivo }` (motivo es opcional)
- Validar que `fecha` esté presente y tenga formato válido (YYYY-MM-DD)
- Validar que la fecha no sea anterior a hoy
- Si la fecha ya está bloqueada: `409` con `{ error: 'Esta fecha ya está bloqueada' }`
- Insertar en `dias_bloqueados` con `profesional_id = req.profesional.id`
- Responder `201` con el registro creado

**DELETE `/dias-bloqueados/:id`** — protegido
- Verificar que el registro pertenece al profesional logueado
- Si no pertenece: `403` con error descriptivo
- Eliminar el registro
- Responder `200` con `{ mensaje: 'Fecha desbloqueada correctamente' }`

---

## Parte D — Ruta de métricas

### D1 — Crear `backend/routes/metricas.js`

```js
// routes/metricas.js
// Datos de actividad del profesional para el dashboard.
// Todas las métricas se calculan en tiempo real con queries a MySQL.
// Si en el futuro hay problemas de performance, se puede agregar una tabla
// de caché (metricas_cache) sin cambiar la interfaz de estos endpoints.
```

**GET `/metricas/resumen`** — protegido
- Calcula para el mes actual (usar `DATE_FORMAT(fecha, '%Y-%m')` en MySQL):
  - `total_turnos`: COUNT de todos los turnos del mes
  - `turnos_confirmados`: COUNT donde estado = 'confirmado'
  - `turnos_cancelados`: COUNT donde estado = 'cancelado'
  - `turnos_pendientes`: COUNT donde estado = 'pendiente'
  - `ingresos_estimados`: SUM del precio de servicios de turnos confirmados (JOIN con servicios)
- Responde `200` con objeto con esos cinco campos

**GET `/metricas/proximos`** — protegido
- Devuelve los próximos 5 turnos confirmados del profesional
- Fecha >= hoy, estado = 'confirmado'
- Ordenados por fecha ASC, hora_inicio ASC
- Incluye: fecha, hora_inicio, cliente_nombre, nombre del servicio (JOIN)
- Responde con array de hasta 5 turnos

---

## Parte E — Actualizar rutas existentes

### E1 — Agregar filtros en `backend/routes/turnos.js`

Actualizar solo el endpoint `GET /turnos` para aceptar query params adicionales.
No modificar `PUT /turnos/:id/estado` ni nada más del archivo.

Query params nuevos (todos opcionales, se combinan entre sí):
- `?estado=pendiente|confirmado|cancelado` — filtrar por estado
- `?servicio_id=N` — filtrar por servicio
- `?desde=YYYY-MM-DD` — fecha inicio de rango
- `?hasta=YYYY-MM-DD` — fecha fin de rango

Si se pasa `?fecha=` (comportamiento de Fase 1): sigue funcionando igual.
Si se pasa `?desde=` y `?hasta=`: ignora `?fecha=` y usa el rango.

Comentario estratégico en la sección actualizada:
```js
// Filtros opcionales: fecha (día exacto), desde/hasta (rango),
// estado y servicio_id. Se construye la query dinámicamente
// según qué params lleguen. Si no llega ninguno: devuelve los de hoy.
```

### E2 — Actualizar `backend/routes/publico.js`

Dos modificaciones puntuales:

**1 — En `GET /publico/:slug`:**
Agregar `descripcion` y `direccion` a los campos devueltos en el SELECT.
Actualmente solo devuelve `nombre, especialidad, slug` — agregar los dos campos nuevos.

**2 — En `GET /publico/:slug/turnos-ocupados`:**
Antes de devolver los horarios ocupados, verificar si la fecha solicitada
está en `dias_bloqueados` para ese profesional.
Si está bloqueada: responder `{ bloqueado: true, motivo: '...' }` en lugar del array de turnos.
El componente Vue del sitio público usará esta respuesta para mostrar
"El profesional no atiende este día".

---

## Parte F — Notificaciones por email con Nodemailer

### F1 — Instalar Nodemailer

```bash
npm install nodemailer
```

### F2 — Crear `backend/utils/email.js`

```js
// utils/email.js
// Módulo de envío de emails usando Nodemailer.
// Configurado para Gmail con SMTP. Para producción usar SendGrid o similar.
// Las credenciales vienen del .env — nunca hardcodear en el código.
//
// Para habilitar el envío desde Gmail:
// 1. Activar verificación en dos pasos en la cuenta Google
// 2. Generar una "contraseña de aplicación" en myaccount.google.com/apppasswords
// 3. Usar esa contraseña en EMAIL_PASS del .env (NO la contraseña normal de Gmail)
```

El módulo debe exportar una función `enviarEmail({ para, asunto, html })` que:
- Crea un transporter de Nodemailer con la config del `.env`
- Envía el email
- Retorna una promesa
- En caso de error: loguear el error con `console.error` pero NO lanzar la excepción
  (el fallo de email no debe impedir que la reserva se guarde)

### F3 — Agregar variables al `backend/.env` y `.env.example`

Agregar al final de ambos archivos:
```
# Configuración de email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tucuenta@gmail.com
EMAIL_PASS=contraseña_de_aplicacion_gmail
EMAIL_FROM=SistemaDeTurnos <tucuenta@gmail.com>
```

### F4 — Integrar envío de emails en `backend/routes/publico.js`

En el endpoint `POST /publico/turnos`, después de insertar el turno exitosamente,
llamar a `enviarEmail()` con un email de confirmación para el cliente:

```js
// Importar al inicio del archivo
const { enviarEmail } = require('../utils/email')

// Después del INSERT exitoso:
// No usar await — el email se envía en background sin bloquear la respuesta
enviarEmail({
  para: cliente_email,
  asunto: `Turno reservado con ${profesional.nombre}`,
  html: `
    <h2>¡Tu turno está reservado!</h2>
    <p><strong>Profesional:</strong> ${profesional.nombre}</p>
    <p><strong>Servicio:</strong> ${nombre_servicio}</p>
    <p><strong>Fecha:</strong> ${fecha}</p>
    <p><strong>Hora:</strong> ${hora_inicio}</p>
    <p><strong>Estado:</strong> Pendiente de confirmación</p>
    ${profesional.direccion ? `<p><strong>Dirección:</strong> ${profesional.direccion}</p>` : ''}
  `
})
```

### F5 — Integrar envío de emails en `backend/routes/turnos.js`

En el endpoint `PUT /turnos/:id/estado`, cuando el nuevo estado es `confirmado`,
enviar email al cliente avisando la confirmación.
Requiere obtener `cliente_email` y `cliente_nombre` del turno antes de actualizar.

---

## Parte G — Registrar rutas nuevas en `backend/index.js`

Agregar al final de la lista de rutas existente, sin tocar nada más:

```js
// Rutas de Fase 2
const perfilRoutes = require('./routes/perfil')
const diasBloqueadosRoutes = require('./routes/diasBloqueados')
const metricasRoutes = require('./routes/metricas')
app.use('/perfil', perfilRoutes)
app.use('/dias-bloqueados', diasBloqueadosRoutes)
app.use('/metricas', metricasRoutes)
```

---

## Qué NO hacer en esta etapa

- No modificar `routes/auth.js`, `authMiddleware.js` ni `connection.js`
- No crear componentes Vue ni páginas Astro (eso es 4B y 4C)
- No agregar campos extra a las tablas más allá de los definidos
- No lanzar excepción si el email falla — solo loguear y continuar
- No hardcodear credenciales de email en el código
- No modificar `PUT /turnos/:id/estado` salvo para agregar el envío de email

---

## Cómo validar que esta etapa está completa

**Verificar estructura DB:**
```powershell
docker compose exec db mysql -u turnos_user -pturnos_password -e "SHOW TABLES; DESCRIBE profesionales;" turnos_db
```
→ Debe mostrar tabla `dias_bloqueados` y campos `descripcion`, `direccion` en profesionales

**Perfil:**
```powershell
# Login primero
$body = '{"email":"maria@test.com","password":"123456"}'
curl.exe -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d $body
# Guardar token en $token

# Actualizar perfil
$body = '{"nombre":"Maria Garcia","especialidad":"Peluqueria y Estilismo","descripcion":"Especialista en coloracion","direccion":"Av. Corrientes 1234"}'
curl.exe -X PUT http://localhost:4000/perfil -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $body
# → 200 con datos actualizados

# Verificar que se refleja en el sitio público
curl.exe http://localhost:4000/publico/maria-garcia
# → debe incluir descripcion y direccion
```

**Cambiar contraseña:**
```powershell
$body = '{"password_actual":"123456","password_nuevo":"nueva123"}'
curl.exe -X PUT http://localhost:4000/perfil/password -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $body
# → 200 con mensaje

# Verificar que el nuevo password funciona
$body = '{"email":"maria@test.com","password":"nueva123"}'
curl.exe -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d $body
# → 200 con nuevo token

# Volver a password original para no romper pruebas futuras
$body = '{"password_actual":"nueva123","password_nuevo":"123456"}'
curl.exe -X PUT http://localhost:4000/perfil/password -H "Content-Type: application/json" -H "Authorization: Bearer $token2" -d $body
```

**Días bloqueados:**
```powershell
$body = '{"fecha":"2026-07-09","motivo":"Feriado nacional"}'
curl.exe -X POST http://localhost:4000/dias-bloqueados -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $body
# → 201

curl.exe http://localhost:4000/dias-bloqueados -H "Authorization: Bearer $token"
# → array con la fecha bloqueada

# Verificar que el sitio público la detecta
curl.exe "http://localhost:4000/publico/maria-garcia/turnos-ocupados?fecha=2026-07-09"
# → { bloqueado: true, motivo: 'Feriado nacional' }

# Desbloquear
curl.exe -X DELETE http://localhost:4000/dias-bloqueados/1 -H "Authorization: Bearer $token"
# → 200
```

**Métricas:**
```powershell
curl.exe http://localhost:4000/metricas/resumen -H "Authorization: Bearer $token"
# → { total_turnos, turnos_confirmados, turnos_cancelados, turnos_pendientes, ingresos_estimados }

curl.exe http://localhost:4000/metricas/proximos -H "Authorization: Bearer $token"
# → array de hasta 5 turnos próximos confirmados
```

**Filtros de turnos:**
```powershell
curl.exe "http://localhost:4000/turnos?estado=confirmado" -H "Authorization: Bearer $token"
# → solo turnos confirmados

curl.exe "http://localhost:4000/turnos?desde=2026-05-01&hasta=2026-05-31" -H "Authorization: Bearer $token"
# → turnos del mes de mayo
```

**Email (si las credenciales están configuradas):**
```powershell
# Crear un turno nuevo desde el sitio público y verificar que llega el email
$body = '{"slug":"maria-garcia","servicio_id":1,"cliente_nombre":"Test Email","cliente_email":"tu_email_real@gmail.com","fecha":"2026-06-15","hora_inicio":"10:00"}'
curl.exe -X POST http://localhost:4000/publico/turnos -H "Content-Type: application/json" -d $body
# → verificar bandeja de entrada
```

> Si las credenciales de email no están configuradas todavía, omitir esta
> validación y confirmar que el backend NO crashea cuando el email falla.

### Reporte de validación esperado

```
✅ Etapa 4A — Backend Fase 2 completado

Validaciones:
✔ SHOW TABLES — dias_bloqueados presente
✔ DESCRIBE profesionales — campos descripcion y direccion presentes
✔ PUT /perfil — datos actualizados
✔ GET /publico/:slug — incluye descripcion y direccion
✔ PUT /perfil/password — cambio exitoso, login con nuevo password OK
✔ POST /dias-bloqueados — fecha bloqueada creada
✔ GET /dias-bloqueados — lista correcta
✔ GET /publico/:slug/turnos-ocupados (fecha bloqueada) — { bloqueado: true }
✔ DELETE /dias-bloqueados/:id — eliminado correctamente
✔ GET /metricas/resumen — objeto con 5 métricas
✔ GET /metricas/proximos — array de próximos turnos
✔ GET /turnos?estado= — filtra correctamente
✔ GET /turnos?desde=&hasta= — filtra por rango
✔ Email — envío sin bloquear la respuesta (o falla silenciosa si no configurado)
✔ archivos Fase 1 — sin modificaciones no autorizadas
✔ dependencias — solo se agregó nodemailer

Archivos creados en esta etapa:
- backend/routes/perfil.js
- backend/routes/diasBloqueados.js
- backend/routes/metricas.js
- backend/utils/email.js
- backend/index.js (4 líneas agregadas al final)
- backend/routes/turnos.js (solo GET /turnos actualizado con filtros)
- backend/routes/publico.js (2 modificaciones puntuales)
- database/schema.sql (1 tabla + 2 campos al final)
- backend/.env + .env.example (variables de email agregadas)

Próximo paso: Etapa 4B — Panel admin Fase 2
```

---

## Notas para el orden de implementación

1. **Primero la DB** (Parte A) — aplicar el schema antes de arrancar con las rutas
2. **Verificar los campos nuevos** con `DESCRIBE profesionales` antes de continuar
3. **Rutas nuevas** (B, C, D) — en cualquier orden, son independientes entre sí
4. **Modificaciones a rutas existentes** (E) — hacerlas con cuidado,
   verificar que los endpoints de Fase 1 siguen funcionando después de cada cambio
5. **Nodemailer** (F) — dejarlo para el final; si algo falla en el email
   no debe romper el flujo de reserva
6. **Registrar en index.js** (G) — último paso antes de validar
7. Después de cada `npm install` o cambio de código en backend:
   ```
   docker compose build backend && docker compose up -d backend
   ```
   y verificar logs con `docker compose logs backend`
