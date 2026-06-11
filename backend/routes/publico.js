// routes/publico.js
// Endpoints publicos consumidos por el sitio Astro: no requieren autenticacion.
// Son de solo lectura excepto POST /publico/turnos, que crea una reserva.
// El acceso es por slug del profesional para no exponer ids internos.

const express = require('express');

const pool = require('../db/connection');
const { enviarEmail } = require('../utils/email');

const router = express.Router();

// Busca un profesional por slug devolviendo solo campos publicos.
// Evita filtrar informacion sensible del panel hacia el sitio abierto.
async function obtenerProfesionalPublicoPorSlug(slug) {
  const [rows] = await pool.query(
    `SELECT id, nombre, especialidad, slug, descripcion, direccion, zona_cobertura, foto_url
     FROM profesionales
     WHERE slug = ?
     LIMIT 1`,
    [slug]
  );

  return rows[0] || null;
}

// Busca un servicio activo del profesional para validar reservas publicas.
// Asi el cliente solo puede reservar opciones vigentes del perfil visitado.
async function obtenerServicioActivoDelProfesional(servicioId, profesionalId) {
  const [rows] = await pool.query(
    `SELECT id, profesional_id, nombre, duracion_minutos, precio, modalidad_atencion, activo
     FROM servicios
     WHERE id = ? AND profesional_id = ? AND activo = 1
     LIMIT 1`,
    [servicioId, profesionalId]
  );

  return rows[0] || null;
}

// GET /publico/:slug
// Devuelve la ficha publica minima del profesional.
router.get('/:slug', async (req, res) => {
  try {
    const profesional = await obtenerProfesionalPublicoPorSlug(req.params.slug);

    if (!profesional) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    return res.status(200).json(profesional);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo obtener el profesional'
    });
  }
});

// GET /publico/:slug/servicios
// Lista los servicios activos visibles para el cliente final.
router.get('/:slug/servicios', async (req, res) => {
  try {
    const profesional = await obtenerProfesionalPublicoPorSlug(req.params.slug);

    if (!profesional) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    const [rows] = await pool.query(
      `SELECT id, profesional_id, nombre, duracion_minutos, precio, modalidad_atencion, activo, created_at
       FROM servicios
       WHERE profesional_id = ? AND activo = 1
       ORDER BY created_at DESC`,
      [profesional.id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudieron obtener los servicios publicos'
    });
  }
});

// GET /publico/:slug/disponibilidad
// Devuelve la disponibilidad semanal del profesional para construir la agenda publica.
router.get('/:slug/disponibilidad', async (req, res) => {
  try {
    const profesional = await obtenerProfesionalPublicoPorSlug(req.params.slug);

    if (!profesional) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    const [rows] = await pool.query(
      `SELECT id, profesional_id, dia_semana, hora_inicio, hora_fin
       FROM disponibilidad
       WHERE profesional_id = ?
       ORDER BY dia_semana ASC, hora_inicio ASC`,
      [profesional.id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo obtener la disponibilidad publica'
    });
  }
});

// GET /publico/:slug/turnos-ocupados
// Informa horarios tomados en una fecha para que el frontend bloquee opciones.
router.get('/:slug/turnos-ocupados', async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        error: 'La fecha es obligatoria'
      });
    }

    const profesional = await obtenerProfesionalPublicoPorSlug(req.params.slug);

    if (!profesional) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    const [bloqueos] = await pool.query(
      `SELECT motivo
       FROM dias_bloqueados
       WHERE profesional_id = ? AND fecha = ?
       LIMIT 1`,
      [profesional.id, fecha]
    );

    if (bloqueos.length > 0) {
      return res.status(200).json({
        bloqueado: true,
        motivo: bloqueos[0].motivo
      });
    }

    const [rows] = await pool.query(
      `SELECT t.hora_inicio, s.duracion_minutos
       FROM turnos t
       INNER JOIN servicios s ON s.id = t.servicio_id
       WHERE t.profesional_id = ?
         AND t.fecha = ?
         AND t.estado IN ('pendiente', 'confirmado')
       ORDER BY t.hora_inicio ASC`,
      [profesional.id, fecha]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudieron obtener los turnos ocupados'
    });
  }
});

