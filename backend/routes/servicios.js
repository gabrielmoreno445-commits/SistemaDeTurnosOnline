// routes/servicios.js
// Gestion de servicios del profesional (corte, consulta, masaje, etc.).
// Todas las rutas requieren autenticacion: solo el profesional gestiona sus servicios.
// Los servicios se leen publicamente desde routes/publico.js sin auth.

const express = require('express');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Busca un servicio del profesional autenticado para reutilizar la validacion de pertenencia.
// Esto evita repetir consultas y asegura que alta, edicion y baja usen el mismo criterio.
async function obtenerServicioDelProfesional(servicioId, profesionalId) {
  const [rows] = await pool.query(
    `SELECT id, profesional_id, nombre, duracion_minutos, precio, activo, created_at
     FROM servicios
     WHERE id = ? AND profesional_id = ?
     LIMIT 1`,
    [servicioId, profesionalId]
  );

  return rows[0] || null;
}

// Valida los datos basicos de un servicio antes de crear o actualizar.
// Mantiene reglas simples para evitar servicios vacios o con duraciones invalidas.
function validarServicio(nombre, duracionMinutos) {
  if (!nombre || !duracionMinutos) {
    return 'Nombre y duracion_minutos son obligatorios';
  }

  if (Number(duracionMinutos) <= 0) {
    return 'La duracion_minutos debe ser mayor a 0';
  }

  return null;
}

// GET /servicios
// Lista los servicios activos del profesional logueado.
// Se filtran solo activos para ocultar bajas logicas sin perder historial.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, profesional_id, nombre, duracion_minutos, precio, activo, created_at
       FROM servicios
       WHERE profesional_id = ? AND activo = 1
       ORDER BY created_at DESC`,
      [req.profesional.id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudieron obtener los servicios'
    });
  }
});

// POST /servicios
// Crea un nuevo servicio para el profesional autenticado.
// profesional_id sale del JWT para impedir altas sobre cuentas ajenas.
router.post('/', async (req, res) => {
  try {
    const { nombre, duracion_minutos, precio } = req.body;
    const errorValidacion = validarServicio(nombre, duracion_minutos);

    if (errorValidacion) {
      return res.status(400).json({
        error: errorValidacion
      });
    }

    const [result] = await pool.query(
      `INSERT INTO servicios (profesional_id, nombre, duracion_minutos, precio)
       VALUES (?, ?, ?, ?)`,
      [req.profesional.id, nombre, Number(duracion_minutos), precio || null]
    );

    const servicioCreado = await obtenerServicioDelProfesional(result.insertId, req.profesional.id);

    return res.status(201).json(servicioCreado);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo crear el servicio'
    });
  }
});

// PUT /servicios/:id
// Edita nombre, duracion o precio solo si el servicio pertenece al profesional logueado.
// La verificacion previa evita modificaciones cruzadas entre profesionales.
router.put('/:id', async (req, res) => {
  try {
    const { nombre, duracion_minutos, precio } = req.body;
    const servicioId = req.params.id;

    const servicio = await obtenerServicioDelProfesional(servicioId, req.profesional.id);

    if (!servicio) {
      return res.status(403).json({
        error: 'No tenes permiso para editar este servicio'
      });
    }

    const nombreActualizado = nombre || servicio.nombre;
    const duracionActualizada = duracion_minutos || servicio.duracion_minutos;
    const errorValidacion = validarServicio(nombreActualizado, duracionActualizada);

    if (errorValidacion) {
      return res.status(400).json({
        error: errorValidacion
      });
    }

    await pool.query(
      `UPDATE servicios
       SET nombre = ?, duracion_minutos = ?, precio = ?
       WHERE id = ? AND profesional_id = ?`,
      [
        nombreActualizado,
        Number(duracionActualizada),
        precio !== undefined ? precio : servicio.precio,
        servicioId,
        req.profesional.id
      ]
    );

    const servicioActualizado = await obtenerServicioDelProfesional(servicioId, req.profesional.id);

    return res.status(200).json(servicioActualizado);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo actualizar el servicio'
    });
  }
});

// DELETE /servicios/:id
// No elimina fisicamente: realiza una baja logica marcando activo = 0.
// Asi se preserva integridad con turnos existentes y se oculta del sitio publico.
router.delete('/:id', async (req, res) => {
  try {
    const servicioId = req.params.id;

    const servicio = await obtenerServicioDelProfesional(servicioId, req.profesional.id);

    if (!servicio) {
      return res.status(403).json({
        error: 'No tenes permiso para desactivar este servicio'
      });
    }

    await pool.query(
      `UPDATE servicios
       SET activo = 0
       WHERE id = ? AND profesional_id = ?`,
      [servicioId, req.profesional.id]
    );

    return res.status(200).json({
      mensaje: 'Servicio desactivado'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo desactivar el servicio'
    });
  }
});

module.exports = router;
