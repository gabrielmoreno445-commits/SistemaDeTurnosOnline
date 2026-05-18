// Configuracion base de Vite para el panel admin.
// Se mantiene minima porque la estructura real de pantallas, stores y rutas
// vive dentro de las carpetas personalizadas definidas por el proyecto.
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
})
