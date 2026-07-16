// composables/useTheme.js
// Maneja el estado del tema visual (claro/oscuro) del panel admin.
// Persiste la eleccion en localStorage y la aplica sobre <html>
// para que el CSS basado en [data-theme='dark'] reaccione de inmediato.

import { computed, ref } from 'vue';

import { getItem, setItem } from '../../ArchivosJS/utils/storage.js';

const tema = ref(getItem('tema') || 'light');

// Aplica el tema sobre el documento y lo persiste.
// Centralizarlo evita que cada componente repita acceso a localStorage y DOM.
function aplicarTema(nuevoTema) {
  tema.value = nuevoTema;

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', nuevoTema);
  }

  setItem('tema', nuevoTema);
}

function toggleTema() {
  aplicarTema(tema.value === 'dark' ? 'light' : 'dark');
}

const esModoOscuro = computed(() => tema.value === 'dark');

export function useTheme() {
  return {
    tema,
    toggleTema,
    esModoOscuro
  };
}
