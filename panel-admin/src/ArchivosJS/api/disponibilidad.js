// api/disponibilidad.js
// Funciones para configurar los horarios de atencion del profesional.
// dia_semana: 0=Domingo, 1=Lunes, 2=Martes, 3=Miercoles,
//             4=Jueves, 5=Viernes, 6=Sabado

import { API_URL } from '../utils/api.js';
import { isDemoMode } from '../demoMode.js';
import {
  crearDemoBloque,
  eliminarDemoBloque,
  listarDemoDisponibilidad
} from '../demoData.js';

// Ejecuta llamadas autenticadas contra disponibilidad y unifica errores.
// Esto evita repetir parseo JSON y armado de headers en cada funcion publica.
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
      throw new Error(data.error || 'No se pudo completar la operacion de disponibilidad');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function obtenerDisponibilidad(token) {
  if (isDemoMode()) {
    return listarDemoDisponibilidad();
  }

  try {
    return await hacerRequest('/disponibilidad', token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function crearBloque(token, datos) {
  if (isDemoMode()) {
    return crearDemoBloque(datos);
  }

  try {
    return await hacerRequest('/disponibilidad', token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
  } catch (error) {
    throw error;
  }
}

async function eliminarBloque(token, id) {
  if (isDemoMode()) {
    return eliminarDemoBloque(id);
  }

  try {
    return await hacerRequest(`/disponibilidad/${id}`, token, {
      method: 'DELETE'
    });
  } catch (error) {
    throw error;
  }
}

export {
  obtenerDisponibilidad,
  crearBloque,
  eliminarBloque
};
