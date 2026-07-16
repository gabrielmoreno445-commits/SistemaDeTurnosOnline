// storage.js
// Helpers seguros para leer y escribir almacenamiento del navegador.
// Evitan que un fallo de localStorage corte el arranque completo de la SPA.

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getItem(clave) {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(clave);
  } catch {
    return null;
  }
}

function setItem(clave, valor) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(clave, valor);
  } catch {
    // Sin persistencia, pero la app sigue funcionando.
  }
}

function removeItem(clave) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(clave);
  } catch {
    // Sin persistencia, pero la app sigue funcionando.
  }
}

export {
  getItem,
  removeItem,
  setItem
};
