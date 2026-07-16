// api/onboarding.js
// Funciones para interactuar con el wizard de onboarding.
// obtenerEstado permite decidir redirecciones desde el router y
// completarOnboarding persiste el cierre del flujo en la base de datos.

import { API_URL, fetchConTimeout } from '../utils/api.js';
import {
  isDemoMode
} from '../demoMode.js';
import {
  getDemoOnboardingEstado
} from '../demoData.js';

// Centraliza requests autenticadas del onboarding para mantener headers y errores consistentes.
async function hacerRequest(ruta, token, opciones = {}) {
  try {
    const response = await fetchConTimeout(`${API_URL}${ruta}`, {
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
  if (isDemoMode()) {
    return getDemoOnboardingEstado();
  }

  try {
    return await hacerRequest('/onboarding/estado', token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function completarOnboarding(token) {
  if (isDemoMode()) {
    return { mensaje: 'Onboarding completado correctamente' };
  }

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
