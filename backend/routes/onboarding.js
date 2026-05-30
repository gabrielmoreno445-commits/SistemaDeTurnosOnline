// routes/onboarding.js
// Controla el estado del wizard de configuracion inicial del profesional.
// El onboarding guia al profesional recien registrado para que configure
// perfil, servicios y horarios antes de recibir su primer turno.
// Todas las rutas requieren JWT porque el estado pertenece a la cuenta logueada.

const express = require('express');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /onboarding/estado
// Devuelve si el profesional autenticado ya completo el wizard inicial.
// Consulta la base de datos para que el estado sea compartido entre dispositivos.
router.get('/estado', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT onboarding_completado
       FROM profesionales
       WHERE id = ?
       LIMIT 1`,
      [req.profesional.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    return res.status(200).json({
      completado: Boolean(rows[0].onboarding_completado)
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo obtener el estado del onboarding'
    });
  }
});

// POST /onboarding/completar
// Marca el wizard como completado para liberar el acceso normal al panel.
// Usa req.profesional.id desde el JWT para impedir que se complete otra cuenta.
router.post('/completar', async (req, res) => {
  try {
    await pool.query(
      `UPDATE profesionales
       SET onboarding_completado = 1
       WHERE id = ?`,
      [req.profesional.id]
    );

    return res.status(200).json({
      mensaje: 'Onboarding completado correctamente'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo completar el onboarding'
    });
  }
});

module.exports = router;
