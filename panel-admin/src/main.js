// main.js
// Punto de entrada del panel admin.
// Conecta Vue con Pinia y Vue Router desde la estructura personalizada del proyecto
// para que las siguientes etapas agreguen pantallas y estado sin rehacer el arranque.

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './ArchivosVue/App.vue';
import router from './ArchivosVue/router/index.js';
import './styles/global.css';
import { getItem } from './ArchivosJS/utils/storage.js';

// Aplicar el tema guardado antes de montar la app
// para evitar el flash de modo incorrecto al cargar.
const temaGuardado = getItem('tema') || 'light';

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', temaGuardado);
}

const app = createApp(App);

app.use(createPinia());
app.use(router);

router.isReady()
  .then(() => {
    app.mount('#app');
  })
  .catch((error) => {
    document.querySelector('#app').innerHTML = `
      <main class="boot-error">
        <h1>No se pudo cargar el panel</h1>
        <p>${error.message || 'Error inesperado al iniciar la aplicacion.'}</p>
      </main>
    `;
  });
