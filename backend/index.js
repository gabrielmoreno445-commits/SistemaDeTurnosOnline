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
const onboardingRoutes = require('./routes/onboarding');
const busquedaRoutes = require('./routes/busqueda');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuracion de CORS actualizada.
// Lee los origenes permitidos desde variables de entorno para que el mismo backend
// acepte localhost en desarrollo y dominios de Vercel en produccion sin cambiar codigo.
const corsOptions = {
  origin(origin, callback) {
    const permitidos = [
      process.env.FRONTEND_URL,
      process.env.SITIO_URL,
      'http://localhost:5173',
      'http://localhost:4321'
    ].filter(Boolean);

    // Requests sin origin vienen de curl, Postman o llamadas server-to-server.
    if (!origin || permitidos.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true
};

app.use(cors(corsOptions));

// Habilita el parseo de JSON para todas las rutas que reciban body.
app.use(express.json());

// Sirve las fotos de perfil subidas como archivos estaticos.
// La URL publica queda disponible para el panel y el sitio publico sin crear una ruta extra.
app.use('/uploads', express.static('uploads'));

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

// Rutas de Fase 3
app.use('/onboarding', onboardingRoutes);
app.use('/busqueda', busquedaRoutes);

app.listen(PORT, () => {
  console.log(`Backend escuchando en el puerto ${PORT}`);
});
