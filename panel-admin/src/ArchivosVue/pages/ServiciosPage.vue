<!--
ServiciosPage.vue
Permite al profesional crear, editar y desactivar sus servicios.
Un servicio desactivado deja de aparecer en el sitio publico y
en el flujo de reserva, por eso esta pantalla es clave para el negocio.
-->
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

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
  duracion_valor: 30,
  duracion_unidad: 'minutos',
  precio: '',
  moneda: 'ARS',
  modalidad_atencion: 'local'
});

const ETIQUETAS_MODALIDAD = {
  local: 'En el local',
  domicilio: 'A domicilio',
  ambas: 'Local + domicilio'
};

const DURACION_PRESETS = [
  { label: '15m', minutos: 15, valor: 15, unidad: 'minutos' },
  { label: '30m', minutos: 30, valor: 30, unidad: 'minutos' },
  { label: '45m', minutos: 45, valor: 45, unidad: 'minutos' },
  { label: '1h', minutos: 60, valor: 1, unidad: 'horas' },
  { label: '1h 30m', minutos: 90, valor: 1.5, unidad: 'horas' }
];

function duracionAminutos() {
  const valor = Number(formulario.duracion_valor);

  if (!Number.isFinite(valor) || valor <= 0) {
    return null;
  }

  return formulario.duracion_unidad === 'horas'
    ? Math.round(valor * 60)
    : Math.round(valor);
}

function formatearDuracion(minutos) {
  const totalMinutos = Number(minutos);

  if (!Number.isFinite(totalMinutos) || totalMinutos <= 0) {
    return 'Duración pendiente';
  }

  if (totalMinutos % 60 === 0) {
    const horas = totalMinutos / 60;
    return `${horas} h`;
  }

  if (totalMinutos > 60) {
    const horas = Math.floor(totalMinutos / 60);
    const minutosRestantes = totalMinutos % 60;
    return `${horas} h ${minutosRestantes} min`;
  }

  return `${totalMinutos} min`;
}

function formatearMonedaVisual(valor, moneda) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return 'Precio a definir';
  }

  const locale = moneda === 'USD' ? 'en-US' : 'es-AR';
  const formateado = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);

  return moneda === 'USD'
    ? `$ ${formateado} USD`
    : `$ ${formateado} ARS`;
}

function aplicarPresetDuracion(preset) {
  formulario.duracion_valor = preset.valor;
  formulario.duracion_unidad = preset.unidad;
}

function descomponerDuracion(minutos) {
  const totalMinutos = Number(minutos);

  if (!Number.isFinite(totalMinutos) || totalMinutos <= 0) {
    return {
      valor: 30,
      unidad: 'minutos'
    };
  }

  if (totalMinutos >= 60) {
    return {
      valor: Number((totalMinutos / 60).toFixed(2)),
      unidad: 'horas'
    };
  }

  return {
    valor: totalMinutos,
    unidad: 'minutos'
  };
}

const duracionEnMinutos = computed(() => duracionAminutos());
const duracionTextoConfirmacion = computed(() => {
  if (!duracionEnMinutos.value) {
    return 'La duración se guardará en minutos.';
  }

  return `Se guardará como ${duracionEnMinutos.value} minutos.`;
});

const precioVisual = computed(() => formatearMonedaVisual(formulario.precio, formulario.moneda));
const precioPreview = computed(() => {
  if (formulario.precio === '' || formulario.precio === null || formulario.precio === undefined) {
    return 'Precio a definir';
  }

  return formatearMonedaVisual(formulario.precio, formulario.moneda);
});

const modalidadPreview = computed(() => ETIQUETAS_MODALIDAD[formulario.modalidad_atencion] || 'En el local');
const nombrePreview = computed(() => formulario.nombre?.trim() || 'Nombre del servicio');

