// routes/turnos.js
// Gestion de turnos desde el panel del profesional.
// La creacion de turnos por parte del cliente va en routes/publico.js sin auth.
// Aqui solo el profesional puede ver y cambiar el estado de sus turnos.

const express = require('express');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');
const { enviarEmail } = require('../utils/email');

const router = express.Router();

router.use(authMiddleware);

const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'cancelado'];

// Busca un turno puntual del profesional con el nombre del servicio asociado.
// Se usa para validar pertenencia y devolver una respuesta completa al panel.
async function obtenerTurnoDelProfesional(turnoId, profesionalId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.profesional_id, t.servicio_id, t.cliente_nombre, t.cliente_email,
            t.cliente_telefono, t.fecha, t.hora_inicio, t.estado, t.created_at,
            s.nombre AS servicio_nombre
     FROM turnos t
     INNER JOIN servicios s ON s.id = t.servicio_id
     WHERE t.id = ? AND t.profesional_id = ?
     LIMIT 1`,
    [turnoId, profesionalId]
  );

  return rows[0] || null;
}

// GET /turnos
// Lista los turnos del profesional autenticado para una fecha dada.
// Si no llega fecha, usa el dia actual como vista inicial del panel.
router.get('/', async (req, res) => {
  try {
    const { fecha, estado, servicio_id, desde, hasta } = req.query;
    const condiciones = ['t.profesional_id = ?'];
    const valores = [req.profesional.id];

    // Filtros opcionales: fecha (dia exacto), desde/hasta (rango),
    // estado y servicio_id. Se construye la query dinamicamente
    // segun que params lleguen. Si no llega ninguno: devuelve los de hoy.
    const hayFiltrosNoFecha = Boolean(estado || servicio_id);

    if (desde && hasta) {
      condiciones.push('t.fecha BETWEEN ? AND ?');
      valores.push(desde, hasta);
    } else if (fecha) {
      condiciones.push('t.fecha = ?');
      valores.push(fecha);
    } else if (!hayFiltrosNoFecha) {
      condiciones.push('t.fecha = ?');
      valores.push(new Date().toISOString().slice(0, 10));
    }

    if (estado) {
      condiciones.push('t.estado = ?');
      valores.push(estado);
    }

    if (servicio_id) {
      condiciones.push('t.servicio_id = ?');
      valores.push(Number(servicio_id));
    }

    const [rows] = await pool.query(
      `SELECT t.id, t.profesional_id, t.servicio_id, t.cliente_nombre, t.cliente_email,
              t.cliente_telefono, t.fecha, t.hora_inicio, t.estado, t.created_at,
              s.nombre AS servicio_nombre
       FROM turnos t
       INNER JOIN servicios s ON s.id = t.servicio_id
       WHERE ${condiciones.join(' AND ')}
       ORDER BY t.fecha ASC, t.hora_inicio ASC`,
      valores
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudieron obtener los turnos'
    });
  }
});

// PUT /turnos/:id/estado
// Cambia el estado de un turno solo si pertenece al profesional autenticado.
// Restringe el valor a los estados admitidos por la tabla y la logica de agenda.
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const turnoId = req.params.id;

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        error: 'El estado debe ser pendiente, confirmado o cancelado'
      });
    }

    const turno = await obtenerTurnoDelProfesional(turnoId, req.profesional.id);

    if (!turno) {
      return res.status(403).json({
        error: 'No tenes permiso para modificar este turno'
      });
    }

    await pool.query(
      `UPDATE turnos
       SET estado = ?
       WHERE id = ? AND profesional_id = ?`,
      [estado, turnoId, req.profesional.id]
    );

    const turnoActualizado = await obtenerTurnoDelProfesional(turnoId, req.profesional.id);

    if (estado === 'confirmado') {
      enviarEmail({
        para: turnoActualizado.cliente_email,
        asunto: `Tu turno con ${req.profesional.nombre} fue confirmado`,
        html: `
          <h2>¡Tu turno fue confirmado!</h2>
          <p><strong>Cliente:</strong> ${turnoActualizado.cliente_nombre}</p>
          <p><strong>Servicio:</strong> ${turnoActualizado.servicio_nombre}</p>
          <p><strong>Fecha:</strong> ${turnoActualizado.fecha}</p>
          <p><strong>Hora:</strong> ${turnoActualizado.hora_inicio.slice(0, 5)}</p>
          <p><strong>Estado:</strong> Confirmado</p>
        `
      });
    }

    return res.status(200).json(turnoActualizado);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo actualizar el estado del turno'
    });
  }
});

module.exports = router;