// POST /publico/turnos
// Crea una reserva publica validando que el slug exista, que el servicio pertenezca
// a ese profesional y que el horario siga libre al momento de confirmar.
router.post('/turnos', async (req, res) => {
  try {
    const {
      slug,
      servicio_id,
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      modalidad_atencion,
      direccion_cliente,
      notas_cliente,
      fecha,
      hora_inicio
    } = req.body;

    if (!slug || !servicio_id || !cliente_nombre || !cliente_email || !fecha || !hora_inicio) {
      return res.status(400).json({
        error: 'slug, servicio_id, cliente_nombre, cliente_email, fecha y hora_inicio son obligatorios'
      });
    }

    const profesional = await obtenerProfesionalPublicoPorSlug(slug);

    if (!profesional) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    const servicio = await obtenerServicioActivoDelProfesional(servicio_id, profesional.id);

    if (!servicio) {
      return res.status(400).json({
        error: 'El servicio seleccionado no pertenece al profesional'
      });
    }

    const modalidadElegida = modalidad_atencion || servicio.modalidad_atencion;

    if (!['local', 'domicilio'].includes(modalidadElegida)) {
      return res.status(400).json({
        error: 'La modalidad_atencion debe ser local o domicilio'
      });
    }

    if (servicio.modalidad_atencion !== 'ambas' && modalidadElegida !== servicio.modalidad_atencion) {
      return res.status(400).json({
        error: 'La modalidad elegida no esta disponible para este servicio'
      });
    }

    if (modalidadElegida === 'domicilio' && !direccion_cliente) {
      return res.status(400).json({
        error: 'La direccion_cliente es obligatoria para turnos a domicilio'
      });
    }

    const inicioNuevo = hora_inicio;
    const finNuevo = sumarMinutosAHora(hora_inicio, servicio.duracion_minutos);

    const [turnosExistentes] = await pool.query(
      `SELECT t.id
       FROM turnos t
       INNER JOIN servicios s ON s.id = t.servicio_id
       WHERE t.profesional_id = ?
         AND t.fecha = ?
         AND t.estado IN ('pendiente', 'confirmado')
         AND t.hora_inicio < ?
         AND ADDTIME(t.hora_inicio, SEC_TO_TIME(s.duracion_minutos * 60)) > ?
       LIMIT 1`,
      [profesional.id, fecha, finNuevo, inicioNuevo]
    );

    if (turnosExistentes.length > 0) {
      return res.status(409).json({
        error: 'El horario seleccionado ya no esta disponible'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO turnos (
         profesional_id,
         servicio_id,
         cliente_nombre,
         cliente_email,
         cliente_telefono,
         modalidad_atencion,
         direccion_cliente,
         notas_cliente,
         fecha,
         hora_inicio,
         estado
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        profesional.id,
        servicio.id,
        cliente_nombre,
        cliente_email,
        cliente_telefono || null,
        modalidadElegida,
        modalidadElegida === 'domicilio' ? direccion_cliente : null,
        notas_cliente || null,
        fecha,
        hora_inicio
      ]
    );

    // El email se dispara en background para no bloquear la reserva
    // si la configuración SMTP falla o el proveedor demora en responder.
    enviarEmail({
      para: cliente_email,
      asunto: `Turno reservado con ${profesional.nombre}`,
      html: `
        <h2>¡Tu turno está reservado!</h2>
        <p><strong>Profesional:</strong> ${profesional.nombre}</p>
        <p><strong>Servicio:</strong> ${servicio.nombre}</p>
        <p><strong>Modalidad:</strong> ${modalidadElegida === 'domicilio' ? 'A domicilio' : 'En el local'}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora:</strong> ${hora_inicio}</p>
        <p><strong>Estado:</strong> Pendiente de confirmación</p>
        ${modalidadElegida === 'domicilio' ? `<p><strong>Dirección del cliente:</strong> ${direccion_cliente}</p>` : ''}
        ${modalidadElegida === 'local' && profesional.direccion ? `<p><strong>Dirección:</strong> ${profesional.direccion}</p>` : ''}
        ${notas_cliente ? `<p><strong>Notas:</strong> ${notas_cliente}</p>` : ''}
      `
    });

    return res.status(201).json({
      mensaje: 'Turno reservado correctamente',
      turno_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo reservar el turno'
    });
  }
});

function sumarMinutosAHora(hora, minutos) {
  const [horas, mins] = hora.slice(0, 5).split(':').map(Number);
  const total = (horas * 60) + mins + Number(minutos);
  const horasFinales = Math.floor(total / 60);
  const minutosFinales = total % 60;

  return `${String(horasFinales).padStart(2, '0')}:${String(minutosFinales).padStart(2, '0')}:00`;
}

module.exports = router;
