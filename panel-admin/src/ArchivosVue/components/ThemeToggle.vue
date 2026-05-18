<!--
ThemeToggle.vue
Boton que alterna entre modo claro y oscuro.
Usa useTheme para leer y cambiar el estado visual sin acoplarse
directamente a localStorage ni al documento.
-->
<script setup>
import { useTheme } from '../composables/useTheme.js';

const { esModoOscuro, toggleTema } = useTheme();
</script>

<template>
  <button class="theme-toggle btn" type="button" @click="toggleTema">
    {{ esModoOscuro ? '☀️' : '🌙' }}
  </button>
</template>

<style scoped>
.theme-toggle {
  min-width: 46px;
  height: 46px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}
</style>
