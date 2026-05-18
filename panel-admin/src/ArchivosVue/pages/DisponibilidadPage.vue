<!--
DisponibilidadPage.vue
El profesional define en que dias y horarios atiende.
Estos bloques son los que usa el sitio publico para ofrecer
horarios reales al cliente cuando intenta reservar.
-->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  bloquearFecha,
  desbloquearFecha,
  obtenerDiasBloqueados
} from '../../ArchivosJS/api/diasBloqueados.js';
import {
  crearBloque,
  eliminarBloque,
  obtenerDisponibilidad
} from '../../ArchivosJS/api/disponibilidad.js';
import { obtenerFechaLocalISO } from '../../ArchivosJS/utils/fechas.js';
import NavBar from '../components/NavBar.vue';
import { useAuth } from '../composables/useAuth.js';

const { token } = useAuth();

const bloques = ref([]);
const diasBloqueados = ref([]);
const cargando = ref(false);
const error = ref(null);
const cargandoBloqueo = ref(false);
const errorBloqueo = ref(null);

const formulario = reactive({
  dia_semana: 1,
  hora_inicio: '',
  hora_fin: ''
});

const formularioBloqueado = reactive({
  fecha: '',
  motivo: ''
});

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DIAS_FORMULARIO = [1, 2, 3, 4, 5, 6, 0];

// Agrupa los bloques por dia para que la lectura sea mas rapida en el panel.
// Evita que el profesional tenga que reconstruir mentalmente su agenda semanal.
const bloquesAgrupados = computed(() => {
  const grupos = {};

  for (const bloque of bloques.value) {
    const dia = Number(bloque.dia_semana);

    if (!grupos[dia]) {
      grupos[dia] = [];
    }

    grupos[dia].push(bloque);
  }

  return Object.entries(grupos)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([dia, items]) => ({
      dia: Number(dia),
      nombre: DIAS[Number(dia)],
      items
    }));
});

async function cargarBloques() {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    bloques.value = await obtenerDisponibilidad(token.value);
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

async function cargarDiasBloqueados() {
  if (!token.value) {
    return;
  }

  try {
    diasBloqueados.value = await obtenerDiasBloqueados(token.value);
  } catch (fetchError) {
    errorBloqueo.value = fetchError.message;
  }
}

function limpiarFormulario() {
  formulario.dia_semana = 1;
  formulario.hora_inicio = '';
  formulario.hora_fin = '';
}

// Crea un nuevo bloque de atencion y luego actualiza la lista semanal.
// Mantiene la fuente de verdad en el backend para reflejar validaciones reales.
async function agregarBloque() {
  if (!token.value) {
    return;
  }

  if (!formulario.hora_inicio || !formulario.hora_fin) {
    error.value = 'Debes completar hora de inicio y fin';
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await crearBloque(token.value, {
      dia_semana: Number(formulario.dia_semana),
      hora_inicio: formulario.hora_inicio,
      hora_fin: formulario.hora_fin
    });

    limpiarFormulario();
    await cargarBloques();
  } catch (fetchError) {
    error.value = fetchError.message;
    cargando.value = false;
  }
}

async function quitarBloque(id) {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await eliminarBloque(token.value, id);
    await cargarBloques();
  } catch (fetchError) {
    error.value = fetchError.message;
    cargando.value = false;
  }
}

function limpiarFormularioBloqueado() {
  formularioBloqueado.fecha = '';
  formularioBloqueado.motivo = '';
}

