// routes/metricas.js
// Expone metricas de actividad del profesional para el dashboard.
// Todas se calculan en tiempo real con MySQL para mantener la logica simple
// mientras el volumen del proyecto sigue siendo bajo.

const express = require('express');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /metricas/resumen
// Resume el mes actual agrupando estados e ingresos estimados de turnos confirmados.
router.get('/resumen', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total_turnos,
         SUM(CASE WHEN t.estado = 'confirmado' THEN 1 ELSE 0 END) AS turnos_confirmados,
         SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END) AS turnos_cancelados,
         SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) AS turnos_pendientes,
         COALESCE(SUM(CASE WHEN t.estado = 'confirmado' THEN COALESCE(s.precio, 0) ELSE 0 END), 0) AS ingresos_estimados
       FROM turnos t
       INNER JOIN servicios s ON s.id = t.servicio_id
       WHERE t.profesional_id = ?
         AND DATE_FORMAT(t.fecha, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')`,
      [req.profesional.id]
    );

    const resumen = rows[0] || {};

    return res.status(200).json({
      total_turnos: Number(resumen.total_turnos || 0),
      turnos_confirmados: Number(resumen.turnos_confirmados || 0),
      turnos_cancelados: Number(resumen.turnos_cancelados || 0),
      turnos_pendientes: Number(resumen.turnos_pendientes || 0),
      ingresos_estimados: Number(resumen.ingresos_estimados || 0)
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo obtener el resumen de métricas'
    });
  }
});

// GET /metricas/proximos
// Devuelve hasta 5 turnos confirmados futuros para destacar la agenda inmediata.
router.get('/proximos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.fecha, t.hora_inicio, t.cliente_nombre, t.modalidad_atencion,
              t.direccion_cliente, s.nombre AS servicio_nombre
       FROM turnos t
       INNER JOIN servicios s ON s.id = t.servicio_id
       WHERE t.profesional_id = ?
         AND t.estado = 'confirmado'
         AND t.fecha >= CURDATE()
       ORDER BY t.fecha ASC, t.hora_inicio ASC
       LIMIT 5`,
      [req.profesional.id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudieron obtener los próximos turnos'
    });
  }
});

module.exports = router;
