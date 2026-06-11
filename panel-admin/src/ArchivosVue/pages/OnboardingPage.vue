<!--
OnboardingPage.vue
Wizard de configuracion inicial para profesionales recien registrados.
Guia al profesional en 4 pasos antes de habilitarle el acceso completo al panel.
Una vez completado, POST /onboarding/completar marca el flag en la DB
y el profesional no vuelve a ver esta pantalla.
-->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { actualizarPerfil } from '../../ArchivosJS/api/perfil.js';
import { crearServicio, obtenerServicios } from '../../ArchivosJS/api/servicios.js';
import {
  crearBloque,
  obtenerDisponibilidad
} from '../../ArchivosJS/api/disponibilidad.js';
import { completarOnboarding } from '../../ArchivosJS/api/onboarding.js';
import { useAuthStore } from '../stores/authStore.js';

const router = useRouter();
const authStore = useAuthStore();

const pasoActual = ref(1);
const cargando = ref(false);
const error = ref(null);
const servicios = ref([]);
const bloques = ref([]);

const pasos = reactive([
  { numero: 1, titulo: 'Tu perfil', completado: false },
  { numero: 2, titulo: 'Tus servicios', completado: false },
  { numero: 3, titulo: 'Tus horarios', completado: false },
  { numero: 4, titulo: 'Listo', completado: false }
]);

const perfil = reactive({
  nombre: '',
  especialidad: '',
  descripcion: '',
  direccion: '',
  zona_cobertura: 'Eldorado, Misiones y hasta 15 km a la redonda',
  telefono: ''
});

const nuevoServicio = reactive({
  nombre: '',
  duracion_minutos: 30,
  precio: '',
  modalidad_atencion: 'local'
});

const ETIQUETAS_MODALIDAD = {
  local: 'En el local',
  domicilio: 'A domicilio',
  ambas: 'Local + domicilio'
};

const nuevoBloque = reactive({
  dia_semana: 1,
  hora_inicio: '',
  hora_fin: ''
});

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DIAS_FORMULARIO = [1, 2, 3, 4, 5, 6, 0];

const linkPublico = computed(() => {
  const slug = authStore.profesional?.slug || '';
  return `http://localhost:4321/${slug}`;
});

// Sincroniza el estado visual de los pasos para que el profesional vea avance real.
function actualizarPasosCompletados() {
  for (const paso of pasos) {
    paso.completado = paso.numero < pasoActual.value;
  }
}

function precargarPerfil() {
  perfil.nombre = authStore.profesional?.nombre || '';
  perfil.especialidad = authStore.profesional?.especialidad || '';
  perfil.descripcion = authStore.profesional?.descripcion || '';
  perfil.direccion = authStore.profesional?.direccion || '';
  perfil.zona_cobertura = authStore.profesional?.zona_cobertura || 'Eldorado, Misiones y hasta 15 km a la redonda';
  perfil.telefono = authStore.profesional?.telefono || '';
}

