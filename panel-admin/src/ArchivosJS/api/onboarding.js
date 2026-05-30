// api/onboarding.js
// Funciones para interactuar con el wizard de onboarding.
// obtenerEstado permite decidir redirecciones desde el router y
// completarOnboarding persiste el cierre del flujo en la base de datos.

import { API_URL } from '../utils/api.js';

// Centraliza requests autenticadas del onboarding para mantener headers y errores consistentes.
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
      throw new Error(data.error || 'No se pudo completar la operacion de onboarding');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function obtenerEstado(token) {
  try {
    return await hacerRequest('/onboarding/estado', token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function completarOnboarding(token) {
  try {
    return await hacerRequest('/onboarding/completar', token, {
      method: 'POST'
    });
  } catch (error) {
    throw error;
  }
}

export {
  obtenerEstado,
  completarOnboarding
};
