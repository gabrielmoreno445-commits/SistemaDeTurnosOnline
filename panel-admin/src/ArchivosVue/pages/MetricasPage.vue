<!--
MetricasPage.vue
Dashboard de negocio para el profesional.
Convierte la vista plana de metricas en KPIs, tendencia semanal y ranking
de servicios usando las APIs existentes del panel admin.
-->
<script setup>
import { computed, ref, watch } from 'vue';

import { obtenerProximos, obtenerResumen } from '../../ArchivosJS/api/metricas.js';
import { obtenerDisponibilidad } from '../../ArchivosJS/api/disponibilidad.js';
import { obtenerServicios } from '../../ArchivosJS/api/servicios.js';
import { obtenerTurnos } from '../../ArchivosJS/api/turnos.js';
import MetricaCard from '../components/MetricaCard.vue';
import NavBar from '../components/NavBar.vue';
import { useAuth } from '../composables/useAuth.js';

const { token } = useAuth();

const resumenApi = ref(null);
const turnosMes = ref([]);
const servicios = ref([]);
const disponibilidad = ref([]);
const proximos = ref([]);
const cargando = ref(false);
const error = ref(null);
const aviso = ref('');

function crearFechaLocalISO(fecha) {
  const offset = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 10);
}

function obtenerRangoMes(base = new Date()) {
  const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
  const fin = new Date(base.getFullYear(), base.getMonth() + 1, 0);

  return {
    inicio: crearFechaLocalISO(inicio),
    fin: crearFechaLocalISO(fin)
  };
}

function parsearFechaLocal(iso) {
  return new Date(`${iso}T00:00:00`);
}

function formatearNumero(valor) {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(Number(valor || 0));
}

function formatearMoneda(valor) {
  return `$${formatearNumero(valor)} ARS`;
}

function formatearPorcentaje(valor) {
  return `${Math.round(Number(valor || 0))}%`;
}

function formatearFechaCorta(fechaISO) {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short'
  });
}

function formatearMesActual() {
  const ahora = new Date();

  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(ahora);
}

function convertirHoraAMinutos(hora) {
  const [horas, minutos] = hora.slice(0, 5).split(':').map(Number);
  return horas * 60 + minutos;
}

function calcularMinutosEntre(inicio, fin) {
  return convertirHoraAMinutos(fin) - convertirHoraAMinutos(inicio);
}

function calcularDuracionTurno(turno, servicio) {
  const duracion = Number(servicio?.duracion_minutos || 0);
  if (duracion > 0) {
    return duracion;
  }

  return 30;
}

function normalizarServicios(lista) {
  return new Map(
    lista.map((servicio) => [
      servicio.id,
      {
        ...servicio,
        duracion_minutos: Number(servicio.duracion_minutos || 0),
        precio: Number(servicio.precio || 0)
      }
    ])
  );
}

const serviciosPorId = computed(() => normalizarServicios(servicios.value));

const quantumMinimo = computed(() => {
  const duraciones = servicios.value
    .map((servicio) => Number(servicio.duracion_minutos))
    .filter((duracion) => Number.isFinite(duracion) && duracion > 0);

  if (duraciones.length === 0) {
    return 30;
  }

  return Math.max(15, Math.min(...duraciones));
});

const resumen = computed(() => {
  if (resumenApi.value) {
    return resumenApi.value;
  }

  const confirmados = turnosMes.value.filter((turno) => turno.estado === 'confirmado');
  const cancelados = turnosMes.value.filter((turno) => turno.estado === 'cancelado');
  const pendientes = turnosMes.value.filter((turno) => turno.estado === 'pendiente');
  const ingresosEstimados = confirmados.reduce((total, turno) => {
    const servicio = serviciosPorId.value.get(turno.servicio_id);
    return total + Number(servicio?.precio || 0);
  }, 0);

  return {
    total_turnos: turnosMes.value.length,
    turnos_confirmados: confirmados.length,
    turnos_cancelados: cancelados.length,
    turnos_pendientes: pendientes.length,
    ingresos_estimados: ingresosEstimados
  };
});

