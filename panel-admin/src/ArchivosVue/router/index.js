// router/index.js
// Define las rutas principales del panel admin y protege las vistas privadas.
// Depende del store de autenticacion para decidir si el profesional puede entrar
// al dashboard o si debe ser redirigido a login o register segun su sesion.

import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '../stores/authStore.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue'),
      meta: { requiereAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/RegisterPage.vue')
    },
    {
      path: '/servicios',
      component: () => import('../pages/ServiciosPage.vue'),
      meta: { requiereAuth: true }
    },
    {
      path: '/disponibilidad',
      component: () => import('../pages/DisponibilidadPage.vue'),
      meta: { requiereAuth: true }
    },
    {
      path: '/perfil',
      component: () => import('../pages/PerfilPage.vue'),
      meta: { requiereAuth: true }
    },
    {
      path: '/onboarding',
      component: () => import('../pages/OnboardingPage.vue'),
      meta: { requiereAuth: true, esOnboarding: true }
    },
    {
      path: '/metricas',
      component: () => import('../pages/MetricasPage.vue'),
      meta: { requiereAuth: true }
    }
  ]
});

// Guardia de navegacion global.
// Primero restaura/verifica sesion; despues consulta onboarding una vez por sesion.
// Si el wizard no esta completo, fuerza /onboarding para que el panel no se use
// sin perfil, servicios y horarios minimos configurados.
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const esRutaPublicaDeAuth = to.path === '/login' || to.path === '/register';
  const tokenGuardado = localStorage.getItem('token');

  if (!authStore.estaLogueado && tokenGuardado) {
    await authStore.restaurarSesion();
  }

  if (to.meta.requiereAuth && !authStore.estaLogueado) {
    return next('/login');
  }

  if (authStore.estaLogueado && !esRutaPublicaDeAuth) {
    try {
      await authStore.verificarOnboarding(authStore.token);
    } catch (error) {
      authStore.logout();
      return next('/login');
    }

    if (!authStore.onboardingCompletado && !to.meta.esOnboarding) {
      return next('/onboarding');
    }

    if (authStore.onboardingCompletado && to.meta.esOnboarding) {
      return next('/');
    }
  }

  if (esRutaPublicaDeAuth && authStore.estaLogueado) {
    return next('/');
  }

  return next();
});

export default router;
