// api/perfil.js
// Funciones para actualizar los datos del profesional desde el panel admin.
// Separa la edicion del perfil del cambio de contrasena porque cada endpoint
// del backend tiene validaciones distintas y mensajes de error propios.

const API_URL = 'http://localhost:4000';

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

export {
  actualizarPerfil,
  cambiarPassword
};
