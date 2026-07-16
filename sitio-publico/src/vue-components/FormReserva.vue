<template>
  <section class="reserva">
    <div v-if="error" class="message error">
      {{ error }}
    </div>

    <div v-if="exito" class="success-box">
      <p class="success-eyebrow">Reserva confirmada</p>
      <h2>Turno reservado</h2>
      <p>
        {{ mensajeExito }}
      </p>
      <p>
        Servicio: {{ servicioSeleccionado?.nombre }} con {{ profesionalNombre }}
      </p>
      <p v-if="modalidadSeleccionada === 'domicilio'">
        Direccion: {{ direccionCliente }}
      </p>
    </div>

    <div v-else class="steps-stack">
      <section class="step-block">
        <div class="step-header">
          <span class="step-number">1</span>
          <div>
            <h2>Elegi un servicio</h2>
            <p>Selecciona la opcion que mejor se ajuste a tu necesidad.</p>
          </div>
        </div>

        <div v-if="cargandoInicial" class="cargando-container">
          <span class="spinner"></span>
        </div>

        <div v-else class="services-grid">
          <button
            v-for="(servicio, index) in servicios"
            :key="servicio.id"
            type="button"
            class="service-card card animate-in"
            :style="{ animationDelay: `${index * 70}ms` }"
            :class="{ selected: servicioSeleccionado?.id === servicio.id }"
            @click="seleccionarServicio(servicio)"
          >
            <strong>{{ servicio.nombre }}</strong>
            <span>{{ servicio.duracion_minutos }} min</span>
            <span v-if="servicio.precio !== null && servicio.precio !== undefined">
              ${{ formatearPrecio(servicio.precio) }}
            </span>
            <span class="modalidad-tag">
              {{ obtenerEtiquetaModalidad(servicio.modalidad_atencion) }}
            </span>
          </button>
        </div>
      </section>

      <section v-if="servicioSeleccionado" class="step-block">
        <div class="step-header">
          <span class="step-number">2</span>
          <div>
            <h2>Modalidad</h2>
            <p>{{ textoModalidadServicio }}</p>
          </div>
        </div>

        <div v-if="servicioSeleccionado.modalidad_atencion === 'ambas'" class="modalidad-options">
          <button
            type="button"
            class="slot-button"
            :class="{ selected: modalidadSeleccionada === 'local' }"
            @click="modalidadSeleccionada = 'local'"
          >
            En el local
          </button>
          <button
            type="button"
            class="slot-button"
            :class="{ selected: modalidadSeleccionada === 'domicilio' }"
            @click="modalidadSeleccionada = 'domicilio'"
          >
            A domicilio
          </button>
        </div>

        <p v-else class="hint">
          {{ obtenerEtiquetaModalidad(servicioSeleccionado.modalidad_atencion) }}
        </p>
      </section>

      <section v-if="servicioSeleccionado && modalidadSeleccionada" class="step-block">
        <div class="step-header">
          <span class="step-number">3</span>
          <div>
            <h2>Elegi una fecha</h2>
            <p>Solo se muestran horarios vigentes para el dia elegido.</p>
          </div>
        </div>

        <input
          v-model="fechaSeleccionada"
          class="date-input"
          type="date"
          :min="fechaMinima"
        />
      </section>

      <section v-if="servicioSeleccionado && modalidadSeleccionada && fechaSeleccionada" class="step-block">
        <div class="step-header">
          <span class="step-number">4</span>
          <div>
            <h2>Elegi un horario</h2>
            <p>Los horarios ocupados o pasados se excluyen automaticamente.</p>
          </div>
        </div>

        <div v-if="cargandoHorarios" class="cargando-container">
          <span class="spinner"></span>
        </div>

        <p v-else-if="horariosDisponibles.length === 0" class="hint">
          No hay horarios disponibles para esta fecha.
        </p>

        <div v-else class="slots-grid horarios-grid">
          <button
            v-for="(horario, index) in horariosDisponibles"
            :key="horario"
            type="button"
            class="slot-button animate-in"
            :style="{ animationDelay: `${index * 40}ms` }"
            :class="{ selected: horarioSeleccionado === horario }"
            @click="horarioSeleccionado = horario"
          >
            {{ horario }}
          </button>
        </div>
      </section>

      <section v-if="horarioSeleccionado" class="step-block">
        <div class="step-header">
          <span class="step-number">5</span>
          <div>
            <h2>Tus datos</h2>
            <p>Completa la informacion necesaria para registrar la reserva.</p>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="confirmarReserva">
          <label>
            <span>Nombre</span>
            <input v-model="clienteNombre" type="text" />
          </label>

          <label>
            <span>Email</span>
            <input v-model="clienteEmail" type="email" />
          </label>

          <label>
            <span>Telefono</span>
            <input v-model="clienteTelefono" type="text" />
          </label>

          <label v-if="modalidadSeleccionada === 'domicilio'" class="form-grid__full">
            <span>Direccion donde necesitas el servicio</span>
            <input
              v-model="direccionCliente"
              type="text"
              placeholder="Eldorado, barrio, calle, numero o referencia"
            />
          </label>

          <label class="form-grid__full">
            <span>Notas para el profesional</span>
            <textarea
              v-model="notasCliente"
              rows="3"
              placeholder="Ej: entre calles, detalle del trabajo o referencia de llegada"
            ></textarea>
          </label>

          <button class="submit-button" type="submit" :disabled="cargando">
            {{ cargando ? 'Confirmando...' : 'Confirmar reserva' }}
          </button>
        </form>
      </section>
    </div>
  </section>
