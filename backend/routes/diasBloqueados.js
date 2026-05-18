// routes/diasBloqueados.js
// Gestiona fechas puntuales en que el profesional no atiende.
// El sitio publico consulta estos datos para bloquear dias completos
// sin alterar la disponibilidad semanal configurada por horario.

const express = require('express');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Normaliza una fecha al formato YYYY-MM-DD para comparaciones simples.
// Se usa para validar que no se bloqueen dias ya pasados desde el backend.
function obtenerFechaHoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Valida que el string recibido tenga formato de fecha y no se desborde.
// Evita aceptar valores ambiguos antes de tocar la base de datos.
function esFechaValida(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(new Date(`${fecha}T00:00:00`).getTime());
}

// Busca un bloqueo puntual del profesional autenticado para reutilizar la validacion de pertenencia.
async function obtenerDiaBloqueado(id, profesionalId) {
  const [rows] = await pool.query(
    `SELECT id, profesional_id, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, motivo, created_at
     FROM dias_bloqueados
     WHERE id = ? AND profesional_id = ?
     LIMIT 1`,
    [id, profesionalId]
  );

  return rows[0] || null;
}

// GET /dias-bloqueados
// Lista las fechas bloqueadas del profesional autenticado ordenadas de la mas cercana a la mas lejana.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, motivo
       FROM dias_bloqueados
       WHERE profesional_id = ?
       ORDER BY fecha ASC`,
      [req.profesional.id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudieron obtener las fechas bloqueadas'
    });
  }
});

// POST /dias-bloqueados
// Crea un bloqueo puntual si la fecha es valida, futura o actual, y aun no existe.
router.post('/', async (req, res) => {
  try {
    const { fecha, motivo } = req.body;

    if (!fecha || !esFechaValida(fecha)) {
      return res.status(400).json({
        error: 'La fecha es obligatoria y debe tener formato YYYY-MM-DD'
      });
    }

    if (fecha < obtenerFechaHoyISO()) {
      return res.status(400).json({
        error: 'No se puede bloquear una fecha anterior a hoy'
      });
    }

    const [existentes] = await pool.query(
      `SELECT id
       FROM dias_bloqueados
       WHERE profesional_id = ? AND fecha = ?
       LIMIT 1`,
      [req.profesional.id, fecha]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        error: 'Esta fecha ya está bloqueada'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO dias_bloqueados (profesional_id, fecha, motivo)
       VALUES (?, ?, ?)`,
      [req.profesional.id, fecha, motivo || null]
    );

    const diaBloqueado = await obtenerDiaBloqueado(result.insertId, req.profesional.id);

    return res.status(201).json({
      id: diaBloqueado.id,
      fecha: diaBloqueado.fecha,
      motivo: diaBloqueado.motivo
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo bloquear la fecha'
    });
  }
});

// DELETE /dias-bloqueados/:id
// Elimina una fecha bloqueada solo si pertenece al profesional autenticado.
router.delete('/:id', async (req, res) => {
  try {
    const bloqueo = await obtenerDiaBloqueado(req.params.id, req.profesional.id);

    if (!bloqueo) {
      return res.status(403).json({
        error: 'No tenes permiso para eliminar esta fecha bloqueada'
      });
    }

    await pool.query(
      `DELETE FROM dias_bloqueados
       WHERE id = ? AND profesional_id = ?`,
      [req.params.id, req.profesional.id]
    );

    return res.status(200).json({
      mensaje: 'Fecha desbloqueada correctamente'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo desbloquear la fecha'
    });
  }
});

module.exports = router;
