-- schema.sql
-- Base de datos del sistema de turnos online.
-- Este archivo se ejecuta automaticamente al levantar el contenedor MySQL por primera vez.
-- Para reiniciar desde cero: docker compose down -v && docker compose up

CREATE DATABASE IF NOT EXISTS turnos_db;
USE turnos_db;

-- Tabla profesionales
-- Almacena los usuarios del panel admin, es decir, los profesionales independientes
-- que gestionan su propia agenda desde el sistema.
-- El campo slug existe para construir la URL publica de reservas de cada profesional.
-- Ejemplo esperado: tudominio.com/maria-garcia
CREATE TABLE IF NOT EXISTS profesionales (
  -- Identificador interno unico del profesional.
  -- Se usa como clave primaria y referencia futura en el resto de entidades del sistema.
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Nombre visible del profesional.
  -- Sirve para mostrar su identidad en el panel y para generar el slug inicial.
  nombre VARCHAR(100) NOT NULL,

  -- Email de acceso al sistema.
  -- Debe ser unico para evitar cuentas duplicadas y permitir login confiable.
  email VARCHAR(150) NOT NULL UNIQUE,

  -- Password ya hasheado.
  -- Nunca se guarda la clave en texto plano por seguridad.
  password_hash VARCHAR(255) NOT NULL,

  -- Identificador publico amigable para URL.
  -- Debe ser unico porque define la direccion publica de reservas de cada profesional.
  slug VARCHAR(100) NOT NULL UNIQUE,

  -- Describe el tipo de servicio que ofrece el profesional.
  -- Se deja opcional porque puede completarse o ajustarse mas adelante desde el panel.
  especialidad VARCHAR(150),

  -- Telefono de contacto del profesional.
  -- Tambien es opcional porque no siempre sera necesario mostrarlo o cargarlo al registrarse.
  telefono VARCHAR(30),

  -- Fecha de creacion del registro.
  -- Permite auditar cuando se dio de alta la cuenta del profesional.
  created_at DATETIME DEFAULT NOW()
);

