// utils/fechas.js
// Helpers puros para trabajar con fechas en la UI del panel admin.
// Centraliza el formato YYYY-MM-DD en horario local para evitar desfasajes
// provocados por toISOString(), que siempre usa UTC.

// Devuelve la fecha local de hoy en formato YYYY-MM-DD.
// Se usa en inputs type="date" para que la pantalla coincida con el huso horario real.
function obtenerFechaLocalISO(fechaBase = new Date()) {
  const offset = fechaBase.getTimezoneOffset() * 60000;

  return new Date(fechaBase.getTime() - offset).toISOString().slice(0, 10);
}

export {
  obtenerFechaLocalISO
};
