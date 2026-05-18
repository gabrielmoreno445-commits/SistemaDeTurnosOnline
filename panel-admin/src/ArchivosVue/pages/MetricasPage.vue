<!--
MetricasPage.vue
Muestra el resumen de actividad del mes actual y los proximos turnos confirmados.
Usa MetricaCard para presentar los numeros de forma consistente con el dashboard.
-->
<script setup>
import { onMounted, ref } from 'vue';

import { obtenerProximos, obtenerResumen } from '../../ArchivosJS/api/metricas.js';
import MetricaCard from '../components/MetricaCard.vue';
import NavBar from '../components/NavBar.vue';
import { useAuth } from '../composables/useAuth.js';

const { token } = useAuth();

const resumen = ref(null);
const proximos = ref([]);
const cargando = ref(false);
const error = ref(null);

function formatearMoneda(valor) {
  return `$${Number(valor || 0).toLocaleString('es-AR')}`;
}

function formatearFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Carga resumen y proximos en paralelo para reducir espera total de la pagina.
// Son endpoints independientes, asi que no hay beneficio en esperar uno para pedir el otro.
async function cargarMetricas() {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    const [resumenResponse, proximosResponse] = await Promise.all([
      obtenerResumen(token.value),
      obtenerProximos(token.value)
    ]);

    resumen.value = resumenResponse;
    proximos.value = proximosResponse;
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

onMounted(async () => {
  await cargarMetricas();
});
</script>

<template>
  <main class="page-shell">
    <section class="page-content">
      <NavBar />

      <section class="stack">
        <section class="panel-card">
          <div class="panel-header">
            <div>
              <h1>Actividad del mes</h1>
              <p>Seguimiento rápido de turnos, confirmaciones e ingresos estimados.</p>
            </div>
          </div>

          <p v-if="error" class="message message--error">
            {{ error }}
          </p>

          <div v-else-if="cargando" class="cargando-container">
            <span class="spinner"></span>
          </div>

          <div v-else-if="resumen" class="metricas-grid">
            <MetricaCard class="animate-in" style="animation-delay: 0ms;" titulo="Total turnos" :valor="resumen.total_turnos" />
            <MetricaCard class="animate-in" style="animation-delay: 80ms;" titulo="Confirmados" :valor="resumen.turnos_confirmados" color="var(--color-accent)" />
            <MetricaCard class="animate-in" style="animation-delay: 160ms;" titulo="Cancelados" :valor="resumen.turnos_cancelados" color="var(--color-danger)" />
            <MetricaCard class="animate-in" style="animation-delay: 240ms;" titulo="Ingresos estimados" :valor="formatearMoneda(resumen.ingresos_estimados)" />
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-header">
            <div>
              <h2>Próximos turnos confirmados</h2>
              <p>Vista breve de la agenda ya confirmada para los próximos días.</p>
            </div>
          </div>

          <p v-if="!cargando && proximos.length === 0" class="message">
            No tenés turnos confirmados próximos
          </p>

          <div v-else class="turnos-grid">
            <article v-for="turno in proximos" :key="`${turno.fecha}-${turno.hora_inicio}-${turno.cliente_nombre}`" class="turno-card">
              <p class="turno-fecha">{{ formatearFecha(turno.fecha) }} - {{ turno.hora_inicio.slice(0, 5) }}</p>
              <h3>{{ turno.cliente_nombre }}</h3>
              <p>{{ turno.servicio_nombre }}</p>
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
  background: var(--color-surface, #f8fafc);
}

.page-content {
  width: min(100%, 1080px);
  margin: 0 auto;
}

.stack {
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

.panel-header h1,
.panel-header h2,
.panel-header p,
.turno-card h3,
.turno-card p {
  margin: 0;
}

.panel-header p {
  margin-top: 6px;
  color: var(--color-text-muted, #64748b);
}

.turnos-grid {
  display: grid;
  gap: 14px;
}

.turno-card {
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface, #f8fafc);
}

.turno-fecha {
  color: var(--color-text-muted, #64748b);
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

</style>
