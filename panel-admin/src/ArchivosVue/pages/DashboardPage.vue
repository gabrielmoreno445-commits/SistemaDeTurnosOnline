<!--
DashboardPage.vue
Vista principal de Mis Turnos.
Prioriza los turnos reservados con una agenda clara y deja la grilla como
una capa visual de contexto para ver ocupados y libres sin ruido.
-->
<script setup>
import { computed, onMounted, ref, watch } from 'vue';

import { obtenerResumen } from '../../ArchivosJS/api/metricas.js';
import { obtenerServicios } from '../../ArchivosJS/api/servicios.js';
import { cambiarEstadoTurno, obtenerTurnos } from '../../ArchivosJS/api/turnos.js';
import { obtenerDisponibilidad } from '../../ArchivosJS/api/disponibilidad.js';
import { obtenerFechaLocalISO } from '../../ArchivosJS/utils/fechas.js';
import MetricaCard from '../components/MetricaCard.vue';
import NavBar from '../components/NavBar.vue';
import { useAuth } from '../composables/useAuth.js';

const { token } = useAuth();

const turnos = ref([]);
const servicios = ref([]);
const disponibilidad = ref([]);
const fecha = ref(obtenerFechaLocalISO());
const vistaActiva = ref('agenda');
const resumen = ref(null);
const cargandoTurnos = ref(false);
const cargandoInicial = ref(false);
const error = ref(null);
const aviso = ref(null);

const VISTAS = [
  { id: 'agenda', label: 'Vista Agenda' },
  { id: 'grilla', label: 'Vista Grilla' }
];

const ETIQUETAS_MODALIDAD = {
  local: 'En el local',
  domicilio: 'A domicilio',
  ambas: 'Mixta'
};

const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado'
};

const ESTILOS_ESTADO = {
  pendiente: 'badge--pendiente',
  confirmado: 'badge--confirmado',
  cancelado: 'badge--cancelado'
};

let idSolicitudTurnos = 0;