-- Tabla servicios
-- Cada profesional define los servicios que ofrece dentro del sistema.
-- duracion_minutos existe para calcular cuanto bloquea cada reserva en agenda,
-- y activo permite ocultar un servicio sin perder su historial relacionado.
CREATE TABLE IF NOT EXISTS servicios (
  -- Identificador unico del servicio.
  -- Se usa para relacionarlo con turnos y operaciones de gestion del panel.
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Profesional propietario del servicio.
  -- Siempre apunta a la cuenta autenticada que creo ese servicio.
  profesional_id INT NOT NULL,

  -- Nombre visible del servicio.
  -- Ejemplos: corte, consulta inicial, masaje descontracturante.
  nombre VARCHAR(100) NOT NULL,

  -- Duracion del servicio en minutos.
  -- Se usa para calcular que horario ocupa el turno dentro de la agenda.
  duracion_minutos INT NOT NULL DEFAULT 30,

  -- Precio de referencia del servicio.
  -- Se deja opcional porque algunos profesionales pueden no mostrarlo al cliente.
  precio DECIMAL(10,2),

  -- Marca logica para ocultar un servicio sin borrarlo fisicamente.
  -- Esto evita romper relaciones con turnos ya existentes.
  activo TINYINT(1) NOT NULL DEFAULT 1,

  -- Fecha de creacion del servicio.
  -- Permite auditar cuando se agrego al catalogo del profesional.
  created_at DATETIME DEFAULT NOW(),

  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

-- Tabla disponibilidad
-- Define los bloques horarios en los que el profesional atiende cada dia.
-- Un mismo dia puede tener multiples bloques para representar manana y tarde.
CREATE TABLE IF NOT EXISTS disponibilidad (
  -- Identificador unico del bloque horario.
  -- Se usa para editar o eliminar disponibilidad desde el panel.
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Profesional dueño del bloque.
  -- La relacion asegura que cada agenda se mantenga separada por cuenta.
  profesional_id INT NOT NULL,

  -- Dia de la semana del bloque.
  -- Usa el convenio 0=domingo hasta 6=sabado para simplificar consultas.
  dia_semana TINYINT NOT NULL,

  -- Hora de inicio del bloque disponible.
  -- Marca desde cuando el profesional puede recibir reservas ese dia.
  hora_inicio TIME NOT NULL,

  -- Hora de fin del bloque disponible.
  -- Debe ser posterior a hora_inicio para representar un rango valido.
  hora_fin TIME NOT NULL,

  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

-- Tabla turnos
-- Registra cada reserva generada por un cliente sobre un servicio del profesional.
-- Los datos del cliente se guardan en la fila porque el cliente no tiene cuenta propia.
CREATE TABLE IF NOT EXISTS turnos (
  -- Identificador unico del turno.
  -- Se usa para gestionarlo desde el panel y para exponer su alta al frontend.
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Profesional al que pertenece el turno.
  -- Siempre se resuelve desde el slug o desde el JWT segun el origen de la accion.
  profesional_id INT NOT NULL,

  -- Servicio reservado por el cliente.
  -- Permite conocer duracion, nombre y precio historico del turno.
  servicio_id INT NOT NULL,

  -- Nombre del cliente que hizo la reserva.
  -- Es obligatorio porque identifica a quien corresponde el turno.
  cliente_nombre VARCHAR(100) NOT NULL,

  -- Email del cliente.
  -- Se usa para contacto y futura notificacion de la reserva.
  cliente_email VARCHAR(150) NOT NULL,

  -- Telefono del cliente.
  -- Se deja opcional porque no siempre estara disponible al reservar.
  cliente_telefono VARCHAR(30),

  -- Fecha en la que ocurre el turno.
  -- Se combina con hora_inicio para ubicarlo dentro de la agenda.
  fecha DATE NOT NULL,

  -- Hora exacta de comienzo del turno.
  -- Junto con la duracion del servicio determina el tramo ocupado.
  hora_inicio TIME NOT NULL,

  -- Estado actual del turno.
  -- Nace como pendiente y luego puede confirmarse o cancelarse sin borrarlo.
  estado ENUM('pendiente','confirmado','cancelado') DEFAULT 'pendiente',

  -- Fecha de creacion de la reserva.
  -- Sirve para auditar cuando se agendo el turno.
  created_at DATETIME DEFAULT NOW(),

  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

-- Tabla dias_bloqueados
-- Permite al profesional marcar fechas especificas en que no atiende
-- (feriados, vacaciones, ausencias puntuales).
-- El sitio publico consulta esta tabla al calcular disponibilidad.
-- Es independiente de la disponibilidad semanal: bloquea dias puntuales
-- sin alterar la configuracion de horarios habitual.
CREATE TABLE IF NOT EXISTS dias_bloqueados (
  -- Identificador unico del bloqueo puntual.
  -- Sirve para listar y eliminar dias concretos desde el panel.
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Profesional propietario del bloqueo.
  -- Se relaciona con el JWT para que cada agenda gestione solo sus fechas.
  profesional_id INT NOT NULL,

  -- Fecha exacta que queda fuera de atencion.
  -- Se usa como corte absoluto para la reserva publica de ese dia.
  fecha DATE NOT NULL,

  -- Motivo opcional visible para explicar la ausencia.
  -- Permite distinguir feriados, vacaciones o cierres excepcionales.
  motivo VARCHAR(200),

  -- Fecha de creacion del bloqueo.
  -- Ayuda a auditar cuando se marco esa excepcion.
  created_at DATETIME DEFAULT NOW(),

  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
  UNIQUE KEY unico_dia (profesional_id, fecha)
);

-- Campos nuevos en profesionales
-- descripcion: texto libre que aparece en la pagina publica del profesional
-- direccion: direccion del consultorio o local, tambien visible al cliente
SET @agregar_descripcion = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE profesionales ADD COLUMN descripcion TEXT',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'turnos_db'
    AND TABLE_NAME = 'profesionales'
    AND COLUMN_NAME = 'descripcion'
);
PREPARE stmt_descripcion FROM @agregar_descripcion;
EXECUTE stmt_descripcion;
DEALLOCATE PREPARE stmt_descripcion;

SET @agregar_direccion = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE profesionales ADD COLUMN direccion VARCHAR(200)',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'turnos_db'
    AND TABLE_NAME = 'profesionales'
    AND COLUMN_NAME = 'direccion'
);
PREPARE stmt_direccion FROM @agregar_direccion;
EXECUTE stmt_direccion;
DEALLOCATE PREPARE stmt_direccion;
