# SPEC FUNCIONAL - SistemaDeTurnosOnline

> Proyecto: Sistema de turnos online para profesionales independientes
> Tipo: Especificacion funcional
> Estado: Vigente

## 1. Proposito

Definir que hace el producto, para quien existe y cuales son sus reglas de negocio principales.

El sistema permite que un profesional independiente publique su agenda, reciba reservas y gestione turnos desde un panel privado. El cliente final puede buscar, ver disponibilidad y reservar sin crear una cuenta.

## 2. Alcance funcional

El proyecto cubre tres experiencias:

1. Sitio publico para el cliente final.
2. Panel admin para el profesional.
3. Modo demo local para probar todo el flujo sin depender de Docker ni del backend.

### 2.1 Sitio publico

El sitio publico permite:

- Buscar profesionales por nombre o especialidad.
- Ver una ficha publica por profesional.
- Consultar servicios, horarios y dias bloqueados.
- Reservar turnos en forma directa.
- Recibir una confirmacion visual de la reserva.

### 2.2 Panel admin

El panel admin permite al profesional:

- Iniciar sesion.
- Ver turnos del dia y metricas resumidas.
- Confirmar o cancelar turnos.
- Crear, editar o desactivar servicios.
- Configurar horarios de atencion.
- Bloquear dias especificos.
- Editar su perfil.
- Cambiar su contrasena.
- Ver metricas de actividad.
- Completar un onboarding inicial cuando corresponda.

### 2.3 Modo demo

El modo demo sirve para probar el sistema completo sin infraestructura externa.

- Se activa con `?demo=1`.
- Se persiste en `localStorage`.
- Usa datos simulados en memoria.
- Permite probar login, dashboard, servicios, disponibilidad, perfil, metricas y reservas.

## 3. Roles de usuario

### 3.1 Cliente final

Persona que busca un profesional y reserva un turno.

### 3.2 Profesional

Persona que administra su agenda, sus servicios y su informacion publica.

## 4. Reglas de negocio

- Un profesional debe tener perfil, servicios y disponibilidad basica para quedar operativo.
- El flujo del sistema privilegia la modalidad `a domicilio` y `ir al local`.
- El sitio esta pensado para profesionales de una ciudad concreta y alrededores, no para cobertura nacional.
- Un turno pertenece a un unico profesional.
- Los turnos pueden estar en estado `pendiente`, `confirmado` o `cancelado`.
- Si una fecha esta bloqueada, no se debe ofrecer disponibilidad para reservar.
- El profesional puede atender en local, a domicilio o ambas modalidades, segun cada servicio.

## 5. Experiencia funcional principal

### 5.1 Flujo del cliente

1. Entra al sitio publico.
2. Busca un profesional.
3. Abre la ficha publica.
4. Revisa servicios y horarios.
5. Selecciona fecha y modalidad.
6. Completa sus datos.
7. Confirma la reserva.

### 5.2 Flujo del profesional

1. Entra al panel admin.
2. Inicia sesion.
3. Completa el onboarding si corresponde.
4. Revisa turnos y metricas.
5. Gestiona servicios, horarios y bloqueos.
6. Actualiza su perfil.

## 6. Funcionalidades por modulo

### 6.1 Autenticacion

- Registro de profesional.
- Login.
- Restauracion de sesion.
- Cierre de sesion.

### 6.2 Onboarding

- Guiar al profesional en su configuracion inicial.
- Cargar perfil, servicios y disponibilidad minimos.
- Evitar que el panel quede vacio sin contexto.

### 6.3 Turnos

- Listar turnos.
- Confirmar turno.
- Cancelar turno.
- Ver turnos por fecha.

### 6.4 Servicios

- Crear servicio.
- Editar servicio.
- Desactivar servicio.
- Asociar modalidad y precio.

### 6.5 Disponibilidad

- Crear bloques de horario.
- Eliminar bloques.
- Bloquear fechas puntuales.
- Ver disponibilidad activa.

### 6.6 Perfil

- Editar datos del profesional.
- Cambiar contrasena.
- Gestionar foto de perfil.

### 6.7 Metricas

- Ver resumen mensual.
- Ver proximos turnos confirmados.

### 6.8 Busqueda publica

- Buscar profesionales por texto libre.
- Mostrar solo profesionales operativos.

## 7. Requisitos de usuario

- El cliente debe poder reservar sin registrarse.
- El profesional debe poder gestionar su agenda desde cualquier navegador moderno.
- La demo debe poder probarse sin Docker.
- La interfaz debe seguir siendo clara en desktop y mobile.

## 8. Criterios de aceptacion funcional

- Un profesional puede autenticarse y entrar al panel.
- Un cliente puede buscar y reservar.
- El panel muestra informacion util apenas el usuario entra.
- La demo carga datos funcionales sin backend real.
- El sistema refleja la diferencia entre atencion a domicilio y atencion en local.
- La cobertura publica del profesional se limita a una zona geografica definida.

## 9. Fuera de alcance

- Multicuentas de profesionales dentro de una misma sesion.
- Pagos online.
- Agenda compartida entre varios profesionales.
- Roles adicionales distintos de profesional.
- Notificaciones push o integraciones externas complejas.

