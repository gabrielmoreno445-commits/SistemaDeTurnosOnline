// demoMode.js
// Utilidades para activar y detectar el modo demo del panel admin.
// Se activa con ?demo=1 en la URL y persiste en localStorage para mantener
// el comportamiento al navegar por la SPA sin depender de Docker.

import { getItem, removeItem, setItem } from './utils/storage.js';

const DEMO_STORAGE_KEY = 'turnos-demo-mode';
const DEMO_TOKEN = 'demo-token';

function isBrowser() {
  return typeof window !== 'undefined';
}

function isDemoMode() {
  return getItem(DEMO_STORAGE_KEY) === '1';
}

function activarDemoMode() {
  setItem(DEMO_STORAGE_KEY, '1');
}

function desactivarDemoMode() {
  removeItem(DEMO_STORAGE_KEY);
}

function sincronizarDemoModeDesdeUrl() {
  if (!isBrowser()) {
    return false;
  }

  const demoEnUrl = new URLSearchParams(window.location.search).get('demo') === '1';

  if (demoEnUrl) {
    activarDemoMode();
  }

  return demoEnUrl || isDemoMode();
}

export {
  DEMO_STORAGE_KEY,
  DEMO_TOKEN,
  activarDemoMode,
  desactivarDemoMode,
  isDemoMode,
  sincronizarDemoModeDesdeUrl
};
