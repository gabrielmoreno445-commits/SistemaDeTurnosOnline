// api/diasBloqueados.js
// Funciones para gestionar las fechas en que el profesional no atiende.
// Estas fechas se reflejan en el sitio publico sin depender de los horarios semanales.

import { API_URL } from '../utils/api.js';
import { isDemoMode } from '../demoMode.js';
import {
  bloquearDemoFecha,
  desbloquearDemoFecha,
  listarDemoDiasBloqueados
} from '../demoData.js';

// Ejecuta requests autenticadas contra dias bloqueados y unifica el manejo de errores.
// Mantiene la capa de vistas enfocada en la UI y no en detalles de red.
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
      throw new Error(data.error || 'No se pudo completar la operacion de dias bloqueados');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function obtenerDiasBloqueados(token) {
  if (isDemoMode()) {
    return listarDemoDiasBloqueados();
  }

  try {
    return await hacerRequest('/dias-bloqueados', token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function bloquearFecha(token, fecha, motivo) {
  if (isDemoMode()) {
    return bloquearDemoFecha(fecha, motivo);
  }

  try {
    return await hacerRequest('/dias-bloqueados', token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fecha, motivo })
    });
  } catch (error) {
    throw error;
  }
}

async function desbloquearFecha(token, id) {
  if (isDemoMode()) {
    return desbloquearDemoFecha(id);
  }

  try {
    return await hacerRequest(`/dias-bloqueados/${id}`, token, {
      method: 'DELETE'
    });
  } catch (error) {
    throw error;
  }
}

export {
  obtenerDiasBloqueados,
  bloquearFecha,
  desbloquearFecha
};
