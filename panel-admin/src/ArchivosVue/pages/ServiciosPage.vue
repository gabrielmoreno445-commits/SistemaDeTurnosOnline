<!--
ServiciosPage.vue
Permite al profesional crear, editar y desactivar sus servicios.
Un servicio desactivado deja de aparecer en el sitio publico y
en el flujo de reserva, por eso esta pantalla es clave para el negocio.
-->
<script setup>
import { onMounted, reactive, ref } from 'vue';

import {
  crearServicio,
  desactivarServicio,
  editarServicio,
  obtenerServicios
} from '../../ArchivosJS/api/servicios.js';
import NavBar from '../components/NavBar.vue';
import { useAuth } from '../composables/useAuth.js';

const { token } = useAuth();

const servicios = ref([]);
const mostrarFormulario = ref(false);
const editando = ref(null);
const cargando = ref(false);
const error = ref(null);

const formulario = reactive({
  nombre: '',
  duracion_minutos: 30,
  precio: ''
});

// Reconsulta servicios activos del profesional para mantener la lista sincronizada.
// Se reutiliza despues de crear, editar o desactivar para no duplicar logica.
async function cargarServicios() {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    servicios.value = await obtenerServicios(token.value);
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

function limpiarFormulario() {
  formulario.nombre = '';
  formulario.duracion_minutos = 30;
  formulario.precio = '';
  editando.value = null;
}

function abrirNuevoServicio() {
  limpiarFormulario();
  mostrarFormulario.value = true;
}

function cancelarFormulario() {
  limpiarFormulario();
  mostrarFormulario.value = false;
  error.value = null;
}

function iniciarEdicion(servicio) {
  formulario.nombre = servicio.nombre;
  formulario.duracion_minutos = servicio.duracion_minutos;
  formulario.precio = servicio.precio ?? '';
  editando.value = servicio;
  mostrarFormulario.value = true;
  error.value = null;
}

// Guarda un servicio nuevo o existente segun el contexto de edicion activo.
// La misma pantalla usa un solo formulario para evitar duplicar campos y validaciones.
async function guardarServicio() {
  if (!token.value) {
    return;
  }

  if (!formulario.nombre || !formulario.duracion_minutos) {
    error.value = 'Nombre y duracion son obligatorios';
    return;
  }

  cargando.value = true;
  error.value = null;

  const payload = {
    nombre: formulario.nombre,
    duracion_minutos: Number(formulario.duracion_minutos),
    precio: formulario.precio === '' ? null : Number(formulario.precio)
  };

  try {
    if (editando.value) {
      await editarServicio(token.value, editando.value.id, payload);
    } else {
      await crearServicio(token.value, payload);
    }

    cancelarFormulario();
    await cargarServicios();
  } catch (fetchError) {
    error.value = fetchError.message;
    cargando.value = false;
  }
}

async function desactivar(servicioId) {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await desactivarServicio(token.value, servicioId);
    await cargarServicios();
  } catch (fetchError) {
    error.value = fetchError.message;
    cargando.value = false;
  }
}

onMounted(async () => {
  await cargarServicios();
});
</script>

<template>
  <main class="page-shell">
    <section class="page-content">
      <NavBar />

      <section class="panel-card">
        <div class="panel-header">
          <div>
            <h1>Mis servicios</h1>
            <p>Crea, ajusta o desactiva los servicios que ofreces.</p>
          </div>

          <button class="button button--primary" type="button" @click="abrirNuevoServicio">
            Agregar servicio
          </button>
        </div>

        <p v-if="error" class="message message--error">
          {{ error }}
        </p>

        <section v-if="mostrarFormulario" class="form-card">
          <h2>{{ editando ? 'Editar servicio' : 'Nuevo servicio' }}</h2>

          <div class="form-grid">
            <label>
              <span>Nombre</span>
              <input v-model="formulario.nombre" type="text" />
            </label>

            <label>
              <span>Duracion en minutos</span>
              <input v-model="formulario.duracion_minutos" type="number" min="15" step="15" />
            </label>

            <label>
              <span>Precio</span>
              <input v-model="formulario.precio" type="number" min="0" step="0.01" />
            </label>
          </div>

          <div class="actions">
            <button class="button button--primary" type="button" @click="guardarServicio">
              Guardar
            </button>
            <button class="button button--secondary" type="button" @click="cancelarFormulario">
              Cancelar
            </button>
          </div>
        </section>

        <div v-if="cargando && servicios.length === 0" class="cargando-container">
          <span class="spinner"></span>
        </div>

        <p v-else-if="servicios.length === 0" class="message">
          Todavia no tienes servicios activos.
        </p>

        <div v-else class="servicios-grid">
          <article
            v-for="(servicio, index) in servicios"
            :key="servicio.id"
            class="servicio-card card animate-in"
            :style="{ animationDelay: `${index * 60}ms` }"
          >
            <div>
              <h2>{{ servicio.nombre }}</h2>
              <p>{{ servicio.duracion_minutos }} minutos</p>
              <p v-if="servicio.precio !== null && servicio.precio !== undefined">
                ${{ Number(servicio.precio).toLocaleString('es-AR') }}
              </p>
            </div>

            <div class="actions">
              <button class="button button--primary" type="button" @click="iniciarEdicion(servicio)">
                Editar
              </button>
              <button class="button button--danger" type="button" @click="desactivar(servicio.id)">
                Desactivar
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 24px;
  background: var(--color-surface, #f7f7f8);
}

.page-content {
  width: min(100%, 1080px);
  margin: 0 auto;
}

.panel-card,
.form-card,
.servicio-card {
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
}

.panel-card {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: end;
  justify-content: space-between;
}

.panel-header h1,
.panel-header p,
.servicio-card h2,
.servicio-card p,
.form-card h2 {
  margin: 0;
}

.panel-header p {
  color: var(--color-text-muted, #6b7280);
}

.form-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  background: var(--color-surface, #f9fafb);
}

.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid label {
  display: grid;
  gap: 6px;
}

.form-grid span {
  font-weight: 600;
}

.form-grid input {
  padding: 10px 12px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
}

.message {
  padding: 14px;
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-surface, #f3f4f6);
  color: var(--color-text-muted, #6b7280);
}

.message--error {
  background: var(--color-danger-soft, #fef2f2);
  color: var(--color-danger, #b42318);
}

.servicios-grid {
  display: grid;
  gap: 14px;
}

.servicio-card {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button {
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-md, 0.75rem);
  color: var(--color-primary-contrast, #ffffff);
  font-weight: 700;
  cursor: pointer;
}

.button--primary {
  background: var(--color-primary, #111827);
}

.button--secondary {
  background: var(--color-neutral, #475467);
}

.button--danger {
  background: var(--color-danger, #b42318);
}
</style>
