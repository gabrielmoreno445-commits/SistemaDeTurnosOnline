<!--
App.vue
Componente raiz del panel admin.
Envuelve el router-view y restaura la sesion una sola vez al montar la SPA
para que la aplicacion recupere el profesional logueado desde localStorage.
-->
<script setup>
import { onMounted } from 'vue';

import { useAuthStore } from './stores/authStore.js';

const authStore = useAuthStore();

onMounted(() => {
  authStore.restaurarSesion();
});
</script>

<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  font-family: var(--font-family-base, Arial, sans-serif);
  background-color: var(--color-surface, #f7f7f8);
  color: var(--color-text, #1f2937);
}
</style>
