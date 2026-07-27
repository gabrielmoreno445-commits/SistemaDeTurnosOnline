// api/turnos.js
// Funciones para ver y gestionar los turnos desde el panel del profesional.
// El parametro fecha es opcional: si no se envia, el backend devuelve los de hoy.

import { API_URL } from '../utils/api.js';
import { isDemoMode } from '../demoMode.js';
import {
  cambiarDemoEstadoTurno,
  listarDemoTurnos
} from '../demoData.js';

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

async function obtenerTurnos(token, fechaOFiltros, filtrosAdicionales = {}) {
  if (isDemoMode()) {
    if (fechaOFiltros && typeof fechaOFiltros === 'object' && !Array.isArray(fechaOFiltros)) {
      return listarDemoTurnos(fechaOFiltros);
    }

    const filtros = {
      ...(filtrosAdicionales || {})
    };

    if (typeof fechaOFiltros === 'string' && fechaOFiltros) {
      filtros.fecha = fechaOFiltros;
    }

    return listarDemoTurnos(filtros);
  }

  try {
    const filtros = {
      ...(filtrosAdicionales || {})
    };

    if (fechaOFiltros && typeof fechaOFiltros === 'object' && !Array.isArray(fechaOFiltros)) {
      Object.assign(filtros, fechaOFiltros);
    } else if (typeof fechaOFiltros === 'string' && fechaOFiltros) {
      filtros.fecha = fechaOFiltros;
    }

    const params = new URLSearchParams();

    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params.set(clave, valor);
      }
    }

    const query = params.toString() ? `?${params.toString()}` : '';

    return await hacerRequest(`/turnos${query}`, token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function cambiarEstadoTurno(token, id, estado) {
  if (isDemoMode()) {
    return cambiarDemoEstadoTurno(id, estado);
  }

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
