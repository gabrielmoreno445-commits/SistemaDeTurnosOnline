// composables/useAuth.js
// Composable que expone los datos y acciones del authStore de forma simple.
// Equivale a un custom hook de React y evita que cada componente importe
// el store directamente, manteniendo un patron mas consistente en el panel.

import { computed } from 'vue';

import { useAuthStore } from '../stores/authStore.js';

export function useAuth() {
  const store = useAuthStore();

  return {
    profesional: computed(() => store.profesional),
    token: computed(() => store.token),
    estaLogueado: computed(() => store.estaLogueado),
    logout: store.logout
  };
}
