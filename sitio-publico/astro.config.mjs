// @ts-check
// Configuracion base de Astro para el sitio publico.
// Se agrega la integracion de Vue porque el proyecto usara islas interactivas
// dentro de paginas Astro sin convertir el sitio publico en una SPA completa.
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

import node from '@astrojs/node';
import vue from '@astrojs/vue';

const prerenderEntry = fileURLToPath(new URL('./node_modules/astro/dist/entrypoints/prerender.js', import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [vue()],
  vite: {
    resolve: {
      // Vite/Rollup en Windows no siempre resuelve este export interno cuando Astro compila en modo server.
      // El alias mantiene el build estable sin cambiar dependencias ni tocar rutas de la app.
      alias: {
        'astro/entrypoints/prerender': prerenderEntry
      }
    }
  }
});
