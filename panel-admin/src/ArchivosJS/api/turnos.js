// api/turnos.js
// Funciones para ver y gestionar los turnos desde el panel del profesional.
// El parametro fecha es opcional: si no se envia, el backend devuelve los de hoy.

import { API_URL } from '../utils/api.js';

// Ejecuta requests autenticadas de turnos y centraliza errores del backend.
// Mantiene la capa de paginas mas limpia para que solo se enfoque en la UI.
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
      throw new Error(data.error || 'No se pudo completar la operacion sobre turnos');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function obtenerTurnos(token, fecha) {
  try {
    const query = fecha ? `?fecha=${fecha}` : '';

    return await hacerRequest(`/turnos${query}`, token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function cambiarEstadoTurno(token, id, estado) {
  try {
    return await hacerRequest(`/turnos/${id}/estado`, token, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado })
    });
  } catch (error) {
    throw error;
  }
}

export {
  obtenerTurnos,
  cambiarEstadoTurno
};
