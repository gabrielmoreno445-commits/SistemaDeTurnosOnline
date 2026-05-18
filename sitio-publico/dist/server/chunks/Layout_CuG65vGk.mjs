import { c as createComponent } from './astro-component_U2njdhp4.mjs';
import 'piccolore';
import { p as renderTemplate, n as renderSlot, l as renderHead } from './server_CAbh2y2-.mjs';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title = "Sistema de Turnos Online" } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="es" data-astro-cid-sckkx6r4> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><title>', "</title><script>\n      const tema = localStorage.getItem('tema') || 'light';\n      document.documentElement.setAttribute('data-theme', tema);\n    <\/script>", '</head> <body data-astro-cid-sckkx6r4> <header class="site-header" data-astro-cid-sckkx6r4> <div class="shell" data-astro-cid-sckkx6r4> <a href="/" class="brand" data-astro-cid-sckkx6r4>Sistema de Turnos Online</a> <button id="theme-toggle" class="theme-toggle btn" type="button" data-astro-cid-sckkx6r4>🌙</button> </div> </header> <main class="site-main" data-astro-cid-sckkx6r4> <div class="shell" data-astro-cid-sckkx6r4> ', ` </div> </main> <footer class="site-footer" data-astro-cid-sckkx6r4> <div class="shell" data-astro-cid-sckkx6r4> <p data-astro-cid-sckkx6r4>Reservas simples para profesionales independientes.</p> </div> </footer> <script>
      const actualizarTextoTema = (btn, temaActual) => {
        btn.textContent = temaActual === 'dark' ? '☀️' : '🌙';
      };

      document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('theme-toggle');

        if (!btn) {
          return;
        }

        actualizarTextoTema(btn, document.documentElement.getAttribute('data-theme') || 'light');

        btn.addEventListener('click', () => {
          const actual = document.documentElement.getAttribute('data-theme');
          const nuevo = actual === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', nuevo);
          localStorage.setItem('tema', nuevo);
          actualizarTextoTema(btn, nuevo);
        });
      });
    <\/script> </body> </html>`])), title, renderHead(), renderSlot($$result, $$slots["default"]));
}, "C:/Users/Gabriel/Desktop/SistemaDeTurnosOnline/sitio-publico/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
