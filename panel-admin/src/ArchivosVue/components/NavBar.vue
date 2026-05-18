<!--
NavBar.vue
Barra de navegacion del panel admin.
Muestra el profesional logueado y los accesos principales del panel.
Usa useAuth para mantener el acceso a la sesion desacoplado del store directo.
-->
<script setup>
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import ThemeToggle from './ThemeToggle.vue';
import { useAuth } from '../composables/useAuth.js';

const router = useRouter();
const { profesional, logout } = useAuth();
const menuAbierto = ref(false);

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
  <header class="nav-bar animate-in">
    <div class="nav-bar__top">
      <div>
        <p class="nav-bar__eyebrow">Panel admin</p>
        <p class="nav-bar__name">
          {{ profesional?.nombre || 'Profesional' }}
        </p>
      </div>

      <div class="nav-bar__actions">
        <ThemeToggle />
        <button class="hamburguesa btn" type="button" @click="toggleMenu">
          ☰
        </button>
        <button class="nav-bar__logout btn" type="button" @click="cerrarSesion">
          Cerrar sesion
        </button>
      </div>
    </div>

    <nav class="nav-bar__links" :class="{ abierto: menuAbierto }">
      <RouterLink to="/" class="nav-link btn">Turnos de hoy</RouterLink>
      <RouterLink to="/servicios" class="nav-link btn">Mis servicios</RouterLink>
      <RouterLink to="/disponibilidad" class="nav-link btn">Mis horarios</RouterLink>
      <RouterLink to="/metricas" class="nav-link btn">Metricas</RouterLink>
      <RouterLink to="/perfil" class="nav-link btn">Mi perfil</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.nav-bar {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
  padding: 18px 20px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
}

.nav-bar__top {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.nav-bar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-bar__eyebrow {
  margin: 0 0 4px;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.nav-bar__name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text, #111827);
}

.nav-bar__links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.nav-link,
.nav-bar__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: var(--radius-md, 0.75rem);
  border: 1px solid var(--color-border, #d0d5dd);
  background: var(--color-surface, #f7f7f8);
  color: var(--color-text, #111827);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.nav-link.router-link-active {
  border-color: var(--color-primary, #111827);
  background: var(--color-primary, #111827);
  color: var(--color-primary-contrast, #ffffff);
}

.nav-bar__logout {
  background: var(--color-surface-elevated, #ffffff);
}

.hamburguesa {
  display: none;
  min-width: 46px;
  height: 46px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: 999px;
  background: var(--color-surface, #f8fafc);
  color: var(--color-text, #0f172a);
}

@media (max-width: 768px) {
  .nav-bar__top {
    align-items: start;
  }

  .nav-bar__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .nav-bar__links {
    display: none;
    width: 100%;
  }

  .nav-bar__links.abierto {
    display: flex;
    flex-direction: column;
  }

  .nav-link {
    width: 100%;
    justify-content: flex-start;
  }

  .hamburguesa {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

@media (min-width: 769px) {
  .hamburguesa {
    display: none;
  }
}
</style>
