// routes/disponibilidad.js
// Define los horarios en que el profesional atiende cada dia de la semana.
// El sitio publico usa estos datos para mostrar horarios reservables al cliente.
// dia_semana: 0=Domingo, 1=Lunes, ..., 6=Sabado

const express = require('express');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Busca un bloque por id restringido al profesional autenticado.
// Sirve para eliminar solo bloques propios sin depender de datos externos.
async function obtenerBloqueDelProfesional(bloqueId, profesionalId) {
  const [rows] = await pool.query(
    `SELECT id, profesional_id, dia_semana, hora_inicio, hora_fin
     FROM disponibilidad
     WHERE id = ? AND profesional_id = ?
     LIMIT 1`,
    [bloqueId, profesionalId]
  );

  return rows[0] || null;
}

// Valida un bloque horario antes de insertarlo o modificarlo.
// Mantiene un formato de agenda coherente y evita rangos imposibles.
function validarDisponibilidad(diaSemana, horaInicio, horaFin) {
  if (
    diaSemana === undefined ||
    diaSemana === null ||
    !horaInicio ||
    !horaFin
  ) {
    return 'dia_semana, hora_inicio y hora_fin son obligatorios';
  }

  const diaNumero = Number(diaSemana);

  if (Number.isNaN(diaNumero) || diaNumero < 0 || diaNumero > 6) {
    return 'dia_semana debe estar entre 0 y 6';
  }

  if (horaInicio >= horaFin) {
    return 'hora_inicio debe ser menor que hora_fin';
  }

  return null;
}

// GET /disponibilidad
// Devuelve todos los bloques del profesional autenticado ordenados por dia y hora.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, profesional_id, dia_semana, hora_inicio, hora_fin
       FROM disponibilidad
       WHERE profesional_id = ?
       ORDER BY dia_semana ASC, hora_inicio ASC`,
      [req.profesional.id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo obtener la disponibilidad'
    });
  }
});

// POST /disponibilidad
// Crea un bloque horario para el profesional autenticado usando su id del JWT.
router.post('/', async (req, res) => {
  try {
    const { dia_semana, hora_inicio, hora_fin } = req.body;
    const errorValidacion = validarDisponibilidad(dia_semana, hora_inicio, hora_fin);

    if (errorValidacion) {
      return res.status(400).json({
        error: errorValidacion
      });
    }

    const [result] = await pool.query(
      `INSERT INTO disponibilidad (profesional_id, dia_semana, hora_inicio, hora_fin)
       VALUES (?, ?, ?, ?)`,
      [req.profesional.id, Number(dia_semana), hora_inicio, hora_fin]
    );

    const bloqueCreado = await obtenerBloqueDelProfesional(result.insertId, req.profesional.id);

    return res.status(201).json(bloqueCreado);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo crear el bloque de disponibilidad'
    });
  }
});

// DELETE /disponibilidad/:id
// Elimina un bloque solo si pertenece al profesional logueado.
router.delete('/:id', async (req, res) => {
  try {
    const bloqueId = req.params.id;
    const bloque = await obtenerBloqueDelProfesional(bloqueId, req.profesional.id);

    if (!bloque) {
      return res.status(403).json({
        error: 'No tenes permiso para eliminar este bloque de disponibilidad'
      });
    }

    await pool.query(
      `DELETE FROM disponibilidad
       WHERE id = ? AND profesional_id = ?`,
      [bloqueId, req.profesional.id]
    );

    return res.status(200).json({
      mensaje: 'Bloque de disponibilidad eliminado'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo eliminar el bloque de disponibilidad'
    });
  }
});

module.exports = router;
