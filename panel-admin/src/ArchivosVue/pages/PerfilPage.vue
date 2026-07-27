<!--
PerfilPage.vue
Vista de perfil del profesional reorganizada en tres cards.
Mejora la copia del link publico, la carga de foto con preview y la lectura
del formulario en desktop y mobile sin cambiar los endpoints existentes.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

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

const sitioPublicoUrl = import.meta.env.VITE_SITIO_PUBLICO_URL || 'http://localhost:4321';

const formulario = reactive({
  nombre: '',
  especialidad: '',
  email: '',
  telefono: '',
  descripcion: '',
  direccion: '',
  zona_cobertura: 'Eldorado, Misiones y hasta 15 km a la redonda'
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
const fotoBase64 = ref(null);
const fotoInput = ref(null);
const subiendoFoto = ref(false);
const mensajeFoto = ref(null);
const errorFoto = ref(null);

const toast = ref(null);
let toastTimer = null;

const fotoSrc = computed(() => {
  if (fotoBase64.value) {
    return fotoBase64.value;
  }

  if (!fotoUrl.value) {
    return null;
  }

  if (fotoUrl.value.startsWith('http')) {
    return fotoUrl.value;
  }

  return `${API_URL}${fotoUrl.value}`;
});

const linkPublico = computed(() => {
  const slug = profesional.value?.slug || '';
  const base = sitioPublicoUrl.replace(/\/+$/, '');

  return slug ? `${base}/${slug}` : base;
});

const descripcionCantidad = computed(() => formulario.descripcion.length);

function mostrarToast(mensajeToast, tipo = 'success') {
  toast.value = {
    mensaje: mensajeToast,
    tipo
  };

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 2200);
}

function completarFormularioDesdeSesion() {
  formulario.nombre = profesional.value?.nombre || '';
  formulario.especialidad = profesional.value?.especialidad || '';
  formulario.email = profesional.value?.email || '';
  formulario.telefono = profesional.value?.telefono || '';
  formulario.descripcion = profesional.value?.descripcion || '';
  formulario.direccion = profesional.value?.direccion || '';
  formulario.zona_cobertura = profesional.value?.zona_cobertura || 'Eldorado, Misiones y hasta 15 km a la redonda';
  fotoUrl.value = profesional.value?.foto_url || null;
}

function limpiarSelectorFoto() {
  if (fotoInput.value) {
    fotoInput.value.value = '';
  }
}

function limpiarFotoSeleccionada() {
  fotoBase64.value = null;
  limpiarSelectorFoto();
}

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
    // Si falla esta consulta auxiliar, mantenemos los datos que ya trae la sesion.
  } finally {
    completarFormularioDesdeSesion();
    cargandoInicial.value = false;
  }
}

async function guardarPerfil() {
  if (!token.value) {
    return;
  }

  cargando.value = true;
  mensaje.value = null;
  error.value = null;

  try {
    const perfilActualizado = await actualizarPerfil(token.value, {
      nombre: formulario.nombre,
      especialidad: formulario.especialidad,
      telefono: formulario.telefono,
      descripcion: formulario.descripcion,
      direccion: formulario.direccion,
      zona_cobertura: formulario.zona_cobertura
    });

    authStore.profesional = {
      ...authStore.profesional,
      ...perfilActualizado
    };

    completarFormularioDesdeSesion();
    mensaje.value = 'Perfil actualizado correctamente';
    mostrarToast('Perfil guardado', 'success');
  } catch (fetchError) {
    error.value = fetchError.message;
  } finally {
    cargando.value = false;
  }
}

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
    mostrarToast('Contraseña actualizada', 'success');
  } catch (fetchError) {
    errorPass.value = fetchError.message;
  } finally {
    cargandoPass.value = false;
  }
}

