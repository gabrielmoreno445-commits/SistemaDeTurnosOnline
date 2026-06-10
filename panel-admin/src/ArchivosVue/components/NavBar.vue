<!--
NavBar.vue
Barra de navegacion del panel admin.
Replica el lenguaje del navbar publico para que el cambio entre sitio y panel se sienta continuo.
Usa useAuth para mostrar la sesion activa y cerrar sesion sin acoplarse al store directo.
-->
<script setup>
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import ThemeToggle from './ThemeToggle.vue';
import { useAuth } from '../composables/useAuth.js';

const router = useRouter();
const { profesional, logout } = useAuth();
const menuAbierto = ref(false);
const sitioPublicoUrl = import.meta.env.VITE_SITIO_PUBLICO_URL || 'http://localhost:4321';

const links = [
  { to: '/', label: 'Turnos' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/disponibilidad', label: 'Horarios' },
  { to: '/metricas', label: 'Metricas' },
  { to: '/perfil', label: 'Perfil' }
];

const removerAfterEach = router.afterEach(() => {
  menuAbierto.value = false;
});

onUnmounted(() => {
  removerAfterEach();
});

// Cierra la sesion desde el composable y redirige a login para que la guardia
// vuelva a tomar el control del panel desde un estado limpio.
function cerrarSesion() {
  logout();
  router.push('/login');
}

function toggleMenu() {
  menuAbierto.value = !menuAbierto.value;
}
</script>

<template>
  <header class="site-header animate-in">
    <div class="shell">
      <RouterLink to="/" class="brand">
        <span>Sistema de Turnos Online</span>
        <small>{{ profesional?.nombre || 'Panel admin' }}</small>
      </RouterLink>

      <nav class="site-nav" :class="{ abierto: menuAbierto }" aria-label="Navegacion principal del panel">
        <a :href="sitioPublicoUrl" class="nav-link">
          Inicio
        </a>
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="nav-actions">
        <ThemeToggle />
        <button class="menu-toggle btn" type="button" @click="toggleMenu">
          ☰
        </button>
        <button class="logout-button btn" type="button" @click="cerrarSesion">
          Cerrar sesion
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-sm);
}

.shell {
  width: min(100% - 32px, 1100px);
  min-height: 78px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  color: var(--color-text);
  font-weight: 800;
  text-decoration: none;
}

.brand span,
.brand small {
  display: block;
}

.brand small {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.site-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-left: auto;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color var(--transition),
    color var(--transition);
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(37, 99, 235, 0.12);
  color: var(--color-primary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-toggle,
.logout-button {
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
}

.menu-toggle {
  display: none;
  width: 44px;
  padding: 0;
  font-size: 1.1rem;
}

.logout-button {
  padding: 8px 14px;
}

@media (max-width: 860px) {
  .shell {
    flex-wrap: wrap;
    padding: 14px 0;
  }

  .brand {
    flex: 1 1 calc(100% - 170px);
  }

  .site-nav {
    order: 3;
    display: none;
    width: 100%;
    margin-left: 0;
    padding-top: 4px;
  }

  .site-nav.abierto {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .nav-link {
    width: 100%;
    justify-content: flex-start;
  }

  .menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 540px) {
  .brand {
    flex-basis: 100%;
  }

  .nav-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