</template>

<script>
// vue-components/FormReserva.vue
// Componente Vue que maneja el flujo completo de reserva de turno.
// Vive dentro de la pagina Astro [slug].astro como isla interactiva client:load.
// Al ser una isla, su estado reactivo queda encapsulado y no afecta al resto del HTML.
//
// Flujo del componente:
// 1. Carga servicios y disponibilidad del profesional
// 2. El cliente elige servicio y fecha
// 3. Se calculan horarios disponibles segun disponibilidad y ocupacion
// 4. El cliente completa sus datos y confirma la reserva

import { computed, onMounted, ref, watch } from 'vue';
import {
  createDemoTurno,
  getDemoAvailabilityBySlug,
  getDemoProfessionalBySlug,
  getDemoServicesBySlug,
  getDemoTurnosOcupados
} from '../demoData.js';

// En Astro, las variables PUBLIC_ son accesibles desde componentes Vue.
// La isla corre en el navegador, por eso usa la URL publica del backend.
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000';
const API_BASE = `${API_URL}/publico`;

export default {
  props: {
    slug: { type: String, required: true },
    demoMode: { type: Boolean, default: false }
  },
  setup(props) {
    const servicios = ref([]);
    const disponibilidad = ref([]);

    const servicioSeleccionado = ref(null);
    const modalidadSeleccionada = ref('');
    const fechaSeleccionada = ref('');
    const horariosDisponibles = ref([]);
    const horarioSeleccionado = ref('');

    const clienteNombre = ref('');
    const clienteEmail = ref('');
    const clienteTelefono = ref('');
    const direccionCliente = ref('');
    const notasCliente = ref('');

    const cargando = ref(false);
    const cargandoInicial = ref(true);
    const cargandoHorarios = ref(false);
    const error = ref(null);
    const exito = ref(false);
    const profesionalNombre = ref('');

    const fechaMinima = new Date().toISOString().slice(0, 10);

    const ETIQUETAS_MODALIDAD = {
      local: 'En el local',
      domicilio: 'A domicilio',
      ambas: 'Local + domicilio'
    };

    // Genera una etiqueta amigable para la fecha reservada una vez confirmada.
    // Se usa en el estado de exito para resumir claramente que se reservo.
    const fechaFormateadaExito = computed(() => {
      if (!fechaSeleccionada.value) {
        return '';
      }

      const fecha = new Date(`${fechaSeleccionada.value}T00:00:00`);

      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    });

    const mensajeExito = computed(() => {
      const base = `${fechaFormateadaExito.value} a las ${horarioSeleccionado.value}`;

      if (modalidadSeleccionada.value === 'domicilio') {
        return `El profesional ira a tu domicilio el ${base}.`;
      }

      return `Te esperamos el ${base}.`;
    });

    const textoModalidadServicio = computed(() => {
      if (!servicioSeleccionado.value) {
        return '';
      }

      if (servicioSeleccionado.value.modalidad_atencion === 'ambas') {
        return 'Elegí si querés ir al local o recibir al profesional donde estés.';
      }

      if (servicioSeleccionado.value.modalidad_atencion === 'domicilio') {
        return 'Este servicio se realiza a domicilio dentro de la zona de cobertura.';
      }

      return 'Este servicio se realiza en el local del profesional.';
    });

    // Convierte horas HH:MM a minutos enteros para poder comparar rangos.
    // Esta base numerica simplifica el calculo de slots dentro de cada bloque.
    function horaAMinutos(hora) {
      const [horas, minutos] = hora.slice(0, 5).split(':').map(Number);
      return (horas * 60) + minutos;
    }

    // Convierte minutos enteros a formato HH:MM para mostrar botones de horario.
    // Mantiene siempre dos digitos para que la grilla sea consistente visualmente.
    function minutosAHora(totalMinutos) {
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;

      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    }

    function haySolapamiento(inicioSlot, duracionSlot, turnosOcupados) {
      const inicio = horaAMinutos(inicioSlot);
      const fin = inicio + Number(duracionSlot);

      return turnosOcupados.some((turno) => {
        const inicioOcupado = horaAMinutos(turno.hora_inicio);
        const finOcupado = inicioOcupado + Number(turno.duracion_minutos);

        return inicio < finOcupado && fin > inicioOcupado;
      });
    }

    // Devuelve el indice de dia de la semana esperado por el backend.
    // Se usa para unir una fecha del calendario con los bloques semanales del profesional.
    function obtenerDiaSemana(fecha) {
      return new Date(`${fecha}T00:00:00`).getDay();
    }

    // Detecta si un slot ya quedo en el pasado cuando la fecha elegida es hoy.
    // Esto evita ofrecer horarios que ya no se pueden reservar en el mismo dia.
    function esHorarioPasado(fecha, horario) {
      const hoy = new Date();
      const hoyIso = hoy.toISOString().slice(0, 10);

      if (fecha !== hoyIso) {
        return false;
      }

      const ahoraMinutos = (hoy.getHours() * 60) + hoy.getMinutes();
      return horaAMinutos(horario) <= ahoraMinutos;
    }

    // Da formato simple al precio para mantener una lectura clara en cards.
    // No agrega logica de moneda avanzada porque en esta etapa alcanza con un visual basico.
    function formatearPrecio(precio) {
      return Number(precio).toLocaleString('es-AR');
    }

    function obtenerEtiquetaModalidad(modalidad) {
      return ETIQUETAS_MODALIDAD[modalidad] || ETIQUETAS_MODALIDAD.local;
    }

    // Resetea mensajes y seleccion de horario cuando cambia el contexto de reserva.
    // Asi evitamos dejar estados viejos visibles despues de nuevas elecciones.
    function limpiarEstadoReserva() {
      error.value = null;
      exito.value = false;
      horarioSeleccionado.value = '';
    }

    // Guarda el servicio activo y obliga a recalcular horarios con la nueva duracion.
    // Tambien limpia estados derivados para no mezclar una reserva anterior con otra.
    function seleccionarServicio(servicio) {
      servicioSeleccionado.value = servicio;
      modalidadSeleccionada.value = servicio.modalidad_atencion === 'ambas'
        ? ''
        : servicio.modalidad_atencion || 'local';
      fechaSeleccionada.value = '';
      horariosDisponibles.value = [];
      limpiarEstadoReserva();
    }

    // Carga los datos base del perfil publico al montar la isla.
    // Si falla cualquiera de las llamadas, deja un mensaje visible y detiene el flujo.
    async function cargarDatosIniciales() {
      cargandoInicial.value = true;
      error.value = null;

      try {
        if (props.demoMode) {
          const profesional = getDemoProfessionalBySlug(props.slug);
          const serviciosData = getDemoServicesBySlug(props.slug);
          const disponibilidadData = getDemoAvailabilityBySlug(props.slug);

          if (!profesional) {
            throw new Error('No se pudieron cargar los datos del profesional');
          }

          profesionalNombre.value = profesional.nombre;
          servicios.value = serviciosData;
          disponibilidad.value = disponibilidadData;
          return;
        }

        const [resProfesional, resServicios, resDisponibilidad] = await Promise.all([
          fetch(`${API_BASE}/${props.slug}`),
          fetch(`${API_BASE}/${props.slug}/servicios`),
          fetch(`${API_BASE}/${props.slug}/disponibilidad`)
        ]);

        if (!resProfesional.ok || !resServicios.ok || !resDisponibilidad.ok) {
          throw new Error('No se pudieron cargar los datos del profesional');
        }

        const profesional = await resProfesional.json();
        const serviciosData = await resServicios.json();
        const disponibilidadData = await resDisponibilidad.json();

        profesionalNombre.value = profesional.nombre;
        servicios.value = serviciosData;
        disponibilidad.value = disponibilidadData;
      } catch (fetchError) {
        error.value = 'No se pudieron cargar los datos para reservar este turno';
      } finally {
        cargandoInicial.value = false;
      }
    }

    // Calcula los horarios reservables segun fecha, servicio y bloques del profesional.
    // Toma la disponibilidad semanal, quita ocupados y excluye slots pasados si es hoy.
    async function recalcularHorarios() {
      if (!fechaSeleccionada.value || !servicioSeleccionado.value) {
        horariosDisponibles.value = [];
        return;
      }

      cargandoHorarios.value = true;
      horarioSeleccionado.value = '';
      error.value = null;

      try {
        if (props.demoMode) {
          const ocupados = getDemoTurnosOcupados(props.slug, fechaSeleccionada.value);

          if (ocupados?.bloqueado) {
            horariosDisponibles.value = [];
            error.value = ocupados.motivo
              ? `El profesional no atiende este dia: ${ocupados.motivo}`
              : 'El profesional no atiende este dia';
            return;
          }

          const horariosOcupados = new Set(
            ocupados.map((turno) => turno.hora_inicio.slice(0, 5))
          );

          const diaSemana = obtenerDiaSemana(fechaSeleccionada.value);
          const bloquesDelDia = disponibilidad.value.filter(
            (bloque) => Number(bloque.dia_semana) === diaSemana
          );

          const slots = [];
          const duracion = Number(servicioSeleccionado.value.duracion_minutos);

          for (const bloque of bloquesDelDia) {
            let minutoActual = horaAMinutos(bloque.hora_inicio);
            const minutoFin = horaAMinutos(bloque.hora_fin);

            while ((minutoActual + duracion) <= minutoFin) {
              const slot = minutosAHora(minutoActual);

              if (!horariosOcupados.has(slot) && !esHorarioPasado(fechaSeleccionada.value, slot)) {
                slots.push(slot);
              }

              minutoActual += duracion;
            }
          }

          horariosDisponibles.value = slots;
          return;
        }

        const res = await fetch(
          `${API_BASE}/${props.slug}/turnos-ocupados?fecha=${fechaSeleccionada.value}`
        );

        if (!res.ok) {
          throw new Error('No se pudieron obtener los horarios ocupados');
        }

        const ocupados = await res.json();

        if (ocupados?.bloqueado) {
          horariosDisponibles.value = [];
          error.value = ocupados.motivo
            ? `El profesional no atiende este día: ${ocupados.motivo}`
            : 'El profesional no atiende este día';
          return;
        }

        const diaSemana = obtenerDiaSemana(fechaSeleccionada.value);
        const bloquesDelDia = disponibilidad.value.filter(
          (bloque) => Number(bloque.dia_semana) === diaSemana
        );

        const slots = [];
        const duracion = Number(servicioSeleccionado.value.duracion_minutos);

        for (const bloque of bloquesDelDia) {
          let minutoActual = horaAMinutos(bloque.hora_inicio);
          const minutoFin = horaAMinutos(bloque.hora_fin);

          while ((minutoActual + duracion) <= minutoFin) {
            const slot = minutosAHora(minutoActual);

            if (
              !haySolapamiento(slot, duracion, ocupados) &&
              !esHorarioPasado(fechaSeleccionada.value, slot)
            ) {
              slots.push(slot);
            }

            minutoActual += duracion;
          }
        }

        horariosDisponibles.value = slots;
      } catch (fetchError) {
        horariosDisponibles.value = [];
        error.value = 'No se pudieron calcular los horarios disponibles';
      } finally {
        cargandoHorarios.value = false;
      }
    }

    // Valida los datos del cliente antes de enviar la reserva al backend.
    // Mantiene mensajes simples y directos para no bloquear al usuario con ruido extra.
    function validarFormulario() {
      if (!servicioSeleccionado.value) {
        return 'Debes seleccionar un servicio';
      }

      if (!fechaSeleccionada.value) {
        return 'Debes seleccionar una fecha';
      }

      if (!modalidadSeleccionada.value) {
        return 'Debes seleccionar una modalidad';
      }

      if (!horarioSeleccionado.value) {
        return 'Debes seleccionar un horario';
      }

      if (!clienteNombre.value || !clienteEmail.value) {
        return 'Nombre y email son obligatorios';
      }

      if (modalidadSeleccionada.value === 'domicilio' && !direccionCliente.value) {
        return 'La direccion es obligatoria para servicios a domicilio';
      }

      return null;
    }

    // Envía la reserva publica y maneja tanto exito como conflicto de horario.
    // Si el backend responde 409, se limpia el horario para forzar una nueva eleccion.
    async function confirmarReserva() {
      const mensajeError = validarFormulario();

      if (mensajeError) {
        error.value = mensajeError;
        return;
      }

      cargando.value = true;
      error.value = null;

      try {
        if (props.demoMode) {
          createDemoTurno({
            slug: props.slug,
            servicio_id: servicioSeleccionado.value.id,
            cliente_nombre: clienteNombre.value,
            cliente_email: clienteEmail.value,
            cliente_telefono: clienteTelefono.value,
            modalidad_atencion: modalidadSeleccionada.value,
            direccion_cliente: direccionCliente.value,
            notas_cliente: notasCliente.value,
            fecha: fechaSeleccionada.value,
            hora_inicio: horarioSeleccionado.value
          });

          exito.value = true;
          return;
        }

        const res = await fetch(`${API_BASE}/turnos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            slug: props.slug,
            servicio_id: servicioSeleccionado.value.id,
            cliente_nombre: clienteNombre.value,
            cliente_email: clienteEmail.value,
            cliente_telefono: clienteTelefono.value,
            modalidad_atencion: modalidadSeleccionada.value,
            direccion_cliente: direccionCliente.value,
            notas_cliente: notasCliente.value,
            fecha: fechaSeleccionada.value,
            hora_inicio: horarioSeleccionado.value
          })
        });

        const data = await res.json();

        if (res.status === 201) {
          exito.value = true;
          return;
        }

        if (res.status === 409) {
          horarioSeleccionado.value = '';
          error.value = data.error || 'El horario seleccionado ya no esta disponible';
          await recalcularHorarios();
          return;
        }

        error.value = data.error || 'No se pudo confirmar la reserva';
      } catch (fetchError) {
        error.value = 'No se pudo confirmar la reserva';
      } finally {
        cargando.value = false;
      }
    }

    watch(
      [fechaSeleccionada, servicioSeleccionado, modalidadSeleccionada],
      async ([nuevaFecha, nuevoServicio, nuevaModalidad], [fechaAnterior, servicioAnterior, modalidadAnterior]) => {
        if (nuevaFecha !== fechaAnterior || nuevoServicio?.id !== servicioAnterior?.id) {
          limpiarEstadoReserva();
        }

        if (nuevaModalidad !== modalidadAnterior) {
          horarioSeleccionado.value = '';
        }

        if (nuevaFecha && nuevoServicio && nuevaModalidad) {
          await recalcularHorarios();
          return;
        }

        horariosDisponibles.value = [];
      }
    );

    onMounted(async () => {
      await cargarDatosIniciales();
    });

    return {
      cargando,
      cargandoHorarios,
      cargandoInicial,
      clienteEmail,
      clienteNombre,
      clienteTelefono,
      confirmarReserva,
      direccionCliente,
      error,
      exito,
      fechaFormateadaExito,
      fechaMinima,
      fechaSeleccionada,
      formatearPrecio,
      horarioSeleccionado,
      horariosDisponibles,
      mensajeExito,
      modalidadSeleccionada,
      notasCliente,
      obtenerEtiquetaModalidad,
      profesionalNombre,
      seleccionarServicio,
      servicioSeleccionado,
      textoModalidadServicio,
      servicios
    };
  }
};
</script>

<style scoped>
  .reserva {
    margin-top: 8px;
  }

  .steps-stack {
    display: grid;
    gap: 18px;
  }

  .step-block {
    max-width: 600px;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg-base);
  }

  .step-header {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    margin-bottom: 16px;
    align-items: start;
  }

  .step-header h2 {
    font-size: 1.1rem;
    margin-bottom: 4px;
  }

  .step-header p {
    color: var(--text-secondary);
  }

  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--color-primary-light);
    color: var(--color-primary);
    font-weight: 700;
  }

  .services-grid,
  .slots-grid,
  .modalidad-options {
    display: grid;
    gap: 12px;
  }

  .service-card,
  .slot-button {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    color: var(--text-primary);
    cursor: pointer;
    transition:
      border-color var(--transition),
      background var(--transition);
  }

  .service-card {
    display: grid;
    gap: 6px;
    text-align: left;
  }

  .service-card span {
    color: var(--text-secondary);
  }

  .modalidad-tag {
    width: fit-content;
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--color-primary-light);
    color: var(--color-primary) !important;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .service-card.selected,
  .slot-button.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .service-card:hover,
  .slot-button:hover {
    background: var(--bg-card-hover);
  }

  .date-input,
  .form-grid input,
  .form-grid textarea {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    color: var(--text-primary);
    font: inherit;
  }

  .date-input:focus,
  .form-grid input:focus,
  .form-grid textarea:focus {
    outline: 2px solid transparent;
    border-color: var(--border-focus);
  }

  .form-grid {
    display: grid;
    gap: 14px;
  }

  .form-grid label {
    display: grid;
    gap: 6px;
  }

  .form-grid span {
    font-weight: 600;
  }

  .form-grid__full {
    grid-column: 1 / -1;
  }

  .form-grid textarea {
    resize: vertical;
  }

  .submit-button {
    border: none;
    border-radius: var(--radius-md);
    padding: 14px 18px;
    background: var(--color-accent);
    color: var(--text-on-primary);
    font-weight: 700;
    cursor: pointer;
    transition: background var(--transition);
  }

  .submit-button:hover {
    background: var(--color-accent-hover);
  }

  .submit-button:disabled {
    cursor: wait;
    opacity: 0.75;
  }

  .message,
  .success-box {
    max-width: 600px;
    margin-bottom: 18px;
    padding: 16px 18px;
    border-radius: var(--radius-md);
  }

  .error {
    border: 1px solid var(--color-danger);
    background: var(--color-danger-light);
    color: var(--color-danger);
  }

  .success-box {
    border: 1px solid var(--color-success);
    background: var(--color-success-light);
    color: var(--color-success);
  }

  .success-eyebrow {
    margin-bottom: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .success-box h2 {
    margin-bottom: 8px;
    color: var(--text-primary);
  }

  .success-box p + p {
    margin-top: 6px;
  }

  .hint {
    color: var(--text-secondary);
  }

  .horarios-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  @media (min-width: 640px) {
    .slots-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 600px) {
    .horarios-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
