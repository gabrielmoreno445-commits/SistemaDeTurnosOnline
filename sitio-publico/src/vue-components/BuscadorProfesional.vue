<!--
BuscadorProfesional.vue
Componente Vue que maneja la busqueda de profesionales en tiempo real.
Vive en index.astro como isla interactiva con client:load.
Usa debounce de 400ms para evitar una llamada a la API por cada tecla.
-->
<script setup>
import { ref } from 'vue';

const termino = ref('');
const resultados = ref([]);
const cargando = ref(false);
const error = ref(null);
const timerId = ref(null);
const sinResultados = ref(false);
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000';

function obtenerFoto(fotoUrl) {
  if (!fotoUrl) {
    return null;
  }

  return `${API_URL}${fotoUrl}`;
}

function navegarAProfesional(slug) {
  window.location.href = `/${slug}`;
}

function obtenerModalidades(profesional) {
  const modalidades = [];

  if (Number(profesional.atiende_en_local) === 1) {
    modalidades.push('Local');
  }

  if (Number(profesional.atiende_a_domicilio) === 1) {
    modalidades.push('A domicilio');
  }

  return modalidades.length > 0 ? modalidades : ['Local'];
}

// Cancela la busqueda anterior y espera 400ms desde la ultima tecla.
// Esto baja la carga sobre el backend y mantiene el buscador reactivo.
function alEscribir() {
  clearTimeout(timerId.value);
  error.value = null;

  const texto = termino.value.trim();

  if (texto.length < 2) {
    resultados.value = [];
    sinResultados.value = false;
    cargando.value = false;
    return;
  }

  timerId.value = setTimeout(buscar, 400);
}

// Consulta el endpoint publico desde el navegador.
// En Vue se usa localhost porque esta llamada ocurre en el cliente, no dentro de Docker.
async function buscar() {
  const texto = termino.value.trim();

  if (texto.length < 2) {
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    const res = await fetch(`${API_URL}/busqueda?q=${encodeURIComponent(texto)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'No se pudo realizar la busqueda');
    }

    resultados.value = data;
    sinResultados.value = data.length === 0;
  } catch (fetchError) {
    resultados.value = [];
    sinResultados.value = false;
    error.value = 'No se pudo realizar la busqueda';
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <section class="search-card">
    <label class="search-label" for="busqueda-profesional">Busca tu proximo turno</label>

    <div class="search-box">
      <input
        id="busqueda-profesional"
        v-model="termino"
        type="text"
        placeholder="Busca por nombre, oficio o especialidad en Eldorado..."
        autocomplete="off"
        @input="alEscribir"
      />

      <div v-if="cargando" class="search-status">
        <span class="spinner"></span>
      </div>

      <p v-if="error" class="search-message search-message--error">
        {{ error }}
      </p>

      <p v-if="sinResultados" class="search-message">
        No encontramos profesionales con ese termino
      </p>

      <div v-if="resultados.length > 0" class="resultados-lista">
        <button
          v-for="profesional in resultados"
          :key="profesional.id"
          class="resultado-card"
          type="button"
          @click="navegarAProfesional(profesional.slug)"
        >
          <img
            v-if="profesional.foto_url"
            class="resultado-foto"
            :src="obtenerFoto(profesional.foto_url)"
            :alt="`Foto de ${profesional.nombre}`"
          />
          <span v-else class="resultado-foto resultado-foto--empty">
            {{ profesional.nombre.charAt(0).toUpperCase() }}
          </span>

          <span class="resultado-info">
            <strong>{{ profesional.nombre }}</strong>
            <small>{{ profesional.especialidad || 'Especialidad no informada' }}</small>
            <span class="modalidades-row">
              <span
                v-for="modalidad in obtenerModalidades(profesional)"
                :key="modalidad"
                class="modalidad-chip"
              >
                {{ modalidad }}
              </span>
            </span>
            <small v-if="Number(profesional.atiende_a_domicilio) === 1 && profesional.zona_cobertura">
              {{ profesional.zona_cobertura }}
            </small>
          </span>
        </button>
      </div>

      <a
        v-if="termino.trim().length >= 2"
        :href="`/buscar?q=${encodeURIComponent(termino.trim())}`"
        class="ver-todos"
      >
        Ver todos los resultados para "{{ termino.trim() }}"
      </a>
    </div>
  </section>
</template>

<style scoped>
.search-card {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.search-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-box {
  display: grid;
  gap: 12px;
}

.search-box input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
}

.search-status {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.search-message {
  margin: 0;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--bg-base);
  color: var(--text-secondary);
}

.search-message--error {
  color: var(--color-danger);
}

.resultados-lista {
  display: grid;
  gap: 10px;
}

.resultado-card {
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.resultado-card:hover {
  background: var(--bg-card-hover);
}

.resultado-foto {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border);
}

.resultado-foto--empty {
  display: grid;
  place-items: center;
  background: var(--bg-base);
  color: var(--text-muted);
  font-weight: 700;
}

.resultado-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.resultado-info strong,
.resultado-info small {
  overflow-wrap: anywhere;
}

.resultado-info small {
  color: var(--text-secondary);
}

.modalidades-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.modalidad-chip {
  width: fit-content;
  padding: 3px 7px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 700;
}

.ver-todos {
  display: block;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 700;
  text-align: center;
}
</style>
