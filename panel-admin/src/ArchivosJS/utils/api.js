// utils/api.js
// Centraliza la URL base del backend para todo el panel admin.
// En lugar de escribir http://localhost:4000 en cada archivo de api/,
// se importa esta constante. Asi al cambiar el backend en produccion
// solo hay que cambiar la variable de entorno VITE_API_URL.
//
// Vite expone variables que empiezan con VITE_ al codigo del cliente
// via import.meta.env. Variables sin ese prefijo quedan fuera del bundle.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