watch(
  () => formulario.duracion_unidad,
  (nuevaUnidad, unidadAnterior) => {
    const valorActual = Number(formulario.duracion_valor);

    if (!Number.isFinite(valorActual) || valorActual <= 0 || !unidadAnterior) {
      return;
    }

    const minutosBase = unidadAnterior === 'horas'
      ? valorActual * 60
      : valorActual;

    formulario.duracion_valor = nuevaUnidad === 'horas'
      ? Number((minutosBase / 60).toFixed(2))
      : Math.round(minutosBase);
  }
);

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
  formulario.duracion_valor = 30;
  formulario.duracion_unidad = 'minutos';
  formulario.precio = '';
  formulario.moneda = 'ARS';
  formulario.modalidad_atencion = 'local';
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
  const duracionEditada = descomponerDuracion(servicio.duracion_minutos);
  formulario.duracion_valor = duracionEditada.valor;
  formulario.duracion_unidad = duracionEditada.unidad;
  formulario.precio = servicio.precio ?? '';
  formulario.moneda = 'ARS';
  formulario.modalidad_atencion = servicio.modalidad_atencion || 'local';
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

  const duracionMinutos = duracionAminutos();

  if (!formulario.nombre || !duracionMinutos) {
    error.value = 'Nombre y duracion son obligatorios';
    return;
  }

  cargando.value = true;
  error.value = null;

  const payload = {
    nombre: formulario.nombre,
    duracion_minutos: duracionMinutos,
    precio: formulario.precio === '' ? null : Number(formulario.precio),
    modalidad_atencion: formulario.modalidad_atencion
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
          <div class="form-card__header">
            <div>
              <h2>{{ editando ? 'Editar servicio' : 'Nuevo servicio' }}</h2>
              <p>Configura duración, precio y modalidad con una vista previa en vivo.</p>
            </div>

            <span class="form-card__badge">{{ editando ? 'Modo edición' : 'Nuevo servicio' }}</span>
          </div>

          <div class="form-layout">
            <section class="form-panel">
              <div class="form-grid">
                <label class="field">
                  <span>Nombre</span>
                  <input v-model="formulario.nombre" type="text" placeholder="Ej. Corte y peinado" />
                </label>

                <div class="field">
                  <span>Duración</span>

                  <div class="duration-control">
                    <input
                      v-model="formulario.duracion_valor"
                      :step="formulario.duracion_unidad === 'horas' ? 0.25 : 1"
                      :min="formulario.duracion_unidad === 'horas' ? 0.25 : 1"
                      type="number"
                    />

                    <select v-model="formulario.duracion_unidad" aria-label="Seleccionar unidad de duración">
                      <option value="minutos">Minutos</option>
                      <option value="horas">Horas</option>
                    </select>
                  </div>

                  <p class="field-hint">{{ duracionTextoConfirmacion }}</p>

                  <div class="quick-chips" aria-label="Duraciones rápidas">
                    <button
                      v-for="preset in DURACION_PRESETS"
                      :key="preset.label"
                      class="chip"
                      :class="{ 'chip--active': duracionEnMinutos === preset.minutos }"
                      type="button"
                      @click="aplicarPresetDuracion(preset)"
                    >
                      {{ preset.label }}
                    </button>
                  </div>
                </div>

                <div class="field">
                  <span>Precio</span>

                  <div class="price-control">
                    <input
                      v-model="formulario.precio"
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder="0,00"
                    />

                    <div class="currency-toggle" role="group" aria-label="Seleccionar moneda">
                      <button
                        class="toggle-badge"
                        :class="{ 'toggle-badge--active': formulario.moneda === 'ARS' }"
                        type="button"
                        @click="formulario.moneda = 'ARS'"
                      >
                        ARS $
                      </button>
                      <button
                        class="toggle-badge"
                        :class="{ 'toggle-badge--active': formulario.moneda === 'USD' }"
                        type="button"
                        @click="formulario.moneda = 'USD'"
                      >
                        USD $
                      </button>
                    </div>
                  </div>

                  <p class="field-hint">{{ precioVisual }}</p>
                </div>

                <div class="field">
                  <span>Modalidad</span>

                  <div class="modalidad-grid">
                    <button
                      class="modalidad-card"
                      :class="{ 'modalidad-card--active': formulario.modalidad_atencion === 'local' }"
                      type="button"
                      @click="formulario.modalidad_atencion = 'local'"
                    >
                      <span class="modalidad-card__icon">🏪</span>
                      <span class="modalidad-card__title">En el local</span>
                      <span class="modalidad-card__subtitle">Atención en tu espacio</span>
                    </button>

                    <button
                      class="modalidad-card"
                      :class="{ 'modalidad-card--active': formulario.modalidad_atencion === 'domicilio' }"
                      type="button"
                      @click="formulario.modalidad_atencion = 'domicilio'"
                    >
                      <span class="modalidad-card__icon">🚗</span>
                      <span class="modalidad-card__title">A domicilio</span>
                      <span class="modalidad-card__subtitle">Te desplazás al cliente</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <aside class="preview-card" aria-live="polite">
              <p class="preview-card__eyebrow">Vista previa</p>
              <h3>{{ nombrePreview }}</h3>
              <p class="preview-card__meta">
                ⏱️ {{ formatearDuracion(duracionEnMinutos || 0) }} · {{ modalidadPreview }}
              </p>
              <p class="preview-card__price">{{ precioPreview }}</p>
              <p class="preview-card__note">
                Así se verá el servicio en la página pública.
              </p>
            </aside>
          </div>

          <div class="actions">
            <button class="button button--primary" type="button" :disabled="cargando" @click="guardarServicio">
              Guardar
            </button>
            <button class="button button--secondary" type="button" :disabled="cargando" @click="cancelarFormulario">
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
              <p>{{ formatearDuracion(servicio.duracion_minutos) }}</p>
              <p v-if="servicio.precio !== null && servicio.precio !== undefined">
                ${{ Number(servicio.precio).toLocaleString('es-AR') }}
              </p>
              <p class="modalidad-pill">
                {{ ETIQUETAS_MODALIDAD[servicio.modalidad_atencion] || 'En el local' }}
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
  padding: 20px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.03), rgba(15, 23, 42, 0)),
    var(--color-surface, #f9fafb);
}