function formatearFechaVisible(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Crea un bloqueo puntual para dias especiales sin tocar la grilla semanal.
// Se mantiene separado de disponibilidad para no mezclar reglas recurrentes con excepciones.
async function agregarDiaBloqueado() {
  if (!token.value) {
    return;
  }

  if (!formularioBloqueado.fecha) {
    errorBloqueo.value = 'Debes seleccionar una fecha';
    return;
  }

  cargandoBloqueo.value = true;
  errorBloqueo.value = null;

  try {
    await bloquearFecha(token.value, formularioBloqueado.fecha, formularioBloqueado.motivo);
    limpiarFormularioBloqueado();
    await cargarDiasBloqueados();
  } catch (fetchError) {
    errorBloqueo.value = fetchError.message;
  } finally {
    cargandoBloqueo.value = false;
  }
}

async function quitarDiaBloqueado(id) {
  if (!token.value) {
    return;
  }

  cargandoBloqueo.value = true;
  errorBloqueo.value = null;

  try {
    await desbloquearFecha(token.value, id);
    await cargarDiasBloqueados();
  } catch (fetchError) {
    errorBloqueo.value = fetchError.message;
  } finally {
    cargandoBloqueo.value = false;
  }
}

onMounted(async () => {
  await Promise.allSettled([
    cargarBloques(),
    cargarDiasBloqueados()
  ]);
});
</script>

<template>
  <main class="page-shell">
    <section class="page-content">
      <NavBar />

      <section class="panel-card">
        <div class="panel-header">
          <div>
            <h1>Mis horarios de atencion</h1>
            <p>Configura los bloques semanales visibles en el sitio publico.</p>
          </div>
        </div>

        <p v-if="error" class="message message--error">
          {{ error }}
        </p>

        <section class="form-card">
          <h2>Agregar horario</h2>

          <div class="form-grid">
            <label>
              <span>Dia de la semana</span>
              <select v-model="formulario.dia_semana">
                <option v-for="diaIndice in DIAS_FORMULARIO" :key="diaIndice" :value="diaIndice">
                  {{ DIAS[diaIndice] }}
                </option>
              </select>
            </label>

            <label>
              <span>Hora inicio</span>
              <input v-model="formulario.hora_inicio" type="time" />
            </label>

            <label>
              <span>Hora fin</span>
              <input v-model="formulario.hora_fin" type="time" />
            </label>
          </div>

          <div class="actions">
            <button class="button button--primary" type="button" @click="agregarBloque">
              Agregar horario
            </button>
          </div>
        </section>

        <div v-if="cargando && bloques.length === 0" class="cargando-container">
          <span class="spinner"></span>
        </div>

        <p v-else-if="bloques.length === 0" class="message">
          Todavia no tienes bloques de disponibilidad cargados.
        </p>

        <div v-else class="grupos-grid">
          <section v-for="grupo in bloquesAgrupados" :key="grupo.dia" class="grupo-card">
            <h2>{{ grupo.nombre }}</h2>

            <div class="grupo-items">
            <article v-for="bloque in grupo.items" :key="bloque.id" class="bloque-item card">
                <span>{{ bloque.hora_inicio.slice(0, 5) }} - {{ bloque.hora_fin.slice(0, 5) }}</span>
                <button class="button button--danger" type="button" @click="quitarBloque(bloque.id)">
                  Eliminar
                </button>
              </article>
            </div>
          </section>
        </div>

        <section class="panel-divider" />

        <section class="stack-section">
          <div class="panel-header">
            <div>
              <h2>Dias que no atendes</h2>
              <p>Bloquea fechas específicas como feriados o vacaciones. Tus clientes no podrán reservar en esos días.</p>
            </div>
          </div>

          <p v-if="errorBloqueo" class="message message--error">
            {{ errorBloqueo }}
          </p>

          <section class="form-card">
            <h3>Bloquear fecha</h3>

            <div class="form-grid">
              <label>
                <span>Fecha</span>
                <input v-model="formularioBloqueado.fecha" type="date" :min="obtenerFechaLocalISO()" />
              </label>

              <label>
                <span>Motivo</span>
                <input
                  v-model="formularioBloqueado.motivo"
                  type="text"
                  placeholder="ej: Feriado, Vacaciones..."
                />
              </label>
            </div>

            <div class="actions">
              <button class="button button--primary" type="button" :disabled="cargandoBloqueo" @click="agregarDiaBloqueado">
                {{ cargandoBloqueo ? 'Bloqueando...' : 'Bloquear fecha' }}
              </button>
            </div>
          </section>

          <p v-if="diasBloqueados.length === 0" class="message">
            Todavia no tenes fechas bloqueadas.
          </p>

          <div v-else class="grupos-grid">
            <article v-for="dia in diasBloqueados" :key="dia.id" class="bloque-item">
              <span>
                {{ formatearFechaVisible(dia.fecha) }}<template v-if="dia.motivo"> - {{ dia.motivo }}</template>
              </span>
              <button class="button button--danger" type="button" :disabled="cargandoBloqueo" @click="quitarDiaBloqueado(dia.id)">
                Desbloquear
              </button>
            </article>
          </div>
        </section>
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
.grupo-card {
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

.stack-section {
  display: grid;
  gap: 18px;
}

.panel-header h1,
.panel-header p,
.form-card h2,
.form-card h3,
.grupo-card h2 {
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

.panel-divider {
  height: 1px;
  background: var(--color-border, #d0d5dd);
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

.form-grid input,
.form-grid select {
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

.grupos-grid {
  display: grid;
  gap: 14px;
}

.grupo-card {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.grupo-items {
  display: grid;
  gap: 10px;
}

.bloque-item {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-surface, #f9fafb);
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

.button--danger {
  background: var(--color-danger, #b42318);
}

.button:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
