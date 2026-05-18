// routes/auth.js
// Maneja el registro, login y lectura de sesion actual del profesional.
// POST /auth/register y POST /auth/login son publicos porque crean o inician sesion.
// GET /auth/me es privado y reutiliza los datos ya validados por el JWT.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Convierte un nombre humano en un slug URL-friendly.
// Recibe un string y devuelve una version normalizada en minusculas,
// sin tildes ni caracteres especiales que rompan una URL publica.
function generarSlugBase(nombre) {
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Busca un slug disponible para que la URL publica del profesional sea unica.
// Si el slug base ya existe, agrega un sufijo incremental (-2, -3, etc.)
// hasta encontrar una variante que no este ocupada en la tabla profesionales.
async function generarSlugUnico(nombre) {
  const slugBase = generarSlugBase(nombre);
  let slug = slugBase;
  let contador = 2;

  while (true) {
    const [rows] = await pool.query(
      'SELECT id FROM profesionales WHERE slug = ? LIMIT 1',
      [slug]
    );

    if (rows.length === 0) {
      return slug;
    }

    slug = `${slugBase}-${contador}`;
    contador += 1;
  }
}

// POST /auth/register
// Crea un nuevo profesional validando campos obligatorios, email unico
// y slug publico unico antes de guardar el password ya hasheado.
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, especialidad, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Nombre, email y password son obligatorios'
      });
    }

    const [profesionalesExistentes] = await pool.query(
      'SELECT id FROM profesionales WHERE email = ? LIMIT 1',
      [email]
    );

    if (profesionalesExistentes.length > 0) {
      return res.status(400).json({
        error: 'Ya existe un profesional registrado con ese email'
      });
    }

    const slug = await generarSlugUnico(nombre);
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO profesionales (nombre, email, password_hash, slug, especialidad, telefono)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, email, passwordHash, slug, especialidad || null, telefono || null]
    );

    return res.status(201).json({
      mensaje: 'Profesional registrado correctamente',
      slug
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo registrar el profesional'
    });
  }
});

// POST /auth/login
// Verifica credenciales contra la base y devuelve un JWT de 7 dias
// junto con los datos publicos del profesional que el frontend necesita mostrar.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT id, nombre, email, password_hash, slug, especialidad
       FROM profesionales
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const profesional = rows[0];
    const passwordValido = await bcrypt.compare(password, profesional.password_hash);

    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id: profesional.id,
      nombre: profesional.nombre,
      email: profesional.email,
      slug: profesional.slug,
      especialidad: profesional.especialidad
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      profesional: payload
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo iniciar sesión'
    });
  }
});

// GET /auth/me
// Ruta privada que devuelve la sesion actual desde req.profesional.
// No consulta la base porque el token ya fue validado por authMiddleware.
router.get('/me', authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({
      profesional: req.profesional
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo obtener la sesión actual'
    });
  }
});

module.exports = router;
