// index.js
// Punto de entrada del servidor Express.
// Carga variables de entorno, registra middlewares globales y expone endpoints base.
// Para agregar una nueva entidad: importar su router y registrarlo con app.use().
// NUNCA reemplazar este archivo completo: solo agregar imports y app.use() al final de la lista.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const serviciosRoutes = require('./routes/servicios');
const disponibilidadRoutes = require('./routes/disponibilidad');
const turnosRoutes = require('./routes/turnos');
const publicoRoutes = require('./routes/publico');
const perfilRoutes = require('./routes/perfil');
const diasBloqueadosRoutes = require('./routes/diasBloqueados');
const metricasRoutes = require('./routes/metricas');

const app = express();
const PORT = process.env.PORT || 4000;

// Permite que el panel admin y el sitio publico consuman el backend durante desarrollo.
// Se limita a los hosts esperados para no abrir CORS de forma innecesaria.
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4321']
}));

// Habilita el parseo de JSON para todas las rutas que reciban body.
app.use(express.json());

// GET /health
// Ruta publica de verificacion rapida para confirmar que el backend levanto correctamente.
// Devuelve un estado simple que tambien sirve para validar Docker en esta primera etapa.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    proyecto: 'SistemaDeTurnosOnline'
  });
});

// Rutas de autenticacion - publicas excepto /auth/me
app.use('/auth', authRoutes);

// Rutas de gestion - requieren auth dentro de cada router.
app.use('/servicios', serviciosRoutes);
app.use('/disponibilidad', disponibilidadRoutes);
app.use('/turnos', turnosRoutes);

// Rutas publicas consumidas por el sitio Astro.
app.use('/publico', publicoRoutes);

// Rutas de Fase 2
app.use('/perfil', perfilRoutes);
app.use('/dias-bloqueados', diasBloqueadosRoutes);
app.use('/metricas', metricasRoutes);

app.listen(PORT, () => {
  console.log(`Backend escuchando en el puerto ${PORT}`);
});
