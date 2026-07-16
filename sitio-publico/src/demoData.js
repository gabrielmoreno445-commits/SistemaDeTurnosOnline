// demoData.js
// Datos de ejemplo para probar el sitio publico sin backend ni Docker.
// Se usan solo cuando la URL incluye ?demo=1.

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + days);
  return fecha.toISOString().slice(0, 10);
}

const demoProfessional = {
  id: 1,
  nombre: 'Maria Garcia',
  especialidad: 'Profesional de ejemplo',
  slug: 'maria-garcia',
  descripcion:
    'Demo de Eldorado: combina atencion en consultorio y visitas a domicilio para probar ambos flujos.',
  direccion: 'Av. San Martin 1234, Eldorado, Misiones',
  zona_cobertura: 'Eldorado, Misiones y hasta 15 km a la redonda',
  foto_url: null
};

const demoServices = [
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
];

const demoAvailability = [
  { id: 1, profesional_id: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
  { id: 2, profesional_id: 1, dia_semana: 1, hora_inicio: '15:00:00', hora_fin: '19:00:00' },
  { id: 3, profesional_id: 1, dia_semana: 2, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
  { id: 4, profesional_id: 1, dia_semana: 2, hora_inicio: '15:00:00', hora_fin: '19:00:00' },
  { id: 5, profesional_id: 1, dia_semana: 3, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
  { id: 6, profesional_id: 1, dia_semana: 4, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
  { id: 7, profesional_id: 1, dia_semana: 5, hora_inicio: '08:00:00', hora_fin: '12:00:00' }
];

const demoBlockedDays = [
  { fecha: '2026-07-20', motivo: 'Feriado local' }
];

const demoTurnos = [
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
    estado: 'pendiente'
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
    estado: 'confirmado'
  }
];

function getDemoProfessionalBySlug(slug) {
  return slug === demoProfessional.slug ? clonar(demoProfessional) : null;
}

function getDemoServicesBySlug(slug) {
  return slug === demoProfessional.slug ? clonar(demoServices.filter((servicio) => servicio.activo === 1)) : [];
}

function getDemoAvailabilityBySlug(slug) {
  return slug === demoProfessional.slug ? clonar(demoAvailability) : [];
}

function getDemoTurnosOcupados(slug, fecha) {
  if (slug !== demoProfessional.slug) {
    return [];
  }

  const bloqueo = demoBlockedDays.find((item) => item.fecha === fecha);

  if (bloqueo) {
    return {
      bloqueado: true,
      motivo: bloqueo.motivo
    };
  }

  return clonar(
    demoTurnos
      .filter((turno) => turno.fecha === fecha && ['pendiente', 'confirmado'].includes(turno.estado))
      .map((turno) => {
        const servicio = demoServices.find((item) => item.id === turno.servicio_id);

        return {
          hora_inicio: turno.hora_inicio,
          duracion_minutos: servicio?.duracion_minutos || 0
        };
      })
  );
}

function getDemoSearchResults(termino) {
  const texto = termino.trim().toLowerCase();

  if (!texto) {
    return [];
  }

  const coincide =
    demoProfessional.nombre.toLowerCase().includes(texto) ||
    (demoProfessional.especialidad || '').toLowerCase().includes(texto) ||
    (demoProfessional.descripcion || '').toLowerCase().includes(texto) ||
    demoServices.some((servicio) => servicio.nombre.toLowerCase().includes(texto));

  if (!coincide) {
    return [];
  }

  const atiendeEnLocal = demoServices.some((servicio) => ['local', 'ambas'].includes(servicio.modalidad_atencion));
  const atiendeADomicilio = demoServices.some((servicio) => ['domicilio', 'ambas'].includes(servicio.modalidad_atencion));

  return [
    {
      id: demoProfessional.id,
      nombre: demoProfessional.nombre,
      especialidad: demoProfessional.especialidad,
      slug: demoProfessional.slug,
      foto_url: demoProfessional.foto_url,
      zona_cobertura: demoProfessional.zona_cobertura,
      atiende_en_local: atiendeEnLocal ? 1 : 0,
      atiende_a_domicilio: atiendeADomicilio ? 1 : 0
    }
  ];
}

function createDemoTurno(datos) {
  const servicio = demoServices.find((item) => item.id === Number(datos.servicio_id));

  if (!servicio) {
    throw new Error('El servicio seleccionado no pertenece al profesional');
  }

  const turno = {
    id: demoTurnos.length + 1,
    profesional_id: demoProfessional.id,
    servicio_id: servicio.id,
    cliente_nombre: datos.cliente_nombre,
    cliente_email: datos.cliente_email,
    cliente_telefono: datos.cliente_telefono || null,
    modalidad_atencion: datos.modalidad_atencion || servicio.modalidad_atencion,
    direccion_cliente: datos.modalidad_atencion === 'domicilio' ? datos.direccion_cliente || null : null,
    notas_cliente: datos.notas_cliente || null,
    fecha: datos.fecha,
    hora_inicio: datos.hora_inicio.length === 5 ? `${datos.hora_inicio}:00` : datos.hora_inicio,
    estado: 'pendiente'
  };

  demoTurnos.push(turno);

  return {
    mensaje: 'Turno reservado correctamente',
    turno_id: turno.id
  };
}

export {
  createDemoTurno,
  getDemoAvailabilityBySlug,
  getDemoProfessionalBySlug,
  getDemoSearchResults,
  getDemoServicesBySlug,
  getDemoTurnosOcupados
};
