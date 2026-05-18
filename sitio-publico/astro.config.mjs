// @ts-check
// Configuracion base de Astro para el sitio publico.
// Se agrega la integracion de Vue porque el proyecto usara islas interactivas
// dentro de paginas Astro sin convertir el sitio publico en una SPA completa.
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [vue()]
});
