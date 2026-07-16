// demoData.js
// Estado local de demo para probar el panel admin sin backend ni Docker.
// Los datos se mantienen en memoria mientras dura la sesion del navegador.

import { DEMO_TOKEN } from './demoMode.js';

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

let nextServicioId = 3;
let nextBloqueId = 3;
let nextTurnoId = 3;
let nextDiaBloqueadoId = 2;

const demoState = {
  profesional: {
    id: 1,
    nombre: 'Maria Garcia',
    email: 'maria@test.com',
    slug: 'maria-garcia',
    especialidad: 'Profesional de ejemplo',
    telefono: '3751 555123',
    descripcion:
      'Demo de Eldorado: combina atencion en consultorio y servicios a domicilio para probar ambos flujos.',
    direccion: 'Av. San Martin 1234, Eldorado, Misiones',
    zona_cobertura: 'Eldorado, Misiones y hasta 15 km a la redonda',
    foto_url: null,
    onboarding_completado: 1,
    created_at: '2026-07-15 09:00:00'
  },
  servicios: [
    {
      id: 1,
      profesional_id: 1,
      nombre: 'Consulta en consultorio',
      duracion_minutos: 60,
      precio: 15000,
      modalidad_atencion: 'local',
      activo: 1,
      created_at: '2026-07-15 09:10:00'
    },
    {
      id: 2,
      profesional_id: 1,
      nombre: 'Asistencia a domicilio',
      duracion_minutos: 120,
      precio: 22000,
      modalidad_atencion: 'domicilio',
      activo: 1,
      created_at: '2026-07-15 09:20:00'
    }
  ],
  disponibilidad: [
    { id: 1, profesional_id: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
    { id: 2, profesional_id: 1, dia_semana: 1, hora_inicio: '15:00:00', hora_fin: '19:00:00' },
    { id: 3, profesional_id: 1, dia_semana: 2, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
    { id: 4, profesional_id: 1, dia_semana: 2, hora_inicio: '15:00:00', hora_fin: '19:00:00' },
    { id: 5, profesional_id: 1, dia_semana: 3, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
    { id: 6, profesional_id: 1, dia_semana: 4, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
    { id: 7, profesional_id: 1, dia_semana: 5, hora_inicio: '08:00:00', hora_fin: '12:00:00' }
  ],
  diasBloqueados: [
    { id: 1, profesional_id: 1, fecha: '2026-07-20', motivo: 'Feriado local', created_at: '2026-07-15 09:30:00' }
  ],
  turnos: [
    {
      id: 1,
      profesional_id: 1,
      servicio_id: 1,
      cliente_nombre: 'Juan Perez',
      cliente_email: 'juan@test.com',
      cliente_telefono: '3751 111111',
      modalidad_atencion: 'local',
      direccion_cliente: null,
      notas_cliente: 'Primera consulta',
      fecha: currentIsoDate(),
      hora_inicio: '10:00:00',
      estado: 'pendiente',
      created_at: '2026-07-15 10:00:00'
    },
    {
      id: 2,
      profesional_id: 1,
      servicio_id: 2,
      cliente_nombre: 'Ana Lopez',
      cliente_email: 'ana@test.com',
      cliente_telefono: '3751 222222',
      modalidad_atencion: 'domicilio',
      direccion_cliente: 'Barrio Alborada, Eldorado',
      notas_cliente: 'Llegar por porton negro',
      fecha: addDaysIso(1),
      hora_inicio: '17:00:00',
      estado: 'confirmado',
      created_at: '2026-07-15 10:30:00'
    }
  ]
};

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + days);
  return fecha.toISOString().slice(0, 10);
}

function getDemoProfessional() {
  return clonar(demoState.profesional);
}

function loginDemoProfesional(email, password) {
  if (email !== 'maria@test.com' || password !== '12345') {
    throw new Error('Credenciales inválidas');
  }

  return {
    token: DEMO_TOKEN,
    profesional: getDemoProfessional()
  };
}

function getDemoProfesionalActual() {
  return {
    profesional: getDemoProfessional()
  };
}

function getDemoOnboardingEstado() {
  return {
    completado: true
  };
}

function actualizarDemoPerfil(datos) {
  const permitidos = ['nombre', 'especialidad', 'telefono', 'descripcion', 'direccion', 'zona_cobertura'];

  for (const campo of permitidos) {
    if (Object.prototype.hasOwnProperty.call(datos, campo)) {
      demoState.profesional[campo] = datos[campo] || null;
    }
  }

  return clonar(demoState.profesional);
}

function cambiarDemoPassword() {
  return {
    mensaje: 'Contraseña actualizada correctamente'
  };
}

function subirDemoFoto() {
  demoState.profesional.foto_url = '/uploads/demo-maria.jpg';

  return {
    foto_url: demoState.profesional.foto_url
  };
}

function eliminarDemoFoto() {
  demoState.profesional.foto_url = null;

  return {
    mensaje: 'Foto eliminada correctamente'
  };
}

function listarDemoServicios() {
  return clonar(demoState.servicios.filter((servicio) => servicio.activo === 1));
}

function crearDemoServicio(datos) {
  const servicio = {
    id: nextServicioId++,
    profesional_id: demoState.profesional.id,
    nombre: datos.nombre,
    duracion_minutos: Number(datos.duracion_minutos),
    precio: datos.precio ?? null,
    modalidad_atencion: datos.modalidad_atencion || 'local',
    activo: 1,
    created_at: new Date().toISOString()
  };

  demoState.servicios.unshift(servicio);
  return clonar(servicio);
}

function editarDemoServicio(id, datos) {
  const servicio = demoState.servicios.find((item) => item.id === Number(id));

  if (!servicio) {
    throw new Error('No se pudo encontrar el servicio');
  }

  servicio.nombre = datos.nombre ?? servicio.nombre;
  servicio.duracion_minutos = datos.duracion_minutos ?? servicio.duracion_minutos;
  servicio.precio = datos.precio !== undefined ? datos.precio : servicio.precio;
  servicio.modalidad_atencion = datos.modalidad_atencion || servicio.modalidad_atencion;

  return clonar(servicio);
}

function desactivarDemoServicio(id) {
  const servicio = demoState.servicios.find((item) => item.id === Number(id));

  if (!servicio) {
    throw new Error('No se pudo encontrar el servicio');
  }

  servicio.activo = 0;

  return {
    mensaje: 'Servicio desactivado'
  };
}

function listarDemoDisponibilidad() {
  return clonar(demoState.disponibilidad);
}

function crearDemoBloque(datos) {
  const bloque = {
    id: nextBloqueId++,
    profesional_id: demoState.profesional.id,
    dia_semana: Number(datos.dia_semana),
    hora_inicio: datos.hora_inicio,
    hora_fin: datos.hora_fin
  };

  demoState.disponibilidad.push(bloque);
  return clonar(bloque);
}

function eliminarDemoBloque(id) {
  const indice = demoState.disponibilidad.findIndex((item) => item.id === Number(id));

  if (indice === -1) {
    throw new Error('No se pudo encontrar el bloque');
  }

  demoState.disponibilidad.splice(indice, 1);
  return {
    mensaje: 'Bloque de disponibilidad eliminado'
  };
}

function listarDemoDiasBloqueados() {
  return clonar(demoState.diasBloqueados);
}

function bloquearDemoFecha(fecha, motivo) {
  const existente = demoState.diasBloqueados.find((item) => item.fecha === fecha);

  if (existente) {
    throw new Error('Ya existe un bloqueo para esa fecha');
  }

  const bloqueo = {
    id: nextDiaBloqueadoId++,
    profesional_id: demoState.profesional.id,
    fecha,
    motivo: motivo || null,
    created_at: new Date().toISOString()
  };

  demoState.diasBloqueados.push(bloqueo);
  return clonar(bloqueo);
}

function desbloquearDemoFecha(id) {
  const indice = demoState.diasBloqueados.findIndex((item) => item.id === Number(id));

  if (indice === -1) {
    throw new Error('No se pudo encontrar el bloqueo');
  }

  demoState.diasBloqueados.splice(indice, 1);
  return {
    mensaje: 'Dia desbloqueado'
  };
}

function listarDemoTurnos(filtros = {}) {
  let turnos = demoState.turnos.filter((turno) => turno.profesional_id === demoState.profesional.id);

  if (filtros.desde && filtros.hasta) {
    turnos = turnos.filter((turno) => turno.fecha >= filtros.desde && turno.fecha <= filtros.hasta);
  } else if (filtros.fecha) {
    turnos = turnos.filter((turno) => turno.fecha === filtros.fecha);
  } else if (!filtros.estado && !filtros.servicio_id) {
    turnos = turnos.filter((turno) => turno.fecha === currentIsoDate());
  }

  if (filtros.estado) {
    turnos = turnos.filter((turno) => turno.estado === filtros.estado);
  }

  if (filtros.servicio_id) {
    turnos = turnos.filter((turno) => turno.servicio_id === Number(filtros.servicio_id));
  }

  return clonar(turnos);
}

function cambiarDemoEstadoTurno(id, estado) {
  const turno = demoState.turnos.find((item) => item.id === Number(id));

  if (!turno) {
    throw new Error('No se pudo encontrar el turno');
  }

  turno.estado = estado;

  return clonar({
    ...turno,
    servicio_nombre: obtenerDemoServicioPorId(turno.servicio_id)?.nombre || 'Servicio'
  });
}

function obtenerDemoServicioPorId(id) {
  return demoState.servicios.find((item) => item.id === Number(id)) || null;
}

function getDemoResumen() {
  const ahora = currentIsoDate().slice(0, 7);
  const turnosDelMes = demoState.turnos.filter((turno) => turno.fecha.slice(0, 7) === ahora);

  return {
    total_turnos: turnosDelMes.length,
    turnos_confirmados: turnosDelMes.filter((turno) => turno.estado === 'confirmado').length,
    turnos_cancelados: turnosDelMes.filter((turno) => turno.estado === 'cancelado').length,
    turnos_pendientes: turnosDelMes.filter((turno) => turno.estado === 'pendiente').length,
    ingresos_estimados: turnosDelMes
      .filter((turno) => turno.estado === 'confirmado')
      .reduce((total, turno) => {
        const servicio = obtenerDemoServicioPorId(turno.servicio_id);
        return total + Number(servicio?.precio || 0);
      }, 0)
  };
}

function getDemoProximos() {
  return demoState.turnos
    .filter((turno) => turno.profesional_id === demoState.profesional.id && turno.estado === 'confirmado')
    .sort((a, b) => `${a.fecha} ${a.hora_inicio}`.localeCompare(`${b.fecha} ${b.hora_inicio}`))
    .slice(0, 5)
    .map((turno) => ({
      fecha: turno.fecha,
      hora_inicio: turno.hora_inicio,
      cliente_nombre: turno.cliente_nombre,
      modalidad_atencion: turno.modalidad_atencion,
      direccion_cliente: turno.direccion_cliente,
      servicio_nombre: obtenerDemoServicioPorId(turno.servicio_id)?.nombre || 'Servicio'
    }));
}

export {
  actualizarDemoPerfil,
  bloquearDemoFecha,
  cambiarDemoEstadoTurno,
  cambiarDemoPassword,
  crearDemoBloque,
  crearDemoServicio,
  desactivarDemoServicio,
  desbloquearDemoFecha,
  eliminarDemoBloque,
  eliminarDemoFoto,
  editarDemoServicio,
  getDemoOnboardingEstado,
  getDemoProfessional,
  getDemoProfesionalActual,
  getDemoResumen,
  getDemoProximos,
  listarDemoDiasBloqueados,
  listarDemoDisponibilidad,
  listarDemoServicios,
  listarDemoTurnos,
  loginDemoProfesional,
  obtenerDemoServicioPorId,
  subirDemoFoto
};
