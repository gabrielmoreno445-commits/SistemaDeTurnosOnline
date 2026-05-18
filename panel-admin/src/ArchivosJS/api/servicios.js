// api/servicios.js
// Funciones de comunicacion con el backend para gestion de servicios.
// Todas requieren token JWT porque solo el profesional autenticado
// puede administrar su propio catalogo desde el panel admin.
// URL base: http://localhost:4000

const API_URL = 'http://localhost:4000';

// Ejecuta una request autenticada y centraliza el manejo de errores del backend.
// Recibe ruta, token y opciones para no repetir configuracion en cada operacion.
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
      throw new Error(data.error || 'No se pudo completar la operacion con servicios');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function obtenerServicios(token) {
  try {
    return await hacerRequest('/servicios', token, {
      method: 'GET'
    });
  } catch (error) {
    throw error;
  }
}

async function crearServicio(token, datos) {
  try {
    return await hacerRequest('/servicios', token, {
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

async function editarServicio(token, id, datos) {
  try {
    return await hacerRequest(`/servicios/${id}`, token, {
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

async function desactivarServicio(token, id) {
  try {
    return await hacerRequest(`/servicios/${id}`, token, {
      method: 'DELETE'
    });
  } catch (error) {
    throw error;
  }
}

export {
  obtenerServicios,
  crearServicio,
  editarServicio,
  desactivarServicio
};
