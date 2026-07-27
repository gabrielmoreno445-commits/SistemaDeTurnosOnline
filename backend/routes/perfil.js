// routes/perfil.js
// Permite al profesional editar sus datos de perfil y cambiar su password.
// Todas las rutas requieren autenticacion JWT y nunca aceptan profesional_id
// desde el body, porque la identidad ya viene validada por req.profesional.id.

const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');

const pool = require('../db/connection');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');

const router = express.Router();

router.use(authMiddleware);

// Devuelve el perfil persistido del profesional autenticado sin exponer password_hash.
// Se reutiliza luego de actualizar para que la respuesta refleje el estado real en base.
async function obtenerPerfilProfesional(profesionalId) {
  const [rows] = await pool.query(
    `SELECT id, nombre, email, slug, especialidad, telefono, descripcion, direccion, zona_cobertura, foto_url, created_at
     FROM profesionales
     WHERE id = ?
     LIMIT 1`,
    [profesionalId]
  );

  return rows[0] || null;
}

// Borra una foto anterior si pertenece a uploads.
// Se usa para no dejar archivos huerfanos cuando el profesional reemplaza o elimina su avatar.
async function eliminarFotoDelDisco(fotoUrl) {
  if (!fotoUrl) {
    return;
  }

  const nombreArchivo = path.basename(fotoUrl);
  const rutaArchivo = path.join(__dirname, '..', 'uploads', nombreArchivo);

  try {
    await fs.unlink(rutaArchivo);
  } catch (error) {
    // Si el archivo ya no existe, la base igual debe poder quedar consistente.
  }
}

function obtenerExtensionDesdeMime(mimeType) {
  const extensiones = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
  };

  return extensiones[mimeType] || null;
}

function descomponerDataUrl(dataUrl) {
  const coincidencia = String(dataUrl || '').match(/^data:(image\/jpeg|image\/png|image\/webp);base64,(.+)$/i);

  if (!coincidencia) {
    return null;
  }

  return {
    mimeType: coincidencia[1].toLowerCase(),
    base64: coincidencia[2]
  };
}

async function guardarFotoBase64(profesionalId, dataUrl) {
  const partes = descomponerDataUrl(dataUrl);

  if (!partes) {
    throw new Error('El formato de la imagen no es valido');
  }

  const extension = obtenerExtensionDesdeMime(partes.mimeType);

  if (!extension) {
    throw new Error('Solo se permiten imagenes JPG, PNG o WebP');
  }

  const buffer = Buffer.from(partes.base64, 'base64');

  if (buffer.length > 2 * 1024 * 1024) {
    throw new Error('La imagen no puede superar los 2 MB');
  }

  const nombreArchivo = `profesional-${profesionalId}-${Date.now()}${extension}`;
  const rutaArchivo = path.join(__dirname, '..', 'uploads', nombreArchivo);

  await fs.writeFile(rutaArchivo, buffer);

  return {
    fotoUrl: `/uploads/${nombreArchivo}`
  };
}

// PUT /perfil
// Actualiza solo los campos de perfil permitidos que llegan en el body.
// No permite cambiar email ni slug para preservar los identificadores unicos del sistema.
router.put('/', async (req, res) => {
  try {
    const camposPermitidos = ['nombre', 'especialidad', 'telefono', 'descripcion', 'direccion', 'zona_cobertura'];
    const updates = [];
    const valores = [];

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
        updates.push(`${campo} = ?`);
        valores.push(req.body[campo] || null);
      }
    }

    if (updates.length === 0) {
      const perfilActual = await obtenerPerfilProfesional(req.profesional.id);

      return res.status(200).json(perfilActual);
    }

    valores.push(req.profesional.id);

    await pool.query(
      `UPDATE profesionales
       SET ${updates.join(', ')}
       WHERE id = ?`,
      valores
    );

    const perfilActualizado = await obtenerPerfilProfesional(req.profesional.id);

    return res.status(200).json(perfilActualizado);
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo actualizar el perfil'
    });
  }
});