async function cargarDatosIniciales() {
  if (!authStore.token) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    const [perfilActual, serviciosActuales, bloquesActuales] = await Promise.all([
      actualizarPerfil(authStore.token, {}),
      obtenerServicios(authStore.token),
      obtenerDisponibilidad(authStore.token)
    ]);

    authStore.profesional = {
      ...authStore.profesional,
      ...perfilActual
    };

    servicios.value = serviciosActuales;
    bloques.value = bloquesActuales;
    precargarPerfil();
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

// Guarda el perfil minimo antes de avanzar porque el link publico necesita datos confiables.
async function continuarPerfil() {
  if (!authStore.token || !perfil.nombre) {
    error.value = 'El nombre es obligatorio';
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    const perfilActualizado = await actualizarPerfil(authStore.token, perfil);

    authStore.profesional = {
      ...authStore.profesional,
      ...perfilActualizado
    };

    pasoActual.value = 2;
    actualizarPasosCompletados();
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

async function agregarServicio() {
  if (!authStore.token) {
    return;
  }

  if (!nuevoServicio.nombre || !nuevoServicio.duracion_minutos) {
    error.value = 'Nombre y duracion son obligatorios';
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await crearServicio(authStore.token, {
      nombre: nuevoServicio.nombre,
      duracion_minutos: Number(nuevoServicio.duracion_minutos),
      precio: nuevoServicio.precio === '' ? null : Number(nuevoServicio.precio),
      modalidad_atencion: nuevoServicio.modalidad_atencion
    });

    nuevoServicio.nombre = '';
    nuevoServicio.duracion_minutos = 30;
    nuevoServicio.precio = '';
    nuevoServicio.modalidad_atencion = 'local';
    servicios.value = await obtenerServicios(authStore.token);
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

function continuarServicios() {
  if (servicios.value.length === 0) {
    error.value = 'Debes crear al menos un servicio';
    return;
  }

  error.value = null;
  pasoActual.value = 3;
  actualizarPasosCompletados();
}

async function agregarHorario() {
  if (!authStore.token) {
    return;
  }

  if (!nuevoBloque.hora_inicio || !nuevoBloque.hora_fin) {
    error.value = 'Debes completar hora de inicio y fin';
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await crearBloque(authStore.token, {
      dia_semana: Number(nuevoBloque.dia_semana),
      hora_inicio: nuevoBloque.hora_inicio,
      hora_fin: nuevoBloque.hora_fin
    });

    nuevoBloque.dia_semana = 1;
    nuevoBloque.hora_inicio = '';
    nuevoBloque.hora_fin = '';
    bloques.value = await obtenerDisponibilidad(authStore.token);
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

function continuarHorarios() {
  if (bloques.value.length === 0) {
    error.value = 'Debes crear al menos un horario de atencion';
    return;
  }

  error.value = null;
  pasoActual.value = 4;
  actualizarPasosCompletados();
}

// Cierra el wizard en backend y actualiza el store para que la guardia permita entrar al panel.
async function finalizarOnboarding() {
  if (!authStore.token) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await completarOnboarding(authStore.token);
    authStore.onboardingCompletado = true;
    authStore.onboardingVerificado = true;
    pasos[3].completado = true;
    router.push('/');
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

onMounted(async () => {
  precargarPerfil();
  await cargarDatosIniciales();
});
</script>

<template>
  <main class="onboarding-page">
    <section class="onboarding-shell">
      <header class="onboarding-header">
        <div>
          <p>Configuracion inicial</p>
          <h1>Preparemos tu agenda</h1>
        </div>
      </header>

      <nav class="steps" aria-label="Progreso del onboarding">
        <span
          v-for="paso in pasos"
          :key="paso.numero"
          class="step"
          :class="{ 'step--active': paso.numero === pasoActual, 'step--done': paso.completado }"
        >
          <strong>{{ paso.numero }}</strong>
          {{ paso.titulo }}
        </span>
      </nav>

      <p v-if="error" class="message message--error">
        {{ error }}
      </p>

      <section v-if="pasoActual === 1" class="panel-card">
        <div class="panel-header">
          <h2>Tu perfil</h2>
          <p>Estos datos aparecen en tu pagina publica y ayudan a que tus clientes te identifiquen.</p>
        </div>

        <div class="form-grid">
          <label>
            <span>Nombre</span>
            <input v-model="perfil.nombre" type="text" required />
          </label>

          <label>
            <span>Especialidad</span>
            <input v-model="perfil.especialidad" type="text" />
          </label>

          <label>
            <span>Telefono</span>
            <input v-model="perfil.telefono" type="text" />
          </label>

          <label>
            <span>Direccion</span>
            <input v-model="perfil.direccion" type="text" />
          </label>

          <label>
            <span>Zona de cobertura</span>
            <input v-model="perfil.zona_cobertura" type="text" />
          </label>

          <label class="form-grid__full">
            <span>Descripcion</span>
            <textarea v-model="perfil.descripcion" rows="4" />
          </label>
        </div>

        <div class="actions">
          <button class="button button--primary" type="button" :disabled="cargando" @click="continuarPerfil">
            {{ cargando ? 'Guardando...' : 'Continuar' }}
          </button>
        </div>
      </section>

      <section v-if="pasoActual === 2" class="panel-card">
        <div class="panel-header">
          <h2>Tus servicios</h2>
          <p>Agrega al menos un servicio para que tus clientes puedan reservar.</p>
        </div>

        <div class="inline-form">
          <input v-model="nuevoServicio.nombre" type="text" placeholder="Nombre del servicio" />
          <input v-model="nuevoServicio.duracion_minutos" type="number" min="15" step="15" />
          <input v-model="nuevoServicio.precio" type="number" min="0" step="0.01" placeholder="Precio" />
          <select v-model="nuevoServicio.modalidad_atencion">
            <option value="local">En el local</option>
            <option value="domicilio">A domicilio</option>
            <option value="ambas">Local + domicilio</option>
          </select>
          <button class="button button--secondary" type="button" :disabled="cargando" @click="agregarServicio">
            Agregar
          </button>
        </div>

        <div class="items-list">
          <article v-for="servicio in servicios" :key="servicio.id" class="item-row">
            <span>{{ servicio.nombre }}</span>
            <small>
              {{ servicio.duracion_minutos }} minutos ·
              {{ ETIQUETAS_MODALIDAD[servicio.modalidad_atencion] || 'En el local' }}
            </small>
          </article>
        </div>

        <div class="actions">
          <button
            class="button button--primary"
            type="button"
            :disabled="servicios.length === 0"
            @click="continuarServicios"
          >
            Continuar
          </button>
        </div>
      </section>

      <section v-if="pasoActual === 3" class="panel-card">
        <div class="panel-header">
          <h2>Tus horarios</h2>
          <p>Agrega al menos un bloque semanal de atencion.</p>
        </div>

        <div class="inline-form">
          <select v-model="nuevoBloque.dia_semana">
            <option v-for="diaIndice in DIAS_FORMULARIO" :key="diaIndice" :value="diaIndice">
              {{ DIAS[diaIndice] }}
            </option>
          </select>
          <input v-model="nuevoBloque.hora_inicio" type="time" />
          <input v-model="nuevoBloque.hora_fin" type="time" />
          <button class="button button--secondary" type="button" :disabled="cargando" @click="agregarHorario">
            Agregar
          </button>
        </div>

        <div class="items-list">
          <article v-for="bloque in bloques" :key="bloque.id" class="item-row">
            <span>{{ DIAS[Number(bloque.dia_semana)] }}</span>
            <small>{{ bloque.hora_inicio.slice(0, 5) }} - {{ bloque.hora_fin.slice(0, 5) }}</small>
          </article>
        </div>

        <div class="actions">
          <button
            class="button button--primary"
            type="button"
            :disabled="bloques.length === 0"
            @click="continuarHorarios"
          >
            Continuar
          </button>
        </div>
      </section>

      <section v-if="pasoActual === 4" class="panel-card">
        <div class="panel-header">
          <h2>Listo, {{ authStore.profesional?.nombre }}</h2>
          <p>Tu pagina publica esta lista para recibir reservas.</p>
        </div>

        <p class="public-link">
          Tu pagina publica esta lista:
          <a :href="linkPublico" target="_blank" rel="noreferrer">{{ linkPublico }}</a>
        </p>

        <div class="actions">
          <button class="button button--primary" type="button" :disabled="cargando" @click="finalizarOnboarding">
            {{ cargando ? 'Finalizando...' : 'Ir a mi panel' }}
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  padding: 24px;
  background: var(--color-surface, #f7f7f8);
}

.onboarding-shell {
  width: min(100%, 960px);
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.onboarding-header h1,
.onboarding-header p,
.panel-header h2,
.panel-header p {
  margin: 0;
}

.onboarding-header p,
.panel-header p {
  color: var(--color-text-muted, #6b7280);
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.step {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-surface-elevated, #ffffff);
  color: var(--color-text-muted, #6b7280);
}

.step strong {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 999px;
  background: var(--color-surface, #f3f4f6);
}

.step--active,
.step--done {
  color: var(--color-text, #111827);
  border-color: var(--color-primary, #111827);
}

.panel-card {
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
}

.form-grid {
  display: grid;
  gap: 14px;
}

.form-grid label {
  display: grid;
  gap: 6px;
}

.form-grid__full {
  grid-column: 1 / -1;
}

.inline-form {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 0.8fr auto;
  gap: 10px;
}

input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-input-bg, #ffffff);
  color: var(--color-text, #0f172a);
}

.items-list {
  display: grid;
  gap: 10px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-surface, #f3f4f6);
}

.message {
  padding: 14px;
  border-radius: var(--radius-md, 0.75rem);
}

.message--error {
  background: var(--color-danger-soft, #fef2f2);
  color: var(--color-danger, #b42318);
}

.public-link {
  display: grid;
  gap: 8px;
  margin: 0;
}

.public-link a {
  color: var(--color-link, #1d4ed8);
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

.button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .steps,
  .inline-form {
    grid-template-columns: 1fr;
  }
}
</style>
