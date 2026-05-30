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
    `SELECT id, nombre, especialidad, slug, descripcion, direccion, foto_url
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
    `SELECT id, profesional_id, nombre, duracion_minutos, precio, activo
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
      `SELECT id, profesional_id, nombre, duracion_minutos, precio, activo, created_at
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

    const [turnosExistentes] = await pool.query(
      `SELECT id
       FROM turnos
       WHERE profesional_id = ?
         AND fecha = ?
         AND hora_inicio = ?
         AND estado IN ('pendiente', 'confirmado')
       LIMIT 1`,
      [profesional.id, fecha, hora_inicio]
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
         fecha,
         hora_inicio,
         estado
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        profesional.id,
        servicio.id,
        cliente_nombre,
        cliente_email,
        cliente_telefono || null,
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
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora:</strong> ${hora_inicio}</p>
        <p><strong>Estado:</strong> Pendiente de confirmación</p>
        ${profesional.direccion ? `<p><strong>Dirección:</strong> ${profesional.direccion}</p>` : ''}
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

module.exports = router;
