// api/auth.js
// Funciones de comunicacion con el backend para autenticacion.
// Todas las funciones son async y lanzan el error si la respuesta no es ok,
// para que el store o el componente llamador decida como mostrarlo al usuario.

import { API_URL, fetchConTimeout } from '../utils/api.js';

// Ejecuta una llamada al backend de autenticacion y centraliza el parseo JSON.
// Recibe la ruta y la configuracion fetch para evitar duplicar codigo en cada operacion.
// Si la respuesta no es exitosa, lanza el mensaje de error del backend.
async function hacerRequest(ruta, opciones) {
  const response = await fetchConTimeout(`${API_URL}${ruta}`, opciones);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}

// Registra un nuevo profesional en el backend.
// Recibe el objeto completo del formulario porque el endpoint tambien genera
// el slug y persiste los datos opcionales del perfil desde este primer alta.
async function registrarProfesional(datos) {
  return hacerRequest('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datos)
  });
}

// Inicia sesion con email y password y devuelve token mas datos del profesional.
// Existe separada del store para mantener la capa de red desacoplada del estado global.
async function loginProfesional(email, password) {
  return hacerRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
}

// Verifica un token existente y devuelve la sesion actual del profesional.
// Se usa principalmente al restaurar la sesion desde localStorage al reabrir la app.
async function obtenerProfesionalActual(token) {
  return hacerRequest('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export {
  registrarProfesional,
  loginProfesional,
  obtenerProfesionalActual
};
