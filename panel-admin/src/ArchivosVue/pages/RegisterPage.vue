<!--
RegisterPage.vue
Pantalla de alta inicial de profesionales.
Registra la cuenta y luego inicia sesion automaticamente para llevar
al profesional al wizard de onboarding sin pedirle un login manual.
-->
<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { loginProfesional, registrarProfesional } from '../../ArchivosJS/api/auth.js';
import { useAuthStore } from '../stores/authStore.js';

const router = useRouter();
const authStore = useAuthStore();

const formulario = reactive({
  nombre: '',
  email: '',
  password: '',
  especialidad: '',
  telefono: ''
});

const cargando = ref(false);
const error = ref('');
const mensajeExito = ref('');

// Registra el profesional y usa las mismas credenciales para iniciar sesion.
// Esto mejora la continuidad del alta: la cuenta nueva entra directo a configurar su agenda.
async function manejarSubmit() {
  cargando.value = true;
  error.value = '';
  mensajeExito.value = '';

  try {
    await registrarProfesional({
      nombre: formulario.nombre,
      email: formulario.email,
      password: formulario.password,
      especialidad: formulario.especialidad,
      telefono: formulario.telefono
    });

    const { token, profesional } = await loginProfesional(formulario.email, formulario.password);

    authStore.token = token;
    authStore.profesional = profesional;
    authStore.onboardingCompletado = false;
    authStore.onboardingVerificado = true;
    localStorage.setItem('token', token);

    mensajeExito.value = 'Cuenta creada correctamente';
    router.push('/onboarding');
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1 class="auth-title">Crear cuenta</h1>

      <form class="auth-form" @submit.prevent="manejarSubmit">
        <label class="field">
          <span class="field-label">Nombre completo</span>
          <input
            v-model="formulario.nombre"
            class="field-input"
            type="text"
            required
            autocomplete="name"
          />
        </label>

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
            autocomplete="new-password"
          />
        </label>

        <label class="field">
          <span class="field-label">Especialidad</span>
          <input
            v-model="formulario.especialidad"
            class="field-input"
            type="text"
            placeholder="Ej: Peluquería, Odontología, Psicología"
          />
        </label>

        <label class="field">
          <span class="field-label">Teléfono</span>
          <input
            v-model="formulario.telefono"
            class="field-input"
            type="text"
            autocomplete="tel"
          />
        </label>

        <p v-if="error" class="feedback feedback-error">
          {{ error }}
        </p>

        <p v-if="mensajeExito" class="feedback feedback-success">
          {{ mensajeExito }}
        </p>

        <button class="primary-button" type="submit" :disabled="cargando">
          {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="auth-link-text">
        ¿Ya tenés cuenta?
        <RouterLink class="auth-link" to="/login">Iniciá sesión</RouterLink>
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
  width: min(100%, 32rem);
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

.feedback-success {
  color: var(--color-success, #067647);
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
