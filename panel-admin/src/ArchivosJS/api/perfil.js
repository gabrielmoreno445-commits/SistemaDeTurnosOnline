// api/perfil.js
// Funciones para actualizar los datos del profesional desde el panel admin.
// Separa la edicion del perfil del cambio de contrasena porque cada endpoint
// del backend tiene validaciones distintas y mensajes de error propios.

import { API_URL } from '../utils/api.js';
import { isDemoMode } from '../demoMode.js';
import {
  actualizarDemoPerfil,
  cambiarDemoPassword,
  eliminarDemoFoto,
  subirDemoFoto
} from '../demoData.js';

// Ejecuta una request autenticada de perfil y centraliza el parseo de errores.
// Asi las paginas solo trabajan con datos listos o con una excepcion descriptiva.
async function hacerRequest(ruta, token, opciones = {}) {
  try {
    const response = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.headers || {})
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo completar la operacion de perfil');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function actualizarPerfil(token, datos) {
  if (isDemoMode()) {
    return actualizarDemoPerfil(datos);
  }

  try {
    return await hacerRequest('/perfil', token, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
  } catch (error) {
    throw error;
  }
}

async function cambiarPassword(token, passwordActual, passwordNuevo) {
  if (isDemoMode()) {
    return cambiarDemoPassword();
  }

  try {
    return await hacerRequest('/perfil/password', token, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password_actual: passwordActual,
        password_nuevo: passwordNuevo
      })
    });
  } catch (error) {
    throw error;
  }
}

// Sube la foto en JSON para que el frontend pueda enviar el Base64 del archivo.
// El backend acepta tanto este payload como el multipart/form-data anterior.
async function subirFotoPerfil(token, fotoBase64) {
  if (isDemoMode()) {
    return subirDemoFoto();
  }

  try {
    return await hacerRequest('/perfil/foto', token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        foto: fotoBase64
      })
    });
  } catch (error) {
    throw error;
  }
}

async function eliminarFotoPerfil(token) {
  if (isDemoMode()) {
    return eliminarDemoFoto();
  }

  try {
    return await hacerRequest('/perfil/foto', token, {
      method: 'DELETE'
    });
  } catch (error) {
    throw error;
  }
}

export {
  actualizarPerfil,
  cambiarPassword,
  subirFotoPerfil,
  eliminarFotoPerfil
};
