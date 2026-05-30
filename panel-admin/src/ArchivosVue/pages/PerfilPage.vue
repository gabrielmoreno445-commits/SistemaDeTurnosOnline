<!--
PerfilPage.vue
Permite al profesional actualizar sus datos visibles en el sitio publico
y cambiar su contrasena de acceso al panel.
Los cambios exitosos tambien actualizan el store local para que la SPA
muestre el nombre y la especialidad nuevos sin recargar la sesion.
-->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  actualizarPerfil,
  cambiarPassword,
  eliminarFotoPerfil,
  subirFotoPerfil
} from '../../ArchivosJS/api/perfil.js';
import { API_URL } from '../../ArchivosJS/utils/api.js';
import NavBar from '../components/NavBar.vue';
import { useAuth } from '../composables/useAuth.js';
import { useAuthStore } from '../stores/authStore.js';

const authStore = useAuthStore();
const { profesional, token } = useAuth();

const formulario = reactive({
  nombre: '',
  especialidad: '',
  telefono: '',
  descripcion: '',
  direccion: ''
});

const passwords = reactive({
  actual: '',
  nuevo: '',
  confirmar: ''
});

const cargando = ref(false);
const mensaje = ref(null);
const error = ref(null);
const cargandoInicial = ref(false);

const cargandoPass = ref(false);
const mensajePass = ref(null);
const errorPass = ref(null);
const fotoUrl = ref(null);
const archivoFoto = ref(null);
const subiendoFoto = ref(false);
const mensajeFoto = ref(null);
const errorFoto = ref(null);

const fotoSrc = computed(() => {
  if (!fotoUrl.value) {
    return null;
  }

  if (fotoUrl.value.startsWith('http')) {
    return fotoUrl.value;
  }

  return `${API_URL}${fotoUrl.value}`;
});

// Precarga el formulario desde el store para evitar una request extra al abrir la pagina.
// La sesion ya trae estos datos porque el backend los devuelve en /auth/me.
function completarFormularioDesdeSesion() {
  formulario.nombre = profesional.value?.nombre || '';
  formulario.especialidad = profesional.value?.especialidad || '';
  formulario.telefono = profesional.value?.telefono || '';
  formulario.descripcion = profesional.value?.descripcion || '';
  formulario.direccion = profesional.value?.direccion || '';
  fotoUrl.value = profesional.value?.foto_url || null;
}

// Reutiliza el endpoint de perfil con body vacio para obtener el estado persistido actual.
// Asi la pagina puede precargar descripcion y direccion sin depender de que el token las traiga.
async function cargarPerfilActual() {
  if (!token.value) {
    completarFormularioDesdeSesion();
    return;
  }

  cargandoInicial.value = true;

  try {
    const perfilActual = await actualizarPerfil(token.value, {});

    authStore.profesional = {
      ...authStore.profesional,
      ...perfilActual
    };
  } catch (fetchError) {
    // Si esta consulta auxiliar falla, la pagina igual conserva los datos del store.
  } finally {
    completarFormularioDesdeSesion();
    cargandoInicial.value = false;
  }
}