function handleFileUpload(event) {
  const [archivo] = event.target.files || [];
  mensajeFoto.value = null;
  errorFoto.value = null;

  if (!archivo) {
    limpiarFotoSeleccionada();
    return;
  }

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!tiposPermitidos.includes(archivo.type)) {
    errorFoto.value = 'Solo se permiten archivos JPG, JPEG, PNG o WebP';
    limpiarFotoSeleccionada();
    return;
  }

  const maximoBytes = 2 * 1024 * 1024;

  if (archivo.size > maximoBytes) {
    errorFoto.value = 'La imagen no puede superar los 2 MB';
    limpiarFotoSeleccionada();
    return;
  }

  const lector = new FileReader();

  lector.onload = () => {
    fotoBase64.value = String(lector.result || '');
  };

  lector.onerror = () => {
    errorFoto.value = 'No se pudo leer la imagen seleccionada';
    limpiarFotoSeleccionada();
  };

  lector.readAsDataURL(archivo);
}

async function subirFoto() {
  if (!token.value || !fotoBase64.value) {
    errorFoto.value = 'Debes seleccionar una imagen';
    return;
  }

  subiendoFoto.value = true;
  mensajeFoto.value = null;
  errorFoto.value = null;

  try {
    const respuesta = await subirFotoPerfil(token.value, fotoBase64.value);

    fotoUrl.value = respuesta.foto_url;
    authStore.profesional = {
      ...authStore.profesional,
      foto_url: respuesta.foto_url
    };
    limpiarFotoSeleccionada();
    mensajeFoto.value = 'Foto actualizada correctamente';
    mostrarToast('Foto actualizada', 'success');
  } catch (fetchError) {
    errorFoto.value = fetchError.message;
  } finally {
    subiendoFoto.value = false;
  }
}

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
    limpiarFotoSeleccionada();
    authStore.profesional = {
      ...authStore.profesional,
      foto_url: null
    };
    mensajeFoto.value = respuesta.mensaje;
    mostrarToast('Foto eliminada', 'success');
  } catch (fetchError) {
    errorFoto.value = fetchError.message;
  } finally {
    subiendoFoto.value = false;
  }
}

async function copiarLinkPublico() {
  try {
    await navigator.clipboard.writeText(linkPublico.value);
    mostrarToast('Link publico copiado', 'success');
  } catch (errorClipboard) {
    mostrarToast('No se pudo copiar el link', 'error');
  }
}

function formatearURLPublica(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch (error) {
    return url;
  }
}

onMounted(async () => {
  await cargarPerfilActual();
});

onBeforeUnmount(() => {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
});
</script>

