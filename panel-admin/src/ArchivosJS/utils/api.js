// utils/api.js
// Centraliza la URL base del backend para todo el panel admin.
// En lugar de escribir http://localhost:4000 en cada archivo de api/,
// se importa esta constante. Asi al cambiar el backend en produccion
// solo hay que cambiar la variable de entorno VITE_API_URL.
//
// Vite expone variables que empiezan con VITE_ al codigo del cliente
// via import.meta.env. Variables sin ese prefijo quedan fuera del bundle.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TIMEOUT_MS = 8000;

export async function fetchConTimeout(url, opciones = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...opciones,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('El backend no respondio a tiempo. Verifica que Docker este levantado.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