function capitalizar(texto) {
  if (!texto) {
    return '';
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFechaExtendida(fechaISO) {
  const fechaVisible = new Date(`${fechaISO}T00:00:00`);

  return capitalizar(
    fechaVisible.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  );
}

function formatearHora(hora) {
  return hora ? hora.slice(0, 5) : '--:--';
}

function formatearRango(inicio, fin) {
  return `${formatearHora(inicio)} - ${formatearHora(fin)}`;
}

function formatearMoneda(valor) {
  return `$${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(valor)}`;
}

function obtenerDiaSemana(fechaISO) {
  return new Date(`${fechaISO}T00:00:00`).getDay();
}

function horaAMinutos(hora) {
  const [horas, minutos] = hora.slice(0, 5).split(':').map(Number);
  return (horas * 60) + minutos;
}

function minutosAHora(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function sumarMinutos(hora, minutos) {
  return minutosAHora(horaAMinutos(hora) + minutos);
}

function calcularMcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const resto = x % y;
    x = y;
    y = resto;
  }

  return x || 30;
}

function solapaIntervalos(inicioA, finA, inicioB, finB) {
  return inicioA < finB && finA > inicioB;
}

function agruparSegmentos(segmentos) {
  const agrupados = [];

  for (const segmento of segmentos) {
    const anterior = agrupados[agrupados.length - 1];
    const puedeFusionar = anterior
      && anterior.tipo === segmento.tipo
      && anterior.fin === segmento.inicio
      && (
        segmento.tipo === 'libre'
        || anterior.turno?.id === segmento.turno?.id
      );

    if (puedeFusionar) {
      anterior.fin = segmento.fin;
      anterior.unidades += segmento.unidades;
      continue;
    }

    agrupados.push({
      ...segmento,
      unidades: 1
    });
  }

  return agrupados;
}

const serviciosPorId = computed(() => {
  return new Map(
    servicios.value.map((servicio) => [
      servicio.id,
      {
        ...servicio,
        duracion_minutos: Number(servicio.duracion_minutos),
        precio: Number(servicio.precio || 0)
      }
    ])
  );
});

const duracionBase = computed(() => {
  const duraciones = servicios.value
    .map((servicio) => Number(servicio.duracion_minutos))
    .filter((duracion) => Number.isFinite(duracion) && duracion > 0);

  if (duraciones.length === 0) {
    return 30;
  }

  return duraciones.reduce((acumulado, duracion) => calcularMcd(acumulado, duracion));
});

const fechaVisible = computed(() => formatearFechaExtendida(fecha.value));

const turnosDia = computed(() => {
  const turnosReservados = turnos.value.filter((turno) => turno.estado !== 'cancelado');

  return [...turnosReservados].sort((a, b) => {
    const ordenFecha = `${a.fecha} ${a.hora_inicio}`.localeCompare(`${b.fecha} ${b.hora_inicio}`);
    return ordenFecha;
  });
});

const bloquesDelDia = computed(() => {
  const diaSemana = obtenerDiaSemana(fecha.value);

  return disponibilidad.value
    .filter((bloque) => Number(bloque.dia_semana) === diaSemana)
    .map((bloque) => ({
      ...bloque,
      hora_inicio: bloque.hora_inicio.slice(0, 5),
      hora_fin: bloque.hora_fin.slice(0, 5)
    }))
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
});

const slotsBase = computed(() => {
  if (!bloquesDelDia.value.length) {
    return [];
  }

  const quantum = duracionBase.value;
  const ocupados = turnosDia.value
    .map((turno) => {
      const servicio = serviciosPorId.value.get(turno.servicio_id);
      const duracion = Number(servicio?.duracion_minutos || quantum);
      const inicio = horaAMinutos(turno.hora_inicio);

      return {
        turno,
        servicio,
        inicio,
        fin: inicio + duracion,
        duracion
      };
    })
    .sort((a, b) => a.inicio - b.inicio);

  const segmentos = [];

  for (const bloque of bloquesDelDia.value) {
    let minutoActual = horaAMinutos(bloque.hora_inicio);
    const minutoFin = horaAMinutos(bloque.hora_fin);

    while ((minutoActual + quantum) <= minutoFin) {
      const inicio = minutoActual;
      const fin = minutoActual + quantum;
      const ocupacion = ocupados.find((turno) => solapaIntervalos(inicio, fin, turno.inicio, turno.fin));

      segmentos.push(
        ocupacion
          ? {
              tipo: 'ocupado',
              inicio,
              fin,
              turno: ocupacion.turno,
              servicio: ocupacion.servicio
            }
          : {
              tipo: 'libre',
              inicio,
              fin
            }
      );

      minutoActual += quantum;
    }
  }

  return agruparSegmentos(segmentos);
});

const segmentosGrilla = computed(() => slotsBase.value);

const turnosOcupados = computed(() => turnosDia.value.length);

const slotsDisponibles = computed(() => {
  return slotsBase.value
    .filter((segmento) => segmento.tipo === 'libre')
    .reduce((total, segmento) => total + segmento.unidades, 0);
});

const ingresosEstimados = computed(() => {
  return turnosDia.value.reduce((total, turno) => {
    const servicio = serviciosPorId.value.get(turno.servicio_id);
    return total + Number(servicio?.precio || 0);
  }, 0);
});

const valorIngresos = computed(() => {
  if (!servicios.value.length) {
    return '—';
  }

  return formatearMoneda(ingresosEstimados.value);
});

function obtenerClaseEstado(estado) {
  return ESTILOS_ESTADO[estado] || 'badge--cancelado';
}

function obtenerEtiquetaEstado(estado) {
  return ETIQUETAS_ESTADO[estado] || estado;
}

function obtenerEtiquetaModalidad(modalidad) {
  return ETIQUETAS_MODALIDAD[modalidad] || ETIQUETAS_MODALIDAD.local;
}

async function cargarResumenRapido() {
  if (!token.value) {
    return;
  }

  try {
    resumen.value = await obtenerResumen(token.value);
  } catch (fetchError) {
    resumen.value = null;
  }
}

async function cargarServiciosBase() {
  if (!token.value) {
    return;
  }

  try {
    servicios.value = await obtenerServicios(token.value);
  } catch (fetchError) {
    servicios.value = [];
    aviso.value = 'No se pudieron cargar los servicios. El ingreso estimado puede verse incompleto.';
  }
}

async function cargarDisponibilidadBase() {
  if (!token.value) {
    return;
  }

  try {
    disponibilidad.value = await obtenerDisponibilidad(token.value);
  } catch (fetchError) {
    disponibilidad.value = [];
    aviso.value = 'No se pudo cargar la disponibilidad semanal. La vista grilla puede quedar limitada.';
  }
}

async function cargarTurnosDia() {
  if (!token.value) {
    return;
  }

  const idSolicitud = ++idSolicitudTurnos;

  cargandoTurnos.value = true;
  error.value = null;

  try {
    const turnosObtenidos = await obtenerTurnos(token.value, fecha.value);

    if (idSolicitud !== idSolicitudTurnos) {
      return;
    }

    turnos.value = turnosObtenidos;
  } catch (fetchError) {
    if (idSolicitud !== idSolicitudTurnos) {
      return;
    }

    turnos.value = [];
    error.value = fetchError.message;
  } finally {
    if (idSolicitud === idSolicitudTurnos) {
      cargandoTurnos.value = false;
    }
  }
}

async function inicializarVista() {
  if (!token.value) {
    return;
  }

  cargandoInicial.value = true;
  aviso.value = null;

  try {
    await Promise.allSettled([
      cargarResumenRapido(),
      cargarServiciosBase(),
      cargarDisponibilidadBase(),
      cargarTurnosDia()
    ]);
  } finally {
    cargandoInicial.value = false;
  }
}

async function actualizarEstado(turnoId, estado) {
  if (!token.value) {
    return;
  }

  cargandoTurnos.value = true;
  error.value = null;

  try {
    await cambiarEstadoTurno(token.value, turnoId, estado);
    await cargarTurnosDia();
    await cargarResumenRapido();
  } catch (fetchError) {
    error.value = fetchError.message;
    cargandoTurnos.value = false;
  }
}

watch(token, async (nuevoToken) => {
  if (nuevoToken) {
    await inicializarVista();
  }
}, { immediate: true });

watch(fecha, async () => {
  await cargarTurnosDia();
});
</script>

<template>
  <main class="page-shell">
    <section class="page-content">
      <NavBar />

      <section class="panel-card panel-card--agenda" :aria-busy="cargandoInicial || cargandoTurnos">
        <header class="hero-header">
          <div class="hero-copy">
            <p class="eyebrow">Mis turnos</p>
            <h1>Agenda del dia</h1>
            <p>
              Revisa primero los turnos reservados y cambia a la grilla solo cuando necesites ver
              la disponibilidad completa.
            </p>
          </div>

          <label class="date-field">
            <span>Fecha</span>
            <input v-model="fecha" type="date" />
          </label>
        </header>

        <div class="summary-row metricas-grid">
          <MetricaCard
            class="animate-in"
            style="animation-delay: 0ms;"
            titulo="Turnos ocupados"
            :valor="turnosOcupados"
            color="var(--color-primary)"
          />
          <MetricaCard
            class="animate-in"
            style="animation-delay: 80ms;"
            titulo="Disponibles"
            :valor="slotsDisponibles"
            color="var(--color-accent)"
          />
          <MetricaCard
            class="animate-in"
            style="animation-delay: 160ms;"
            titulo="Ingresos estimados"
            :valor="valorIngresos"
            color="var(--color-warning)"
          />
        </div>

        <div class="tabs" role="tablist" aria-label="Cambiar vista de turnos">
          <button
            v-for="vista in VISTAS"
            :key="vista.id"
            type="button"
            class="tab-button"
            :class="{ 'tab-button--active': vistaActiva === vista.id }"
            @click="vistaActiva = vista.id"
          >
            {{ vista.label }}
          </button>
        </div>

        <p v-if="error" class="message message--error">
          {{ error }}
        </p>

        <p v-else-if="aviso" class="message message--info">
          {{ aviso }}
        </p>

        <p v-if="cargandoTurnos && !cargandoInicial" class="loading-note">
          Actualizando la agenda...
        </p>

        <section v-if="vistaActiva === 'agenda'" class="vista-panel">
          <div v-if="turnosDia.length === 0 && !cargandoTurnos" class="empty-state">
            <h2>No hay turnos reservados para esta fecha</h2>
            <p>La vista agenda solo muestra turnos ocupados para reducir ruido visual.</p>
          </div>

          <div v-else class="turnos-lista">
            <article
              v-for="(turno, index) in turnosDia"
              :key="turno.id"
              class="turno-card turno-card--agenda card animate-in"
              :style="{ animationDelay: `${index * 60}ms` }"
            >
              <div class="turno-card__top">
                <div>
                  <p class="turno-hora">{{ formatearHora(turno.hora_inicio) }}</p>
                  <h2>{{ turno.cliente_nombre }}</h2>
                </div>

                <span class="badge" :class="obtenerClaseEstado(turno.estado)">
                  {{ obtenerEtiquetaEstado(turno.estado) }}
                </span>
              </div>

              <div class="turno-card__details">
                <p><strong>Servicio:</strong> {{ turno.servicio_nombre }}</p>
                <p><strong>Modalidad:</strong> {{ obtenerEtiquetaModalidad(turno.modalidad_atencion) }}</p>
                <p v-if="turno.cliente_email"><strong>Email:</strong> {{ turno.cliente_email }}</p>
                <p v-if="turno.cliente_telefono"><strong>Telefono:</strong> {{ turno.cliente_telefono }}</p>
                <p v-if="turno.direccion_cliente"><strong>Direccion:</strong> {{ turno.direccion_cliente }}</p>
                <p v-if="turno.notas_cliente"><strong>Notas:</strong> {{ turno.notas_cliente }}</p>
              </div>

              <div class="turno-card__actions">
                <button
                  v-if="turno.estado === 'pendiente'"
                  type="button"
                  class="button button--primary"
                  :disabled="cargandoTurnos"
                  @click="actualizarEstado(turno.id, 'confirmado')"
                >
                  Confirmar
                </button>
                <button
                  v-if="turno.estado !== 'cancelado'"
                  type="button"
                  class="button button--danger"
                  :disabled="cargandoTurnos"
                  @click="actualizarEstado(turno.id, 'cancelado')"
                >
                  Cancelar
                </button>
              </div>
            </article>
          </div>
        </section>

        <section v-else class="vista-panel">
          <div v-if="bloquesDelDia.length === 0" class="empty-state">
            <h2>No hay bloques de atencion para este dia</h2>
            <p>Revisá la sección Horarios para cargar disponibilidad y volver a ver la grilla.</p>
          </div>

          <div v-else-if="segmentosGrilla.length === 0" class="empty-state">
            <h2>No hay slots calculables para esta fecha</h2>
            <p>La disponibilidad existe, pero no quedaron slots dentro de la duracion base actual.</p>
          </div>

          <div v-else class="grilla-agenda">
            <article
              v-for="(segmento, index) in segmentosGrilla"
              :key="`${segmento.tipo}-${segmento.inicio}-${segmento.fin}-${segmento.turno?.id || 'libre'}`"
              class="slot-card card animate-in"
              :class="segmento.tipo === 'ocupado' ? 'slot-card--ocupado' : 'slot-card--libre'"
              :style="{ animationDelay: `${index * 45}ms` }"
            >
              <div class="slot-card__top">
                <div>
                  <p class="slot-hora">{{ formatearRango(minutosAHora(segmento.inicio), minutosAHora(segmento.fin)) }}</p>
                  <span class="slot-dia">{{ fechaVisible }}</span>
                </div>

                <span
                  v-if="segmento.tipo === 'ocupado'"
                  class="badge"
                  :class="obtenerClaseEstado(segmento.turno.estado)"
                >
                  {{ obtenerEtiquetaEstado(segmento.turno.estado) }}
                </span>

                <span v-else class="slot-pill">
                  + Disponible
                </span>
              </div>

              <template v-if="segmento.tipo === 'ocupado'">
                <h2>{{ segmento.turno.cliente_nombre }}</h2>
                <div class="slot-meta">
                  <p><strong>Servicio:</strong> {{ segmento.turno.servicio_nombre }}</p>
                  <p><strong>Modalidad:</strong> {{ obtenerEtiquetaModalidad(segmento.turno.modalidad_atencion) }}</p>
                </div>
                <div class="slot-extra">
                  <p v-if="segmento.turno.direccion_cliente"><strong>Direccion:</strong> {{ segmento.turno.direccion_cliente }}</p>
                  <p v-if="segmento.turno.notas_cliente"><strong>Notas:</strong> {{ segmento.turno.notas_cliente }}</p>
                </div>
                <div class="turno-card__actions">
                  <button
                    v-if="segmento.turno.estado === 'pendiente'"
                    type="button"
                    class="button button--primary"
                    :disabled="cargandoTurnos"
                    @click="actualizarEstado(segmento.turno.id, 'confirmado')"
                  >
                    Confirmar
                  </button>
                  <button
                    v-if="segmento.turno.estado !== 'cancelado'"
                    type="button"
                    class="button button--danger"
                    :disabled="cargandoTurnos"
                    @click="actualizarEstado(segmento.turno.id, 'cancelado')"
                  >
                    Cancelar
                  </button>
                </div>
              </template>

              <template v-else>
                <h2>Espacio libre</h2>
                <div class="slot-meta">
                  <p>Slot disponible dentro del bloque de atencion.</p>
                </div>
              </template>
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
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28%),
    radial-gradient(circle at top right, rgba(6, 118, 71, 0.12), transparent 24%),
    var(--color-surface, #f7f7f8);
}

