import { c as createComponent } from './astro-component_U2njdhp4.mjs';
import 'piccolore';
import { r as renderComponent, p as renderTemplate, m as maybeRenderHead } from './server_CAbh2y2-.mjs';
import { $ as $$Layout } from './Layout_CuG65vGk.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Profesional no encontrado", "data-astro-cid-zetdm5md": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="not-found-card" data-astro-cid-zetdm5md> <p class="eyebrow" data-astro-cid-zetdm5md>Error 404</p> <h1 data-astro-cid-zetdm5md>Profesional no encontrado</h1> <p data-astro-cid-zetdm5md>
La pagina que buscabas no existe o el perfil publico ya no esta disponible.
</p> <a href="/" data-astro-cid-zetdm5md>Volver al inicio</a> </section> ` })}`;
}, "C:/Users/Gabriel/Desktop/SistemaDeTurnosOnline/sitio-publico/src/pages/404.astro", void 0);

const $$file = "C:/Users/Gabriel/Desktop/SistemaDeTurnosOnline/sitio-publico/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
