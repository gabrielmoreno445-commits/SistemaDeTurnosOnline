// utils/multerConfig.js
// Configuracion de Multer para la subida de fotos de perfil.
// Multer procesa multipart/form-data antes de llegar a la ruta final.
// Se limita a imagenes y 2MB para reducir riesgo de archivos abusivos.

const path = require('path');

const multer = require('multer');

const storage = multer.diskStorage({
  // Guarda las fotos en una carpeta local del backend que luego Express sirve como estatica.
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },

  // Incluye el id autenticado en el nombre para evitar colisiones entre profesionales.
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `profesional-${req.profesional.id}-${Date.now()}${extension}`);
  }
});

// Rechaza cualquier archivo que no sea una imagen soportada por el sitio.
function filtrarImagen(req, file, cb) {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!tiposPermitidos.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten imagenes JPG, PNG o WebP'));
  }

  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: filtrarImagen,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

module.exports = upload;
