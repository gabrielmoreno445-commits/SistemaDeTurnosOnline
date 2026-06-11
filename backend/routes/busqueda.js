// routes/busqueda.js
// Permite buscar profesionales por nombre o especialidad desde el sitio publico.
// Solo devuelve profesionales con onboarding_completado = 1 para evitar mostrar
// perfiles que aun no configuraron servicios y horarios.
// No requiere auth porque lo consume el sitio publico Astro.

const express = require('express');

const pool = require('../db/connection');

const router = express.Router();

// GET /busqueda?q=termino
// Busca profesionales publicados con un termino minimo de dos caracteres.
// Devuelve solo campos publicos para no exponer datos internos de la cuenta.
router.get('/', async (req, res) => {
  try {
    const termino = String(req.query.q || '').trim();

    if (!termino) {
      return res.status(400).json({
        error: 'El parametro q es obligatorio'
      });
    }

    if (termino.length < 2) {
      return res.status(400).json({
        error: 'La busqueda debe tener al menos 2 caracteres'
      });
    }

    const like = `%${termino}%`;

    const [rows] = await pool.query(
      `SELECT p.id, p.nombre, p.especialidad, p.slug, p.foto_url, p.zona_cobertura,
              MAX(CASE WHEN s.modalidad_atencion IN ('local', 'ambas') THEN 1 ELSE 0 END) AS atiende_en_local,
              MAX(CASE WHEN s.modalidad_atencion IN ('domicilio', 'ambas') THEN 1 ELSE 0 END) AS atiende_a_domicilio
       FROM profesionales p
       LEFT JOIN servicios s ON s.profesional_id = p.id AND s.activo = 1
       WHERE p.onboarding_completado = 1
         AND (p.nombre LIKE ? OR p.especialidad LIKE ? OR s.nombre LIKE ?)
       GROUP BY p.id, p.nombre, p.especialidad, p.slug, p.foto_url, p.zona_cobertura
       ORDER BY p.nombre ASC
       LIMIT 20`,
      [like, like, like]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo realizar la busqueda'
    });
  }
});

module.exports = router;
