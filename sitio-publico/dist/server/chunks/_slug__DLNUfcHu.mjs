import { c as createComponent } from './astro-component_U2njdhp4.mjs';
import 'piccolore';
import { r as renderComponent, p as renderTemplate, m as maybeRenderHead } from './server_CAbh2y2-.mjs';
import { $ as $$Layout } from './Layout_CuG65vGk.mjs';
import { mergeProps, ref, computed, watch, onMounted, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderStyle, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const API_BASE = 'http://localhost:4000/publico';

const _sfc_main = {
  props: {
    slug: { type: String, required: true }
  },
  setup(props) {
    const servicios = ref([]);
    const disponibilidad = ref([]);

    const servicioSeleccionado = ref(null);
    const fechaSeleccionada = ref('');
    const horariosDisponibles = ref([]);
    const horarioSeleccionado = ref('');

    const clienteNombre = ref('');
    const clienteEmail = ref('');
    const clienteTelefono = ref('');

    const cargando = ref(false);
    const cargandoInicial = ref(true);
    const cargandoHorarios = ref(false);
    const error = ref(null);
    const exito = ref(false);
    const profesionalNombre = ref('');

    const fechaMinima = new Date().toISOString().slice(0, 10);

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
      horariosDisponibles.value = [];
      limpiarEstadoReserva();
    }

    // Carga los datos base del perfil publico al montar la isla.
    // Si falla cualquiera de las llamadas, deja un mensaje visible y detiene el flujo.
    async function cargarDatosIniciales() {
      cargandoInicial.value = true;
      error.value = null;

      try {
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

      if (!horarioSeleccionado.value) {
        return 'Debes seleccionar un horario';
      }

      if (!clienteNombre.value || !clienteEmail.value) {
        return 'Nombre y email son obligatorios';
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
      [fechaSeleccionada, servicioSeleccionado],
      async ([nuevaFecha, nuevoServicio], [fechaAnterior, servicioAnterior]) => {
        if (nuevaFecha !== fechaAnterior || nuevoServicio?.id !== servicioAnterior?.id) {
          limpiarEstadoReserva();
        }

        if (nuevaFecha && nuevoServicio) {
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
      error,
      exito,
      fechaFormateadaExito,
      fechaMinima,
      fechaSeleccionada,
      formatearPrecio,
      horarioSeleccionado,
      horariosDisponibles,
      profesionalNombre,
      seleccionarServicio,
      servicioSeleccionado,
      servicios
    };
  }
};

function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<section${ssrRenderAttrs(mergeProps({ class: "reserva" }, _attrs))} data-v-cd532621>`);
  if ($setup.error) {
    _push(`<div class="message error" data-v-cd532621>${ssrInterpolate($setup.error)}</div>`);
  } else {
    _push(`<!---->`);
  }
  if ($setup.exito) {
    _push(`<div class="success-box" data-v-cd532621><p class="success-eyebrow" data-v-cd532621>Reserva confirmada</p><h2 data-v-cd532621>Turno reservado</h2><p data-v-cd532621> Te esperamos el ${
      ssrInterpolate($setup.fechaFormateadaExito)
    } a las ${
      ssrInterpolate($setup.horarioSeleccionado)
    }. </p><p data-v-cd532621> Servicio: ${
      ssrInterpolate($setup.servicioSeleccionado?.nombre)
    } con ${
      ssrInterpolate($setup.profesionalNombre)
    }</p></div>`);
  } else {
    _push(`<div class="steps-stack" data-v-cd532621><section class="step-block" data-v-cd532621><div class="step-header" data-v-cd532621><span class="step-number" data-v-cd532621>1</span><div data-v-cd532621><h2 data-v-cd532621>Elegi un servicio</h2><p data-v-cd532621>Selecciona la opcion que mejor se ajuste a tu necesidad.</p></div></div>`);
    if ($setup.cargandoInicial) {
      _push(`<div class="cargando-container" data-v-cd532621><span class="spinner" data-v-cd532621></span></div>`);
    } else {
      _push(`<div class="services-grid" data-v-cd532621><!--[-->`);
      ssrRenderList($setup.servicios, (servicio, index) => {
        _push(`<button type="button" style="${
          ssrRenderStyle({ animationDelay: `${index * 70}ms` })
        }" class="${
          ssrRenderClass([{ selected: $setup.servicioSeleccionado?.id === servicio.id }, "service-card card animate-in"])
        }" data-v-cd532621><strong data-v-cd532621>${
          ssrInterpolate(servicio.nombre)
        }</strong><span data-v-cd532621>${
          ssrInterpolate(servicio.duracion_minutos)
        } min</span>`);
        if (servicio.precio !== null && servicio.precio !== undefined) {
          _push(`<span data-v-cd532621> \$${ssrInterpolate($setup.formatearPrecio(servicio.precio))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div>`);
    }
    _push(`</section>`);
    if ($setup.servicioSeleccionado) {
      _push(`<section class="step-block" data-v-cd532621><div class="step-header" data-v-cd532621><span class="step-number" data-v-cd532621>2</span><div data-v-cd532621><h2 data-v-cd532621>Elegi una fecha</h2><p data-v-cd532621>Solo se muestran horarios vigentes para el dia elegido.</p></div></div><input${
        ssrRenderAttr("value", $setup.fechaSeleccionada)
      } class="date-input" type="date"${
        ssrRenderAttr("min", $setup.fechaMinima)
      } data-v-cd532621></section>`);
    } else {
      _push(`<!---->`);
    }
    if ($setup.servicioSeleccionado && $setup.fechaSeleccionada) {
      _push(`<section class="step-block" data-v-cd532621><div class="step-header" data-v-cd532621><span class="step-number" data-v-cd532621>3</span><div data-v-cd532621><h2 data-v-cd532621>Elegi un horario</h2><p data-v-cd532621>Los horarios ocupados o pasados se excluyen automaticamente.</p></div></div>`);
      if ($setup.cargandoHorarios) {
        _push(`<div class="cargando-container" data-v-cd532621><span class="spinner" data-v-cd532621></span></div>`);
      } else if ($setup.horariosDisponibles.length === 0) {
        _push(`<p class="hint" data-v-cd532621> No hay horarios disponibles para esta fecha. </p>`);
      } else {
        _push(`<div class="slots-grid horarios-grid" data-v-cd532621><!--[-->`);
        ssrRenderList($setup.horariosDisponibles, (horario, index) => {
          _push(`<button type="button" style="${
            ssrRenderStyle({ animationDelay: `${index * 40}ms` })
          }" class="${
            ssrRenderClass([{ selected: $setup.horarioSeleccionado === horario }, "slot-button animate-in"])
          }" data-v-cd532621>${
            ssrInterpolate(horario)
          }</button>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</section>`);
    } else {
      _push(`<!---->`);
    }
    if ($setup.horarioSeleccionado) {
      _push(`<section class="step-block" data-v-cd532621><div class="step-header" data-v-cd532621><span class="step-number" data-v-cd532621>4</span><div data-v-cd532621><h2 data-v-cd532621>Tus datos</h2><p data-v-cd532621>Completa la informacion necesaria para registrar la reserva.</p></div></div><form class="form-grid" data-v-cd532621><label data-v-cd532621><span data-v-cd532621>Nombre</span><input${
        ssrRenderAttr("value", $setup.clienteNombre)
      } type="text" data-v-cd532621></label><label data-v-cd532621><span data-v-cd532621>Email</span><input${
        ssrRenderAttr("value", $setup.clienteEmail)
      } type="email" data-v-cd532621></label><label data-v-cd532621><span data-v-cd532621>Telefono</span><input${
        ssrRenderAttr("value", $setup.clienteTelefono)
      } type="text" data-v-cd532621></label><button class="submit-button" type="submit"${
        (ssrIncludeBooleanAttr($setup.cargando)) ? " disabled" : ""
      } data-v-cd532621>${
        ssrInterpolate($setup.cargando ? 'Confirmando...' : 'Confirmar reserva')
      }</button></form></section>`);
    } else {
      _push(`<!---->`);
    }
    _push(`</div>`);
  }
  _push(`</section>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext()
  ;(ssrContext.modules || (ssrContext.modules = new Set())).add("src/vue-components/FormReserva.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : undefined
};
const FormReserva = /*#__PURE__*/_export_sfc(_sfc_main, [['ssrRender',_sfc_ssrRender],['__scopeId',"data-v-cd532621"]]);

const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  let profesional = null;
  try {
    const res = await fetch(`http://backend:4000/publico/${slug}`);
    if (!res.ok) {
      return Astro2.redirect("/404");
    }
    profesional = await res.json();
  } catch (error) {
    return Astro2.redirect("/404");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${profesional.nombre} | Sistema de Turnos Online`, "data-astro-cid-yvbahnfj": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="pagina-profesional" data-astro-cid-yvbahnfj> <div class="profile-card card animate-in" data-astro-cid-yvbahnfj> <p class="eyebrow" data-astro-cid-yvbahnfj>Perfil publico</p> <h1 data-astro-cid-yvbahnfj>${profesional.nombre}</h1> <p class="specialty" data-astro-cid-yvbahnfj>${profesional.especialidad || "Especialidad no informada"}</p> ${profesional.descripcion && renderTemplate`<p class="profesional-descripcion" data-astro-cid-yvbahnfj>${profesional.descripcion}</p>`} ${profesional.direccion && renderTemplate`<p class="profesional-direccion" data-astro-cid-yvbahnfj>📍 ${profesional.direccion}</p>`} <hr data-astro-cid-yvbahnfj> ${renderComponent($$result2, "FormReserva", FormReserva, { "client:load": true, "slug": slug, "client:component-hydration": "load", "client:component-path": "C:/Users/Gabriel/Desktop/SistemaDeTurnosOnline/sitio-publico/src/vue-components/FormReserva.vue", "client:component-export": "default", "data-astro-cid-yvbahnfj": true })} </div> </section> ` })}`;
}, "C:/Users/Gabriel/Desktop/SistemaDeTurnosOnline/sitio-publico/src/pages/[slug].astro", void 0);

const $$file = "C:/Users/Gabriel/Desktop/SistemaDeTurnosOnline/sitio-publico/src/pages/[slug].astro";
const $$url = "/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
