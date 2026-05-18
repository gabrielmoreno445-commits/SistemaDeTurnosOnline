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
      path: '/metricas',
      component: () => import('../pages/MetricasPage.vue'),
      meta: { requiereAuth: true }
    }
  ]
});

// Guardia de navegacion global.
// Antes de cada cambio de ruta verifica si el profesional esta logueado.
// Si detecta un token persistido pero el store aun no esta hidratado, intenta
// restaurar la sesion antes de decidir la redireccion para soportar recargas.
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

  if (esRutaPublicaDeAuth && authStore.estaLogueado) {
    return next('/');
  }

  return next();
});

export default router;
