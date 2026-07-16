<!--
LoginPage.vue
Pantalla de acceso para profesionales.
Consume el store de autenticacion para iniciar sesion y reaccionar a errores,
estados de carga y redireccion al dashboard cuando la sesion queda activa.
-->
<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { sincronizarDemoModeDesdeUrl } from '../../ArchivosJS/demoMode.js';
import { getItem } from '../../ArchivosJS/utils/storage.js';
import { useAuthStore } from '../stores/authStore.js';

const router = useRouter();
const authStore = useAuthStore();
const demoActivo = ref(false);

const formulario = reactive({
  email: '',
  password: ''
});

// Envia las credenciales al store para centralizar persistencia y errores.
// Si el login es correcto, la pagina no decide datos de sesion: solo redirige.
async function manejarSubmit() {
  await authStore.login(formulario.email, formulario.password);

  if (authStore.estaLogueado) {
    router.push('/');
  }
}

watch(
  () => authStore.estaLogueado,
  (estaLogueado) => {
    if (estaLogueado) {
      router.push('/');
    }
  },
  { immediate: true }
);

onMounted(() => {
  sincronizarDemoModeDesdeUrl();
  demoActivo.value = getItem('turnos-demo-mode') === '1';

  if (demoActivo.value) {
    formulario.email = 'maria@test.com';
    formulario.password = '12345';
  }
});
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1 class="auth-title">Iniciar sesión</h1>
      <p v-if="demoActivo" class="demo-note">
        Demo local activo. Usa la cuenta de prueba para entrar sin Docker.
      </p>

      <form class="auth-form" @submit.prevent="manejarSubmit">
        <label class="field">
          <span class="field-label">Email</span>
          <input
            v-model="formulario.email"
            class="field-input"
            type="email"
            required
            autocomplete="email"
          />
        </label>

        <label class="field">
          <span class="field-label">Contraseña</span>
          <input
            v-model="formulario.password"
            class="field-input"
            type="password"
            required
            autocomplete="current-password"
          />
        </label>

        <p v-if="authStore.error" class="feedback feedback-error">
          {{ authStore.error }}
        </p>

        <button class="primary-button" type="submit" :disabled="authStore.cargando">
          {{ authStore.cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <p class="auth-link-text">
        ¿No tenés cuenta?
        <RouterLink class="auth-link" to="/register">Registrate</RouterLink>
      </p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-6, 1.5rem);
}

.auth-card {
  width: min(100%, 28rem);
  display: grid;
  gap: var(--space-5, 1.25rem);
  padding: var(--space-6, 1.5rem);
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background-color: var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
}

.auth-title {
  margin: 0;
  font-size: var(--font-size-xl, 1.75rem);
}

.demo-note {
  margin: -8px 0 0;
  color: var(--color-text-muted, #6b7280);
  font-size: var(--font-size-sm, 0.95rem);
}

.auth-form {
  display: grid;
  gap: var(--space-4, 1rem);
}

.field {
  display: grid;
  gap: var(--space-2, 0.5rem);
}

.field-label {
  font-size: var(--font-size-sm, 0.95rem);
}

.field-input {
  width: 100%;
  padding: var(--space-3, 0.75rem);
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
  background-color: var(--color-input-bg, #ffffff);
  color: var(--color-text, #1f2937);
}

.primary-button {
  padding: var(--space-3, 0.75rem);
  border: none;
  border-radius: var(--radius-md, 0.75rem);
  background-color: var(--color-primary, #111827);
  color: var(--color-primary-contrast, #ffffff);
  cursor: pointer;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.feedback {
  margin: 0;
  font-size: var(--font-size-sm, 0.95rem);
}

.feedback-error {
  color: var(--color-danger, #b42318);
}

.auth-link-text {
  margin: 0;
  font-size: var(--font-size-sm, 0.95rem);
}

.auth-link {
  color: var(--color-link, #1d4ed8);
  text-decoration: none;
}
</style>