const tendenciaSemanal = computed(() => {
  const { inicio, fin } = obtenerRangoMes();
  const inicioMes = parsearFechaLocal(inicio);
  const finMes = parsearFechaLocal(fin);
  const semanas = [];
  let cursor = new Date(inicioMes);

  while (cursor <= finMes) {
    const semanaInicio = new Date(cursor);
    const semanaFin = new Date(cursor);
    semanaFin.setDate(semanaFin.getDate() + 6);

    if (semanaFin > finMes) {
      semanaFin.setTime(finMes.getTime());
    }

    semanas.push({
      inicio: crearFechaLocalISO(semanaInicio),
      fin: crearFechaLocalISO(semanaFin),
      etiqueta: `${semanaInicio.getDate()}-${semanaFin.getDate()} ${new Intl.DateTimeFormat('es-AR', {
        month: 'short'
      }).format(semanaInicio).replace('.', '')}`
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return semanas.map((semana) => {
    const turnosSemana = turnosMes.value.filter((turno) => turno.fecha >= semana.inicio && turno.fecha <= semana.fin);
    const ingresosSemana = turnosSemana.reduce((total, turno) => {
      if (turno.estado !== 'confirmado') {
        return total;
      }

      const servicio = serviciosPorId.value.get(turno.servicio_id);
      return total + Number(servicio?.precio || 0);
    }, 0);

    return {
      ...semana,
      turnos: turnosSemana.length,
      ingresos: ingresosSemana
    };
  });
});

const topServicios = computed(() => {
  const conteo = new Map();

  for (const turno of turnosMes.value) {
    const clave = turno.servicio_id;
    const servicio = serviciosPorId.value.get(clave);

    if (!conteo.has(clave)) {
      conteo.set(clave, {
        id: clave,
        nombre: turno.servicio_nombre || servicio?.nombre || 'Servicio',
        cantidad: 0,
        ingresos: 0
      });
    }

    const item = conteo.get(clave);
    item.cantidad += 1;

    if (turno.estado === 'confirmado') {
      item.ingresos += Number(servicio?.precio || 0);
    }
  }

  return [...conteo.values()]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 3);
});

const metricasOcupacion = computed(() => {
  const { inicio, fin } = obtenerRangoMes();
  const inicioMes = parsearFechaLocal(inicio);
  const finMes = parsearFechaLocal(fin);
  const quantum = quantumMinimo.value;
  let slotsDisponibles = 0;

  for (let cursor = new Date(inicioMes); cursor <= finMes; cursor.setDate(cursor.getDate() + 1)) {
    const diaSemana = cursor.getDay();
    const bloquesDelDia = disponibilidad.value.filter((bloque) => Number(bloque.dia_semana) === diaSemana);

    for (const bloque of bloquesDelDia) {
      const minutos = calcularMinutosEntre(bloque.hora_inicio, bloque.hora_fin);
      if (minutos > 0) {
        slotsDisponibles += Math.floor(minutos / quantum);
      }
    }
  }

  const slotsOcupados = turnosMes.value.reduce((total, turno) => {
    if (turno.estado === 'cancelado') {
      return total;
    }

    const servicio = serviciosPorId.value.get(turno.servicio_id);
    const duracion = calcularDuracionTurno(turno, servicio);

    return total + Math.max(1, Math.ceil(duracion / quantum));
  }, 0);

  return {
    slotsDisponibles,
    slotsOcupados,
    porcentaje: slotsDisponibles > 0 ? Math.min(100, (slotsOcupados / slotsDisponibles) * 100) : 0
  };
});

const maxIngresosSemanal = computed(() => {
  return Math.max(1, ...tendenciaSemanal.value.map((semana) => semana.ingresos));
});

const chartLayout = computed(() => {
  const cantidad = Math.max(1, tendenciaSemanal.value.length);
  const anchoTotal = 760;
  const margenIzquierdo = 52;
  const margenDerecho = 34;
  const anchoDisponible = anchoTotal - margenIzquierdo - margenDerecho;
  const paso = anchoDisponible / cantidad;
  const anchoBarra = Math.min(84, paso * 0.55);

  return {
    anchoBarra,
    anchoTotal,
    anchoDisponible,
    margenDerecho,
    margenIzquierdo,
    paso
  };
});

function valorBarra(ingresos) {
  const maximo = maxIngresosSemanal.value;

  if (!ingresos) {
    return 6;
  }

  return Math.max(6, Math.round((ingresos / maximo) * 210));
}

function posicionBarra(ingresos) {
  return 250 - valorBarra(ingresos);
}

function posicionHorizontalBarra(index) {
  const { anchoBarra, margenIzquierdo, paso } = chartLayout.value;
  return margenIzquierdo + (index * paso) + ((paso - anchoBarra) / 2);
}

function centroHorizontalBarra(index) {
  const { margenIzquierdo, paso } = chartLayout.value;
  return margenIzquierdo + (index * paso) + (paso / 2);
}

function cargarAviso(mensaje) {
  if (!mensaje) {
    return;
  }

  if (!aviso.value) {
    aviso.value = mensaje;
    return;
  }

  aviso.value = `${aviso.value} ${mensaje}`;
}

async function cargarMetricas() {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;
  aviso.value = '';

  const { inicio, fin } = obtenerRangoMes();

  try {
    const resultados = await Promise.allSettled([
      obtenerResumen(token.value),
      obtenerProximos(token.value),
      obtenerTurnos(token.value, undefined, { desde: inicio, hasta: fin }),
      obtenerServicios(token.value),
      obtenerDisponibilidad(token.value)
    ]);

    const [resumenResult, proximosResult, turnosResult, serviciosResult, disponibilidadResult] = resultados;

    if (resumenResult.status === 'fulfilled') {
      resumenApi.value = resumenResult.value;
    } else {
      resumenApi.value = null;
      cargarAviso('No se pudo leer el resumen base; se recalculo con los turnos disponibles.');
    }

    if (proximosResult.status === 'fulfilled') {
      proximos.value = proximosResult.value;
    } else {
      proximos.value = [];
      cargarAviso('No se pudieron cargar los proximos turnos.');
    }

    if (turnosResult.status === 'fulfilled') {
      turnosMes.value = Array.isArray(turnosResult.value) ? turnosResult.value : [];
    } else {
      turnosMes.value = [];
      cargarAviso('No se pudieron cargar los turnos del mes para el grafico.');
    }

    if (serviciosResult.status === 'fulfilled') {
      servicios.value = Array.isArray(serviciosResult.value) ? serviciosResult.value : [];
    } else {
      servicios.value = [];
      cargarAviso('No se pudieron cargar los servicios para estimar ingresos y ocupacion.');
    }

    if (disponibilidadResult.status === 'fulfilled') {
      disponibilidad.value = Array.isArray(disponibilidadResult.value) ? disponibilidadResult.value : [];
    } else {
      disponibilidad.value = [];
      cargarAviso('No se pudo cargar la disponibilidad del profesional.');
    }

    if (resumenResult.status !== 'fulfilled' && turnosMes.value.length === 0) {
      error.value = 'No se pudieron cargar las metricas del mes.';
    }
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

watch(token, async (nuevoToken) => {
  if (nuevoToken) {
    await cargarMetricas();
    return;
  }

  resumenApi.value = null;
  turnosMes.value = [];
  servicios.value = [];
  disponibilidad.value = [];
  proximos.value = [];
  aviso.value = '';
  error.value = null;
}, { immediate: true });
</script>

<template>
  <main class="page-shell">
    <section class="page-content">
      <NavBar />

      <section class="dashboard-stack">
        <header class="panel-card hero-panel animate-in">
          <div class="hero-copy">
            <p class="eyebrow">Panel de negocio</p>
            <h1>Metricas del mes</h1>
            <p>
              Una lectura mas clara de la actividad del profesional: volumen de turnos,
              ingresos estimados, ocupacion y servicios mas demandados.
            </p>
          </div>

          <div class="hero-chip">
            <span class="hero-chip__label">Periodo actual</span>
            <strong>{{ formatearMesActual() }}</strong>
            <small>Datos calculados con la API existente del panel.</small>
          </div>
        </header>

        <p v-if="error" class="message message--error">
          {{ error }}
        </p>

        <p v-if="aviso" class="message message--info">
          {{ aviso }}
        </p>

        <section v-if="cargando" class="loading-panel panel-card">
          <div class="cargando-container">
            <span class="spinner"></span>
          </div>
        </section>

        <template v-else>
          <section class="metricas-grid metricas-grid--kpis">
            <MetricaCard
              class="animate-in"
              style="animation-delay: 0ms;"
              titulo="Total de turnos"
              :valor="formatearNumero(resumen.total_turnos)"
              detalle="Turnos cargados en el mes en curso"
            />
            <MetricaCard
              class="animate-in"
              style="animation-delay: 80ms;"
              titulo="Ingresos estimados"
              :valor="formatearMoneda(resumen.ingresos_estimados)"
              detalle="Basado en turnos confirmados y precios de servicios"
              color="var(--color-accent)"
            />
            <MetricaCard
              class="animate-in"
              style="animation-delay: 160ms;"
              titulo="Tasa de ocupacion"
              :valor="formatearPorcentaje(metricasOcupacion.porcentaje)"
              :detalle="`${formatearNumero(metricasOcupacion.slotsOcupados)} de ${formatearNumero(metricasOcupacion.slotsDisponibles)} slots ocupados`"
              color="var(--color-warning)"
            />
          </section>

          <section class="dashboard-grid">
            <article class="panel-card chart-panel animate-in" style="animation-delay: 220ms;">
              <div class="panel-header">
                <div>
                  <p class="eyebrow">Tendencia semanal</p>
                  <h2>Ingresos confirmados y volumen de turnos</h2>
                  <p>Se agrupa el mes en semanas para detectar picos de demanda rapido.</p>
                </div>
                <div class="chart-legend">
                  <span class="legend-pill legend-pill--income">Ingresos</span>
                  <span class="legend-pill">El numero sobre cada barra indica turnos</span>
                </div>
              </div>

              <div v-if="tendenciaSemanal.length === 0" class="empty-state">
                <h3>Aun no hay datos suficientes para graficar</h3>
                <p>Cuando entren turnos en el mes, aca vas a ver la evolucion semanal.</p>
              </div>

              <div v-else class="chart-shell">
                <svg
                  class="trend-chart"
                  viewBox="0 0 760 320"
                  role="img"
                  :aria-label="`Tendencia semanal de ingresos para ${formatearMesActual()}`"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.95" />
                      <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.28" />
                    </linearGradient>
                    <linearGradient id="barGradientActive" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.95" />
                      <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0.28" />
                    </linearGradient>
                  </defs>

                  <g
                    v-for="tick in [0, 0.25, 0.5, 0.75, 1]"
                    :key="`grid-${tick}`"
                    class="chart-grid"
                  >
                    <line
                      x1="44"
                      x2="740"
                      :y1="250 - (210 * tick)"
                      :y2="250 - (210 * tick)"
                    />
                    <text x="16" :y="254 - (210 * tick)" class="chart-axis-label">
                      {{ tick === 0 ? '$0' : formatearMoneda(maxIngresosSemanal * tick) }}
                    </text>
                  </g>

                  <g
                    v-for="(semana, index) in tendenciaSemanal"
                    :key="`${semana.inicio}-${semana.fin}`"
                  >
                    <rect
                      :x="posicionHorizontalBarra(index)"
                      :y="posicionBarra(semana.ingresos)"
                      :width="chartLayout.anchoBarra"
                      :height="valorBarra(semana.ingresos)"
                      rx="18"
                      :fill="index === tendenciaSemanal.length - 1 ? 'url(#barGradientActive)' : 'url(#barGradient)'"
                    >
                      <title>{{ semana.etiqueta }} - {{ semana.turnos }} turnos, {{ formatearMoneda(semana.ingresos) }}</title>
                    </rect>

                    <text
                      :x="centroHorizontalBarra(index)"
                      :y="Math.max(48, posicionBarra(semana.ingresos) - 12)"
                      text-anchor="middle"
                      class="chart-value"
                    >
                      {{ formatearMoneda(semana.ingresos) }}
                    </text>

                    <text
                      :x="centroHorizontalBarra(index)"
                      :y="Math.max(72, posicionBarra(semana.ingresos) - 34)"
                      text-anchor="middle"
                      class="chart-count"
                    >
                      {{ formatearNumero(semana.turnos) }} turnos
                    </text>

                    <text
                      :x="centroHorizontalBarra(index)"
                      y="288"
                      text-anchor="middle"
                      class="chart-label"
                    >
                      {{ semana.etiqueta }}
                    </text>
                  </g>
                </svg>
              </div>
            </article>

            <article class="panel-card ranking-panel animate-in" style="animation-delay: 300ms;">
              <div class="panel-header">
                <div>
                  <p class="eyebrow">Top servicios</p>
                  <h2>Los 3 mas solicitados</h2>
                  <p>Ranking basado en la cantidad de turnos recibidos durante el mes.</p>
                </div>
              </div>

              <div v-if="topServicios.length === 0" class="empty-state empty-state--compact">
                <h3>No hay servicios para mostrar</h3>
                <p>Carga servicios y turnos para ver el ranking automatico.</p>
              </div>

              <div v-else class="top-services">
                <article
                  v-for="(servicio, index) in topServicios"
                  :key="servicio.id"
                  class="service-card"
                >
                  <div class="service-card__top">
                    <div>
                      <p class="service-card__rank">#{{ index + 1 }}</p>
                      <h3>{{ servicio.nombre }}</h3>
                    </div>
                    <span class="service-card__count">{{ formatearNumero(servicio.cantidad) }}</span>
                  </div>

                  <div class="service-card__track" aria-hidden="true">
                    <span
                      class="service-card__fill"
                      :style="{ width: `${topServicios[0].cantidad > 0 ? (servicio.cantidad / topServicios[0].cantidad) * 100 : 0}%` }"
                    ></span>
                  </div>

                  <div class="service-card__meta">
                    <span>{{ formatearNumero(servicio.cantidad) }} turnos</span>
                    <span>{{ formatearMoneda(servicio.ingresos) }}</span>
                  </div>
                </article>
              </div>
            </article>
          </section>

          <section class="panel-card agenda-panel animate-in" style="animation-delay: 360ms;">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Agenda inmediata</p>
                <h2>Proximos turnos confirmados</h2>
                <p>Resumen corto de la agenda ya cerrada para los proximos dias.</p>
              </div>
            </div>

            <p v-if="!proximos.length" class="message message--empty">
              No tenes turnos confirmados proximos.
            </p>

            <div v-else class="next-grid">
              <article
                v-for="turno in proximos"
                :key="`${turno.fecha}-${turno.hora_inicio}-${turno.cliente_nombre}`"
                class="next-card"
              >
                <p class="next-card__date">{{ formatearFechaCorta(turno.fecha) }} · {{ turno.hora_inicio.slice(0, 5) }}</p>
                <h3>{{ turno.cliente_nombre }}</h3>
                <p>{{ turno.servicio_nombre }}</p>
              </article>
            </div>
          </section>
        </template>
      </section>
    </section>
  </main>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 32%),
    radial-gradient(circle at top right, rgba(6, 118, 71, 0.08), transparent 28%),
    var(--color-surface, #f8fafc);
}

.page-content {
  width: min(100%, 1120px);
  margin: 0 auto;
}

.dashboard-stack {
  display: grid;
  gap: 18px;
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

.hero-panel {
  grid-template-columns: minmax(0, 1.6fr) minmax(220px, 0.75fr);
  align-items: end;
  overflow: hidden;
}

.hero-copy h1,
.hero-copy p,
.panel-header h2,
.panel-header p,
.service-card h3,
.service-card p,
.next-card h3,
.next-card p {
  margin: 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  line-height: 1.05;
}

.hero-copy p {
  max-width: 62ch;
  margin-top: 10px;
  color: var(--color-text-muted, #64748b);
}

.hero-chip {
  display: grid;
  gap: 6px;
  justify-self: end;
  padding: 16px 18px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: calc(var(--radius-lg, 1rem) + 0.25rem);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.02));
}

.hero-chip__label {
  color: var(--color-text-muted, #64748b);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.hero-chip strong {
  font-size: 1.15rem;
}

.hero-chip small {
  color: var(--color-text-muted, #64748b);
  line-height: 1.4;
}

.metricas-grid--kpis {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.9fr);
  gap: 18px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.panel-header p {
  margin-top: 6px;
  color: var(--color-text-muted, #64748b);
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.legend-pill {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border, #d0d5dd);
  background: var(--color-surface, #f8fafc);
  color: var(--color-text-muted, #64748b);
  font-size: 0.82rem;
  font-weight: 700;
}

.legend-pill--income {
  border-color: rgba(37, 99, 235, 0.2);
  color: var(--color-primary);
}

.chart-shell {
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-lg, 1rem);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.02), transparent),
    var(--color-surface, #f8fafc);
}

.trend-chart {
  width: 100%;
  min-height: 320px;
}

.chart-grid line {
  stroke: rgba(148, 163, 184, 0.28);
  stroke-width: 1;
}

.chart-axis-label,
.chart-label,
.chart-count,
.chart-value {
  fill: var(--color-text-muted, #64748b);
  font-size: 12px;
  font-weight: 700;
}

.chart-value {
  fill: var(--color-primary);
}

.chart-count {
  fill: var(--color-accent);
}

.chart-label {
  fill: var(--color-text-muted, #64748b);
}

.ranking-panel {
  align-content: start;
}

.top-services {
  display: grid;
  gap: 14px;
}

.service-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface, #f8fafc);
}

.service-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.service-card__rank {
  color: var(--color-text-muted, #64748b);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-card h3 {
  font-size: 1rem;
}

.service-card__count {
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--color-primary);
  font-weight: 800;
}

.service-card__track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-neutral-soft, #f2f4f7);
}

.service-card__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}

.service-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-muted, #64748b);
  font-size: 0.9rem;
  font-weight: 600;
}

.agenda-panel {
  gap: 16px;
}

.next-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.next-card {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface, #f8fafc);
}

.next-card__date {
  color: var(--color-text-muted, #64748b);
  font-size: 0.88rem;
  font-weight: 700;
}

.message {
  padding: 14px;
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-surface, #f3f4f6);
  color: var(--color-text-muted, #64748b);
}

.message--error {
  background: var(--color-danger-soft, #fef2f2);
  color: var(--color-danger, #b42318);
}

.message--info {
  background: var(--color-success-soft, #ecfdf3);
  color: var(--color-success, #067647);
}

.message--empty {
  margin: 0;
}

.empty-state {
  display: grid;
  gap: 6px;
  padding: 22px;
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface, #f8fafc);
  color: var(--color-text-muted, #64748b);
}

.empty-state h3 {
  margin: 0;
  color: var(--color-text);
}

.empty-state--compact {
  padding: 18px;
}

.loading-panel {
  min-height: 220px;
}

@media (max-width: 980px) {
  .hero-panel,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .hero-chip {
    justify-self: start;
  }
}

@media (max-width: 900px) {
  .metricas-grid--kpis {
    grid-template-columns: 1fr;
  }

  .next-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-shell {
    padding: 16px;
  }

  .panel-card {
    padding: 18px;
  }

  .panel-header {
    flex-direction: column;
  }

  .chart-legend {
    justify-content: flex-start;
  }

  .service-card__meta {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