// Guarda los cambios de perfil y sincroniza el store local con la respuesta persistida.
// Esto evita inconsistencias entre lo visible en NavBar y lo que ya quedo guardado en backend.
async function guardarPerfil() {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  mensaje.value = null;
  error.value = null;

  try {
    const perfilActualizado = await actualizarPerfil(token.value, formulario);

    authStore.profesional = {
      ...authStore.profesional,
      ...perfilActualizado
    };

    completarFormularioDesdeSesion();
    mensaje.value = 'Perfil actualizado correctamente';
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

// Cambia la contrasena con validaciones previas de frontend para dar feedback inmediato.
// Si el backend confirma el cambio, limpia los campos sensibles para no dejarlos visibles.
async function guardarPassword() {
  if (!token.value) {
    return;
  }

  if (passwords.nuevo !== passwords.confirmar) {
    errorPass.value = 'Las contraseñas no coinciden';
    mensajePass.value = null;
    return;
  }

  if (passwords.nuevo.length < 6) {
    errorPass.value = 'La nueva contraseña debe tener al menos 6 caracteres';
    mensajePass.value = null;
    return;
  }

  cargandoPass.value = true;
  mensajePass.value = null;
  errorPass.value = null;

  try {
    const respuesta = await cambiarPassword(token.value, passwords.actual, passwords.nuevo);

    passwords.actual = '';
    passwords.nuevo = '';
    passwords.confirmar = '';
    mensajePass.value = respuesta.mensaje;
  } catch (fetchError) {
    errorPass.value = fetchError.message;
  } finally {
    cargandoPass.value = false;
  }
}

function seleccionarFoto(event) {
  const [archivo] = event.target.files;
  archivoFoto.value = archivo || null;
  mensajeFoto.value = null;
  errorFoto.value = null;
}

// Sube la nueva foto y sincroniza el store para que otras vistas puedan reutilizarla.
// El archivo viaja como FormData porque el backend usa Multer.
async function subirFoto() {
  if (!token.value || !archivoFoto.value) {
    errorFoto.value = 'Debes seleccionar una imagen';
    return;
  }

  subiendoFoto.value = true;
  mensajeFoto.value = null;
  errorFoto.value = null;

  try {
    const respuesta = await subirFotoPerfil(token.value, archivoFoto.value);

    fotoUrl.value = respuesta.foto_url;
    authStore.profesional = {
      ...authStore.profesional,
      foto_url: respuesta.foto_url
    };
    archivoFoto.value = null;
    mensajeFoto.value = 'Foto actualizada correctamente';
  } catch (fetchError) {
    errorFoto.value = fetchError.message;
  } finally {
    subiendoFoto.value = false;
  }
}

// Elimina la foto persistida y vuelve al placeholder localmente.
// La API tambien borra el archivo fisico para no acumular imagenes sin uso.
async function eliminarFoto() {
  if (!token.value) {
    return;
  }

  subiendoFoto.value = true;
  mensajeFoto.value = null;
  errorFoto.value = null;

  try {
    const respuesta = await eliminarFotoPerfil(token.value);

    fotoUrl.value = null;
    authStore.profesional = {
      ...authStore.profesional,
      foto_url: null
    };
    mensajeFoto.value = respuesta.mensaje;
  } catch (fetchError) {
    errorFoto.value = fetchError.message;
  } finally {
    subiendoFoto.value = false;
  }
}

onMounted(async () => {
  await cargarPerfilActual();
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
              <h1>Mi perfil</h1>
              <p>Actualizá los datos que verán tus clientes en tu página pública.</p>
            </div>
          </div>

          <div v-if="cargandoInicial" class="cargando-container">
            <span class="spinner"></span>
          </div>

          <p v-else-if="mensaje" class="message message--success">
            {{ mensaje }}
          </p>

          <p v-if="error" class="message message--error">
            {{ error }}
          </p>

          <div class="form-grid">
            <label>
              <span>Nombre</span>
              <input v-model="formulario.nombre" type="text" required />
            </label>

            <label>
              <span>Especialidad</span>
              <input v-model="formulario.especialidad" type="text" />
            </label>

            <label>
              <span>Teléfono</span>
              <input v-model="formulario.telefono" type="text" />
            </label>

            <label class="form-grid__full">
              <span>Descripción</span>
              <textarea
                v-model="formulario.descripcion"
                rows="4"
                placeholder="Texto que verán tus clientes en tu página pública"
              />
            </label>

            <label class="form-grid__full">
              <span>Dirección</span>
              <input
                v-model="formulario.direccion"
                type="text"
                placeholder="Dirección de tu consultorio o local"
              />
            </label>
          </div>

          <div class="actions">
            <button class="button button--primary" type="button" :disabled="cargando" @click="guardarPerfil">
              {{ cargando ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-header">
            <div>
              <h2>Cambiar contraseña</h2>
              <p>Usá una nueva contraseña para ingresar al panel de administración.</p>
            </div>
          </div>

          <p v-if="mensajePass" class="message message--success">
            {{ mensajePass }}
          </p>

          <p v-if="errorPass" class="message message--error">
            {{ errorPass }}
          </p>

          <div class="form-grid">
            <label>
              <span>Contraseña actual</span>
              <input v-model="passwords.actual" type="password" />
            </label>

            <label>
              <span>Nueva contraseña</span>
              <input v-model="passwords.nuevo" type="password" />
            </label>

            <label>
              <span>Confirmar nueva contraseña</span>
              <input v-model="passwords.confirmar" type="password" />
            </label>
          </div>

          <div class="actions">
            <button class="button button--primary" type="button" :disabled="cargandoPass" @click="guardarPassword">
              {{ cargandoPass ? 'Actualizando...' : 'Actualizar contraseña' }}
            </button>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-header">
            <div>
              <h2>Foto de perfil</h2>
              <p>Esta imagen se usara como avatar publico del profesional.</p>
            </div>
          </div>

          <p v-if="mensajeFoto" class="message message--success">
            {{ mensajeFoto }}
          </p>

          <p v-if="errorFoto" class="message message--error">
            {{ errorFoto }}
          </p>

          <div class="photo-section">
            <img v-if="fotoSrc" class="avatar" :src="fotoSrc" alt="Foto de perfil" />
            <div v-else class="avatar avatar--empty">Sin foto</div>

            <div class="photo-controls">
              <input type="file" accept="image/jpeg,image/png,image/webp" @change="seleccionarFoto" />

              <div class="actions">
                <button class="button button--primary" type="button" :disabled="subiendoFoto || !archivoFoto" @click="subirFoto">
                  {{ subiendoFoto ? 'Subiendo...' : 'Subir foto' }}
                </button>
                <button v-if="fotoUrl" class="button button--danger" type="button" :disabled="subiendoFoto" @click="eliminarFoto">
                  Eliminar foto
                </button>
              </div>
            </div>
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
.panel-header p {
  margin: 0;
}

.panel-header p {
  margin-top: 6px;
  color: var(--color-text-muted, #64748b);
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

.form-grid input,
.form-grid textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-input-bg, #ffffff);
  color: var(--color-text, #0f172a);
}

.form-grid textarea {
  resize: vertical;
}

.message {
  padding: 14px;
  border-radius: var(--radius-md, 0.75rem);
}

.message--error {
  background: var(--color-danger-soft, #fef2f2);
  color: var(--color-danger, #b42318);
}

.message--success {
  background: var(--color-success-soft, #ecfdf3);
  color: var(--color-success, #067647);
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

.button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.button--primary {
  background: var(--color-primary, #2563eb);
}

.button--danger {
  background: var(--color-danger, #b42318);
}

.photo-section {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--color-border, #d0d5dd);
  background: var(--color-surface, #f3f4f6);
}

.avatar--empty {
  display: grid;
  place-items: center;
  color: var(--color-text-muted, #64748b);
  font-weight: 700;
}

.photo-controls {
  display: grid;
  gap: 12px;
}
</style>
