// api/metricas.js
// Funciones para obtener datos de actividad del profesional.
// El backend calcula estos valores en tiempo real, por eso el frontend
// solo consulta y presenta los resultados sin cache local.

import { API_URL } from '../utils/api.js';
import { isDemoMode } from '../demoMode.js';
import {
  getDemoProximos,
  getDemoResumen
} from '../demoData.js';

// Ejecuta requests autenticadas de metricas y centraliza errores del backend.
// Esto evita repetir codigo de fetch en DashboardPage y MetricasPage.
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
      throw new Error(data.error || 'No se pudo completar la operacion de metricas');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function obtenerResumen(token) {
  if (isDemoMode()) {
    return getDemoResumen();
  }

  try {
    return await hacerRequest('/metricas/resumen', token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function obtenerProximos(token) {
  if (isDemoMode()) {
    return getDemoProximos();
  }

  try {
    return await hacerRequest('/metricas/proximos', token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

export {
  obtenerResumen,
  obtenerProximos
};
