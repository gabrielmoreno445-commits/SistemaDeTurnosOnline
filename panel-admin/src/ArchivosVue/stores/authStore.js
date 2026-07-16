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
import { obtenerEstado } from '../../ArchivosJS/api/onboarding.js';
import {
  DEMO_TOKEN,
  isDemoMode
} from '../../ArchivosJS/demoMode.js';
import { getItem, removeItem, setItem } from '../../ArchivosJS/utils/storage.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    profesional: null,
    token: null,
    onboardingCompletado: false,
    onboardingVerificado: false,
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
        if (isDemoMode()) {
          const { token, profesional } = await loginProfesional(email, password);

          this.token = token;
          this.profesional = profesional;
          this.onboardingCompletado = true;
          this.onboardingVerificado = true;

          setItem('token', token);
          return;
        }

        const { token, profesional } = await loginProfesional(email, password);

        this.token = token;
        this.profesional = profesional;
        this.onboardingCompletado = false;
        this.onboardingVerificado = false;

        setItem('token', token);
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
      this.onboardingCompletado = false;
      this.onboardingVerificado = false;
      this.error = null;

      removeItem('token');
    },

    // Rehidrata la sesion al abrir la SPA leyendo el token desde localStorage.
    // Si el backend rechaza el token, limpia todo para evitar una UI en falso estado.
    async restaurarSesion() {
      const tokenGuardado = getItem('token');

      if (!tokenGuardado) {
        return;
      }

      this.cargando = true;
      this.error = null;

      try {
        if (isDemoMode() && tokenGuardado === DEMO_TOKEN) {
          const { profesional } = await obtenerProfesionalActual(tokenGuardado);

          this.token = tokenGuardado;
          this.profesional = profesional;
          this.onboardingCompletado = true;
          this.onboardingVerificado = true;
          return;
        }

        const { profesional } = await obtenerProfesionalActual(tokenGuardado);

        this.token = tokenGuardado;
        this.profesional = profesional;
        this.onboardingVerificado = false;
      } catch (error) {
        this.logout();
      } finally {
        this.cargando = false;
      }
    },

    // Consulta una sola vez por sesion si el profesional termino el onboarding.
    // El router usa este dato para redirigir sin pedirle a la API en cada navegacion.
    async verificarOnboarding(token) {
      if (isDemoMode()) {
        this.onboardingCompletado = true;
        this.onboardingVerificado = true;
        return true;
      }

      if (this.onboardingVerificado) {
        return this.onboardingCompletado;
      }

      try {
        const { completado } = await obtenerEstado(token);

        this.onboardingCompletado = completado;
        this.onboardingVerificado = true;

        return completado;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    }
  }
});