// PUT /perfil/password
// Cambia el password del profesional verificando primero la clave actual.
// Esto evita que un token valido permita reemplazar la contrasena sin conocer la anterior.
router.put('/password', async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;

    if (!password_actual || !password_nuevo) {
      return res.status(400).json({
        error: 'password_actual y password_nuevo son obligatorios'
      });
    }

    const [rows] = await pool.query(
      `SELECT id, password_hash
       FROM profesionales
       WHERE id = ?
       LIMIT 1`,
      [req.profesional.id]
    );

    const profesional = rows[0];

    if (!profesional) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    const passwordValido = await bcrypt.compare(password_actual, profesional.password_hash);

    if (!passwordValido) {
      return res.status(401).json({
        error: 'La contraseña actual es incorrecta'
      });
    }

    const nuevoHash = await bcrypt.hash(password_nuevo, 10);

    await pool.query(
      `UPDATE profesionales
       SET password_hash = ?
       WHERE id = ?`,
      [nuevoHash, req.profesional.id]
    );

    return res.status(200).json({
      mensaje: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo actualizar la contraseña'
    });
  }
});

// POST /perfil/foto
// Recibe una imagen multipart/form-data o un data URL Base64 en JSON.
// Protegida por JWT: valida formato, tamaño y actualiza foto_url sin cambiar
// la ruta pública que ya usa el sitio.
router.post('/foto', (req, res) => {
  const procesarSolicitud = async () => {
    try {
      const [rows] = await pool.query(
        `SELECT foto_url
         FROM profesionales
         WHERE id = ?
         LIMIT 1`,
        [req.profesional.id]
      );

      if (rows.length === 0) {
        if (req.file) {
          await eliminarFotoDelDisco(`/uploads/${req.file.filename}`);
        }

        return res.status(404).json({
          error: 'Profesional no encontrado'
        });
      }

      let fotoUrlNueva = null;

      if (req.file) {
        fotoUrlNueva = `/uploads/${req.file.filename}`;
      } else if (req.body && req.body.foto) {
        const resultado = await guardarFotoBase64(req.profesional.id, req.body.foto);
        fotoUrlNueva = resultado.fotoUrl;
      } else {
        return res.status(400).json({
          error: 'Debes seleccionar una imagen para subir'
        });
      }

      await pool.query(
        `UPDATE profesionales
         SET foto_url = ?
         WHERE id = ?`,
        [fotoUrlNueva, req.profesional.id]
      );

      await eliminarFotoDelDisco(rows[0].foto_url);

      return res.status(200).json({
        foto_url: fotoUrlNueva
      });
    } catch (error) {
      if (req.file) {
        await eliminarFotoDelDisco(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        error: error.message || 'No se pudo actualizar la foto de perfil'
      });
    }
  };

  if (req.is('multipart/form-data')) {
    upload.single('foto')(req, res, async (uploadError) => {
      if (uploadError) {
        return res.status(400).json({
          error: uploadError.message || 'No se pudo subir la foto'
        });
      }

      return procesarSolicitud();
    });
    return;
  }

  procesarSolicitud();
});

// DELETE /perfil/foto
// Elimina la foto actual del profesional autenticado y limpia foto_url en la base.
// Responde 404 si no hay foto para que el frontend pueda mostrar un estado claro.
router.delete('/foto', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT foto_url
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

    if (!rows[0].foto_url) {
      return res.status(404).json({
        error: 'El profesional no tiene foto para eliminar'
      });
    }

    await pool.query(
      `UPDATE profesionales
       SET foto_url = NULL
       WHERE id = ?`,
      [req.profesional.id]
    );

    await eliminarFotoDelDisco(rows[0].foto_url);

    return res.status(200).json({
      mensaje: 'Foto eliminada correctamente'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo eliminar la foto de perfil'
    });
  }
});

module.exports = router;
