// api/perfil.js
// Funciones para actualizar los datos del profesional desde el panel admin.
// Separa la edicion del perfil del cambio de contrasena porque cada endpoint
// del backend tiene validaciones distintas y mensajes de error propios.

import { API_URL } from '../utils/api.js';

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

// Sube la foto como FormData porque el backend espera multipart/form-data.
// No se define Content-Type manualmente para que el navegador agregue el boundary correcto.
async function subirFotoPerfil(token, archivo) {
  try {
    const formData = new FormData();
    formData.append('foto', archivo);

    return await hacerRequest('/perfil/foto', token, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    throw error;
  }
}

async function eliminarFotoPerfil(token) {
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