.form-card__header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: start;
  justify-content: space-between;
}

.form-card__header h2,
.preview-card h3 {
  margin: 0;
}

.form-card__header p {
  margin: 4px 0 0;
  color: var(--color-text-muted, #6b7280);
}

.form-card__badge {
  display: inline-flex;
  align-items: center;
  height: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft, #eef4ff);
  color: var(--color-primary, #111827);
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(250px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.form-panel {
  min-width: 0;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
}

.field > span {
  font-weight: 600;
}

.duration-control,
.price-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.duration-control input,
.duration-control select,
.price-control input {
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-input-bg, #ffffff);
  color: var(--color-text, #111827);
}

.duration-control select {
  min-width: 118px;
}

.field-hint {
  margin: 0;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.86rem;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip,
.toggle-badge,
.modalidad-card {
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    box-shadow 140ms ease;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 7px 11px;
  border-color: var(--color-border, #d0d5dd);
  border-radius: 999px;
  background: var(--color-surface-elevated, #ffffff);
  color: var(--color-text, #111827);
  font-size: 0.86rem;
  font-weight: 700;
}

.chip:hover,
.toggle-badge:hover,
.modalidad-card:hover {
  transform: translateY(-1px);
}

.chip--active,
.toggle-badge--active,
.modalidad-card--active {
  border-color: var(--color-primary, #111827);
  background: var(--color-primary-soft, #eef4ff);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary, #111827) 30%, transparent);
}

.currency-toggle {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.toggle-badge {
  min-width: 76px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--color-surface-elevated, #ffffff);
  color: var(--color-text, #111827);
  font-size: 0.82rem;
  font-weight: 800;
}

.modalidad-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.modalidad-card {
  display: grid;
  gap: 6px;
  justify-items: start;
  padding: 14px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface-elevated, #ffffff);
  color: var(--color-text, #111827);
  text-align: left;
}

.modalidad-card__icon {
  font-size: 1.3rem;
  line-height: 1;
}

.modalidad-card__title {
  font-weight: 800;
}

.modalidad-card__subtitle {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.84rem;
}

.preview-card {
  display: grid;
  gap: 10px;
  position: sticky;
  top: 20px;
  padding: 18px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(17, 24, 39, 0.02), rgba(17, 24, 39, 0)),
    var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
}

.preview-card__eyebrow {
  margin: 0;
  color: var(--color-primary, #111827);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-card__meta,
.preview-card__price,
.preview-card__note {
  margin: 0;
}

.preview-card__meta {
  color: var(--color-text-muted, #6b7280);
  font-weight: 600;
}

.preview-card__price {
  font-size: 1.15rem;
  font-weight: 800;
}

.preview-card__note {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.88rem;
}

.field input,
.field select {
  width: 100%;
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

.modalidad-pill {
  display: inline-flex;
  width: fit-content;
  margin-top: 8px;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--color-primary-soft, #eef4ff);
  color: var(--color-primary, #111827);
  font-size: 0.84rem;
  font-weight: 700;
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

@media (max-width: 920px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
  }
}

@media (max-width: 640px) {
  .page-shell {
    padding: 16px;
  }

  .panel-card,
  .form-card {
    padding: 16px;
  }

  .duration-control,
  .price-control {
    grid-template-columns: 1fr;
  }

  .duration-control select {
    min-width: 0;
  }

  .modalidad-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .actions .button {
    width: 100%;
  }
}
</style>