.page-content {
  width: min(100%, 1080px);
  margin: 0 auto;
}

.panel-card {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 24%),
    var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
}

.hero-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.hero-copy {
  max-width: 640px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1,
.hero-copy p,
.turno-card h2,
.turno-card p,
.slot-card h2,
.slot-card p,
.empty-state h2,
.empty-state p {
  margin: 0;
}

.hero-copy h1 {
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  line-height: 1;
}

.hero-copy p {
  margin-top: 10px;
  color: var(--color-text-muted, #64748b);
}

.date-field {
  display: grid;
  gap: 6px;
  min-width: 220px;
}

.date-field span {
  font-weight: 700;
}

.date-field input {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-input-bg, #ffffff);
  color: var(--color-text);
}

.summary-row {
  margin-bottom: 2px;
}

.tabs {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
  width: fit-content;
  flex-wrap: wrap;
}

.tab-button {
  min-height: 40px;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font-weight: 800;
  cursor: pointer;
}

.tab-button--active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
}

.message {
  padding: 14px 16px;
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-surface, #f3f4f6);
  color: var(--color-text-muted, #6b7280);
}

.message--error {
  background: var(--color-danger-soft, #fef2f2);
  color: var(--color-danger, #b42318);
}

.message--info {
  background: var(--color-accent-soft, rgba(6, 118, 71, 0.14));
  color: var(--color-accent, #067647);
}

.loading-note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.vista-panel {
  display: grid;
  gap: 14px;
}

.empty-state {
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px dashed var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: rgba(148, 163, 184, 0.06);
}

.empty-state p {
  color: var(--color-text-muted);
}

.turnos-lista {
  display: grid;
  gap: 14px;
}

.turno-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface, #f9fafb);
}

.turno-card--agenda {
  border-left: 4px solid var(--color-primary);
}

.turno-card__top,
.slot-card__top {
  display: flex;
  gap: 12px;
  align-items: start;
  justify-content: space-between;
}

.turno-hora,
.slot-hora {
  margin-bottom: 4px;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.turno-card__details,
.slot-meta,
.slot-extra {
  display: grid;
  gap: 6px;
}

.slot-meta p,
.slot-extra p {
  color: var(--color-text-muted);
}

.turno-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button {
  min-height: 42px;
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-md, 0.75rem);
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;
}

.button--primary {
  background: var(--color-primary, #111827);
}

.button--danger {
  background: var(--color-danger, #b42318);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: capitalize;
}

.badge--pendiente {
  background: var(--color-warning-soft, #fffaeb);
  color: var(--color-warning, #b54708);
}

.badge--confirmado {
  background: var(--color-success-soft, #ecfdf3);
  color: var(--color-success, #067647);
}

.badge--cancelado {
  background: var(--color-neutral-soft, #f2f4f7);
  color: var(--color-neutral, #475467);
}

.grilla-agenda {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.slot-card {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface, #f9fafb);
}

.slot-card--ocupado {
  border-color: rgba(37, 99, 235, 0.35);
  background:
    linear-gradient(180deg, rgba(37, 99, 235, 0.09), transparent),
    var(--color-surface, #f9fafb);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.12);
}

.slot-card--libre {
  border-style: dashed;
  background:
    linear-gradient(180deg, rgba(148, 163, 184, 0.08), transparent),
    var(--color-surface, #f9fafb);
  color: var(--color-text-muted);
}

.slot-card h2 {
  font-size: 1.1rem;
}

.slot-dia {
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.slot-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-size: 0.82rem;
  font-weight: 800;
}

@media (max-width: 900px) {
  .hero-header {
    align-items: start;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .panel-card {
    padding: 18px;
  }

  .turno-card__top,
  .slot-card__top {
    flex-direction: column;
  }

  .tabs {
    width: 100%;
  }

  .tab-button {
    flex: 1 1 calc(50% - 8px);
  }
}

@media (max-width: 500px) {
  .page-shell {
    padding: 16px;
  }

  .date-field {
    min-width: 100%;
  }

  .tab-button {
    flex: 1 1 100%;
  }
}
</style>