<template>
  <main class="page-shell">
    <section class="page-content">
      <NavBar />

      <section class="page-stack">
        <section class="page-hero panel-card animate-in">
          <div>
            <p class="eyebrow">Mi perfil</p>
            <h1>Gestiona tu identidad profesional</h1>
            <p>
              Actualiza los datos que ven tus clientes, comparte tu pagina publica con un click
              y cambia tu foto con una vista previa antes de guardar.
            </p>
          </div>

          <div class="hero-actions">
            <a class="button button--secondary" :href="linkPublico" target="_blank" rel="noreferrer">
              Ver mi página pública
            </a>
            <button class="button button--ghost" type="button" :disabled="!linkPublico" @click="copiarLinkPublico">
              Copiar link
            </button>
          </div>
        </section>

        <div v-if="toast" class="toast" :class="`toast--${toast.tipo}`" role="status" aria-live="polite">
          {{ toast.mensaje }}
        </div>

        <p v-if="error" class="message message--error">
          {{ error }}
        </p>

        <section class="cards-grid">
          <article class="panel-card animate-in" style="animation-delay: 60ms;">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Card 1</p>
                <h2>Información profesional</h2>
                <p>Foto, nombre, especialidad y datos de contacto.</p>
              </div>
            </div>

            <div v-if="cargandoInicial" class="cargando-container">
              <span class="spinner"></span>
            </div>

            <template v-else>
              <div class="profile-photo-row">
                <div class="photo-stack">
                  <img v-if="fotoSrc" class="avatar avatar--large" :src="fotoSrc" alt="Foto de perfil" />
                  <div v-else class="avatar avatar--large avatar--empty">Sin foto</div>
                </div>

                <div class="photo-controls">
                  <label class="file-field">
                    <span>Foto de perfil</span>
                    <input
                      ref="fotoInput"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      @change="handleFileUpload"
                    />
                  </label>

                  <p class="field-hint">
                    Formatos recomendados: JPG, PNG o WEBP. Vas a ver la vista previa antes de subirla.
                  </p>

                  <div class="actions">
                    <button
                      class="button button--primary"
                      type="button"
                      :disabled="subiendoFoto || !fotoBase64"
                      @click="subirFoto"
                    >
                      {{ subiendoFoto ? 'Subiendo...' : 'Subir foto' }}
                    </button>
                    <button
                      v-if="fotoUrl"
                      class="button button--danger"
                      type="button"
                      :disabled="subiendoFoto"
                      @click="eliminarFoto"
                    >
                      Eliminar foto
                    </button>
                  </div>

                  <p v-if="mensajeFoto" class="message message--success">
                    {{ mensajeFoto }}
                  </p>
                  <p v-if="errorFoto" class="message message--error">
                    {{ errorFoto }}
                  </p>
                </div>
              </div>

              <div class="form-grid form-grid--two">
                <label>
                  <span>Nombre</span>
                  <input v-model="formulario.nombre" type="text" required />
                </label>

                <label>
                  <span>Especialidad</span>
                  <input v-model="formulario.especialidad" type="text" />
                </label>

                <label>
                  <span>Email</span>
                  <input v-model="formulario.email" type="email" disabled />
                </label>

                <label>
                  <span>Teléfono</span>
                  <input v-model="formulario.telefono" type="text" />
                </label>
              </div>

              <div class="actions actions--end">
                <button class="button button--primary" type="button" :disabled="cargando" @click="guardarPerfil">
                  {{ cargando ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>

              <p v-if="mensaje" class="message message--success">
                {{ mensaje }}
              </p>
            </template>
          </article>

          <article class="panel-card animate-in" style="animation-delay: 120ms;">
            <div class="panel-header panel-header--split">
              <div>
                <p class="eyebrow">Card 2</p>
                <h2>Perfil público y ubicación</h2>
                <p>Comparte tu link público y ajusta tu presencia visible para tus clientes.</p>
              </div>
              <div class="public-link-box">
                <span class="public-link-box__label">Link público</span>
                <strong>{{ formatearURLPublica(linkPublico) }}</strong>
              </div>
            </div>

            <div class="form-grid">
              <label>
                <span>Dirección</span>
                <input
                  v-model="formulario.direccion"
                  type="text"
                  placeholder="Dirección de tu consultorio o local"
                />
              </label>

              <label class="form-grid__full">
                <span>Descripción / biografía</span>
                <textarea
                  v-model="formulario.descripcion"
                  rows="5"
                  maxlength="300"
                  placeholder="Texto que verán tus clientes en tu página pública"
                />
                <small class="field-counter">{{ descripcionCantidad }}/300 caracteres</small>
              </label>

              <label class="form-grid__full">
                <span>Zona de cobertura</span>
                <input
                  v-model="formulario.zona_cobertura"
                  type="text"
                  placeholder="Eldorado, Misiones y hasta 15 km a la redonda"
                />
              </label>
            </div>

            <div class="actions">
              <a class="button button--secondary" :href="linkPublico" target="_blank" rel="noreferrer">
                Ver mi página pública
              </a>
              <button class="button button--ghost" type="button" @click="copiarLinkPublico">
                Copiar link
              </button>
            </div>
          </article>

          <article class="panel-card panel-card--security animate-in" style="animation-delay: 180ms;">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Card 3</p>
                <h2>Seguridad</h2>
                <p>Cambia tu contraseña para mantener segura la cuenta del panel.</p>
              </div>
            </div>

            <div class="form-grid form-grid--three">
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

            <p v-if="mensajePass" class="message message--success">
              {{ mensajePass }}
            </p>

            <p v-if="errorPass" class="message message--error">
              {{ errorPass }}
            </p>

            <div class="actions actions--end">
              <button class="button button--primary" type="button" :disabled="cargandoPass" @click="guardarPassword">
                {{ cargandoPass ? 'Actualizando...' : 'Actualizar contraseña' }}
              </button>
            </div>
          </article>
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
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(6, 118, 71, 0.08), transparent 26%),
    var(--color-surface, #f8fafc);
}

.page-content {
  width: min(100%, 1120px);
  margin: 0 auto;
}

.page-stack {
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

.panel-card--security {
  gap: 16px;
}

.page-hero {
  grid-template-columns: minmax(0, 1.5fr) auto;
  align-items: center;
}

.panel-header,
.page-hero h1,
.page-hero p,
.panel-header h2,
.panel-header p,
.message {
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

.page-hero h1 {
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  line-height: 1.05;
}

.page-hero p,
.panel-header p {
  color: var(--color-text-muted, #64748b);
  line-height: 1.55;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: var(--radius-md, 0.75rem);
  color: var(--color-primary-contrast, #ffffff);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.button--primary {
  background: var(--color-primary, #2563eb);
}

.button--secondary {
  border-color: rgba(37, 99, 235, 0.2);
  background: rgba(37, 99, 235, 0.12);
  color: var(--color-primary);
}

.button--ghost {
  border-color: var(--color-border, #d0d5dd);
  background: var(--color-surface, #f8fafc);
  color: var(--color-text, #0f172a);
}

.button--danger {
  background: var(--color-danger, #b42318);
}

.cards-grid {
  display: grid;
  gap: 18px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.panel-header--split {
  align-items: flex-start;
}

.public-link-box {
  display: grid;
  gap: 4px;
  align-content: start;
  justify-items: end;
  padding: 14px 16px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-lg, 1rem);
  background: var(--color-surface, #f8fafc);
  max-width: 100%;
}

.public-link-box__label {
  color: var(--color-text-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.public-link-box strong {
  max-width: 100%;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.4;
  word-break: break-all;
  text-align: right;
}

.toast {
  position: sticky;
  top: 12px;
  z-index: 4;
  width: fit-content;
  max-width: 100%;
  padding: 12px 14px;
  border-radius: 999px;
  box-shadow: var(--shadow-md);
  font-size: 0.92rem;
  font-weight: 700;
}

.toast--success {
  background: var(--color-success-soft, #ecfdf3);
  color: var(--color-success, #067647);
}

.toast--error {
  background: var(--color-danger-soft, #fef2f2);
  color: var(--color-danger, #b42318);
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

.profile-photo-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.photo-stack {
  display: grid;
  place-items: start;
}

.avatar {
  object-fit: cover;
  border: 1px solid var(--color-border, #d0d5dd);
  background: var(--color-surface, #f3f4f6);
}

.avatar--large {
  width: 112px;
  height: 112px;
  border-radius: 999px;
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

.file-field {
  display: grid;
  gap: 6px;
}

.file-field span,
.form-grid span {
  color: var(--color-text);
  font-weight: 700;
}

.file-field input,
.form-grid input,
.form-grid textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #d0d5dd);
  border-radius: var(--radius-md, 0.75rem);
  background: var(--color-input-bg, #ffffff);
  color: var(--color-text, #0f172a);
}

.file-field input:disabled,
.form-grid input:disabled {
  opacity: 0.8;
}

.field-hint,
.field-counter {
  margin: 0;
  color: var(--color-text-muted, #64748b);
  font-size: 0.88rem;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.form-grid label {
  display: grid;
  gap: 6px;
}

.form-grid textarea {
  resize: vertical;
  min-height: 128px;
}

.form-grid__full {
  grid-column: 1 / -1;
}

.form-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.actions--end {
  justify-content: flex-end;
}

@media (max-width: 980px) {
  .page-hero {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .panel-header,
  .panel-header--split {
    flex-direction: column;
  }

  .public-link-box {
    justify-items: start;
  }

  .public-link-box strong {
    text-align: left;
  }
}

@media (max-width: 760px) {
  .profile-photo-row {
    grid-template-columns: 1fr;
  }

  .form-grid--two,
  .form-grid--three {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page-shell {
    padding: 16px;
  }

  .panel-card {
    padding: 18px;
  }

  .actions,
  .hero-actions {
    width: 100%;
  }

  .button {
    width: 100%;
  }
}
</style>
