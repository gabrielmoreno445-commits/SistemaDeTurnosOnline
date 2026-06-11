<!--
DashboardPage.vue
Pantalla principal del panel admin.
Muestra los turnos del dia actual y permite al profesional confirmarlos
o cancelarlos sin salir de la vista principal.
Incluye selector de fecha para consultar otros dias.
-->
<script setup>
import { onMounted, ref, watch } from 'vue';

import { obtenerResumen } from '../../ArchivosJS/api/metricas.js';
import { cambiarEstadoTurno, obtenerTurnos } from '../../ArchivosJS/api/turnos.js';
import { obtenerFechaLocalISO } from '../../ArchivosJS/utils/fechas.js';
import MetricaCard from '../components/MetricaCard.vue';
import NavBar from '../components/NavBar.vue';
import { useAuth } from '../composables/useAuth.js';

const { token } = useAuth();

const turnos = ref([]);
const fecha = ref(obtenerFechaLocalISO());
const resumen = ref(null);
const cargando = ref(false);
const error = ref(null);

const ESTILOS_ESTADO = {
  pendiente: 'badge--pendiente',
  confirmado: 'badge--confirmado',
  cancelado: 'badge--cancelado'
};

const ETIQUETAS_MODALIDAD = {
  local: 'En el local',
  domicilio: 'A domicilio'
};

// Consulta los turnos de la fecha visible usando el token del profesional.
// Se llama al montar y tambien cada vez que el usuario cambia el dia consultado.
async function cargarTurnos() {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    turnos.value = await obtenerTurnos(token.value, fecha.value);
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

// Metricas rapidas: se cargan junto con los turnos del dia.
// Si fallan, no bloquean la vista principal de turnos.
// La vista completa de metricas esta en /metricas.
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

// Cambia el estado del turno y luego refresca la lista para mantener
// la UI alineada con la respuesta real del backend.
async function actualizarEstado(turnoId, estado) {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    await cambiarEstadoTurno(token.value, turnoId, estado);
    await cargarTurnos();
  } catch (fetchError) {
    error.value = fetchError.message;
    cargando.value = false;
  }
}

function obtenerClaseEstado(estado) {
  return ESTILOS_ESTADO[estado] || 'badge--cancelado';
}

onMounted(async () => {
  await Promise.allSettled([
    cargarTurnos(),
    cargarResumenRapido()
  ]);
});

watch(fecha, async () => {
  await cargarTurnos();
});
</script>

<template>
  <main class="page-shell">
    <section class="page-content">
      <NavBar />

      <div v-if="resumen" class="metricas-grid">
        <MetricaCard class="animate-in" style="animation-delay: 0ms;" titulo="Turnos del mes" :valor="resumen.total_turnos" />
        <MetricaCard class="animate-in" style="animation-delay: 80ms;" titulo="Confirmados" :valor="resumen.turnos_confirmados" color="var(--color-accent)" />
        <MetricaCard class="animate-in" style="animation-delay: 160ms;" titulo="Ingresos estimados" :valor="`$${Number(resumen.ingresos_estimados || 0).toLocaleString('es-AR')}`" />
      </div>

      <section class="panel-card">
        <div class="panel-header">
          <div>
            <h1>Turnos del dia</h1>
            <p>Revisa, confirma o cancela los turnos de la fecha seleccionada.</p>
          </div>

          <label class="date-field">
            <span>Fecha</span>
            <input v-model="fecha" type="date" />
          </label>
        </div>

        <p v-if="error" class="message message--error">
          {{ error }}
        </p>

        <div v-else-if="cargando" class="cargando-container">
          <span class="spinner"></span>
        </div>

        <p v-else-if="turnos.length === 0" class="message">
          No hay turnos para esta fecha
        </p>

        <div v-else class="turnos-grid">
          <article
            v-for="(turno, index) in turnos"
            :key="turno.id"
            class="turno-card card animate-in"
            :style="{ animationDelay: `${index * 60}ms` }"
          >
            <div class="turno-card__top">
              <div>
                <p class="turno-hora">{{ turno.hora_inicio?.slice(0, 5) }}</p>
                <h2>{{ turno.cliente_nombre }}</h2>
              </div>

              <span class="badge" :class="obtenerClaseEstado(turno.estado)">
                {{ turno.estado }}
              </span>
            </div>

            <div class="turno-card__details">
              <p><strong>Servicio:</strong> {{ turno.servicio_nombre }}</p>
              <p>
                <strong>Modalidad:</strong>
                {{ ETIQUETAS_MODALIDAD[turno.modalidad_atencion] || 'En el local' }}
              </p>
              <p v-if="turno.direccion_cliente">
                <strong>Direccion:</strong> {{ turno.direccion_cliente }}
              </p>
              <p v-if="turno.notas_cliente">
                <strong>Notas:</strong> {{ turno.notas_cliente }}
              </p>
              <p><strong>Email:</strong> {{ turno.cliente_email }}</p>
              <p v-if="turno.cliente_telefono">
                <strong>Telefono:</strong> {{ turno.cliente_telefono }}
              </p>
            </div>

            <div v-if="turno.estado === 'pendiente'" class="turno-card__actions">
              <button type="button" class="button button--primary" @click="actualizarEstado(turno.id, 'confirmado')">
                Confirmar
              </button>
              <button type="button" class="button button--danger" @click="actualizarEstado(turno.id, 'cancelado')">
                Cancelar
              </button>
            </div>

            <div v-else-if="turno.estado === 'confirmado'" class="turno-card__actions">
              <button type="button" class="button button--danger" @click="actualizarEstado(turno.id, 'cancelado')">
                Cancelar
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

.metricas-grid { margin-bottom: 18px; }

.panel-card {
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface-elevated, #ffffff);
  box-shadow: var(--shadow-sm, 0 10px 30px rgba(15, 23, 42, 0.08));
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
.turno-card h2,
.turno-card p {
  margin: 0;
}

.panel-header p {
  color: var(--color-text-muted, #6b7280);
}

.date-field {
  display: grid;
  gap: 6px;
  min-width: 220px;
}

.date-field span {
  font-weight: 600;
}

.date-field input {
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

.turnos-grid {
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

.turno-card__top {
  display: flex;
  gap: 12px;
  align-items: start;
  justify-content: space-between;
}

.turno-hora {
  margin-bottom: 4px;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.95rem;
  font-weight: 700;
}

.turno-card__details {
  display: grid;
  gap: 6px;
}

.turno-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button {
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-md, 0.75rem);
  color: #ffffff;
  font-weight: 700;
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
  font-size: 0.85rem;
  font-weight: 700;
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

</style>
