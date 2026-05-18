// stores/authStore.js
// Store de Pinia que centraliza el estado de autenticacion del profesional.
// Equivale al AuthContext de React y concentra la sesion para que el router,
// las paginas y los componentes puedan reaccionar a login, logout y restauracion.
// Lo consumen: router/index.js, App.vue, Dashboard.vue y cualquier vista privada.

import { defineStore } from 'pinia';

import {
  loginProfesional,
  obtenerProfesionalActual
} from '../../ArchivosJS/api/auth.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    profesional: null,
    token: null,
    cargando: false,
    error: null
  }),

  getters: {
    estaLogueado: (state) => !!state.token
  },

  actions: {
    // Ejecuta el login contra el backend y sincroniza la sesion
    // tanto en el estado global como en localStorage para persistir recargas.
    async login(email, password) {
      this.cargando = true;
      this.error = null;

      try {
        const { token, profesional } = await loginProfesional(email, password);

        this.token = token;
        this.profesional = profesional;

        localStorage.setItem('token', token);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.cargando = false;
      }
    },

    // Cierra la sesion local limpiando el estado reactivo y el token persistido.
    // Se usa tanto por accion explicita del usuario como al detectar token invalido.
    logout() {
      this.profesional = null;
      this.token = null;
      this.error = null;

      localStorage.removeItem('token');
    },

    // Rehidrata la sesion al abrir la SPA leyendo el token desde localStorage.
    // Si el backend rechaza el token, limpia todo para evitar una UI en falso estado.
    async restaurarSesion() {
      const tokenGuardado = localStorage.getItem('token');

      if (!tokenGuardado) {
        return;
      }

      this.cargando = true;
      this.error = null;

      try {
        const { profesional } = await obtenerProfesionalActual(tokenGuardado);

        this.token = tokenGuardado;
        this.profesional = profesional;
      } catch (error) {
        this.logout();
      } finally {
        this.cargando = false;
      }
    }
  }
});
