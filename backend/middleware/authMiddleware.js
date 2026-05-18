// middleware/authMiddleware.js
// Protege las rutas privadas verificando el JWT en el header Authorization.
// Depende de jsonwebtoken y de la variable JWT_SECRET para validar que el token
// fue emitido por este backend y no fue alterado entre requests.

const jwt = require('jsonwebtoken');

// Lee el token Bearer, valida su firma y deja los datos del profesional
// disponibles en req.profesional para evitar repetir logica en cada ruta privada.
// Recibe el request actual y continua con next() solo si el token es valido.
function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token inválido o ausente' });
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.profesional = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o ausente' });
  }
}

module.exports = authMiddleware;
