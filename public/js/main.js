import { api, setUnauthorizedHandler } from './api.js';
import { h, clear, icon, initials, num, toast, ROLE_LABEL, empty } from './dom.js';
import { authView } from './views/auth.js';
import * as donor from './views/donor.js';
import * as beneficiary from './views/beneficiary.js';
import * as admin from './views/admin.js';

const app = document.getElementById('app');
const state = { user: null, shell: null };

// Menú por rol: cada rol solo ve (y solo puede usar) sus propias secciones.
const ROUTES = {
  donador: [
    { path: 'panel', label: 'Panel', icon: 'home', view: donor.dashboard },
    { path: 'donar', label: 'Donar', icon: 'gift', view: donor.donate },
    { path: 'mis-donaciones', label: 'Mis donaciones', icon: 'package', view: donor.myDonations },
  ],
  beneficiario: [
    { path: 'panel', label: 'Panel', icon: 'home', view: beneficiary.dashboard },
    { path: 'disponibles', label: 'Donaciones disponibles', icon: 'search', view: beneficiary.available },
    { path: 'mis-solicitudes', label: 'Mis solicitudes', icon: 'clipboard', view: beneficiary.myRequests },
  ],
  admin: [
    { path: 'panel', label: 'Panel', icon: 'home', view: admin.dashboard },
    { path: 'solicitudes', label: 'Solicitudes', icon: 'clipboard', view: admin.requests, badge: 'requests' },
    { path: 'donaciones', label: 'Donaciones', icon: 'package', view: admin.donations },
    { path: 'usuarios', label: 'Usuarios', icon: 'users', view: admin.users, badge: 'users' },
    { path: 'auditoria', label: 'Auditoría', icon: 'shield', view: admin.audit },
  ],
};

// ---------- Tema claro / oscuro ----------
function readTheme() {
  try {
    const saved = localStorage.getItem('comparte-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* almacenamiento no disponible */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.replaceChildren(icon(theme === 'dark' ? 'sun' : 'moon')));
}
export function themeToggle() {
  const btn = h('button', {
    type: 'button',
    class: 'icon-btn',
    'aria-label': 'Cambiar tema claro/oscuro',
    'data-theme-toggle': true,
    onclick: () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('comparte-theme', next);
      } catch {
        /* sin persistencia */
      }
      applyTheme(next);
    },
  });
  btn.appendChild(icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon'));
  return btn;
}

// ---------- Navegación ----------
const currentPath = () => location.hash.replace(/^#\/?/, '').split('?')[0];
export const go = (path) => {
  if (currentPath() === path) render();
  else location.hash = `#/${path}`;
};

async function logout() {
  try {
    await api.logout();
  } catch {
    /* la cookie se elimina igualmente */
  }
  state.user = null;
  state.shell = null;
  toast('Sesión cerrada');
  location.hash = '#/login';
  render();
}

function buildShell(user) {
  const routes = ROUTES[user.role];
  const nav = h('nav', { class: 'nav', 'aria-label': 'Principal' });
  const badges = {};
  for (const r of routes) {
    const badge = r.badge ? h('span', { class: 'count', hidden: true }) : null;
    if (badge) badges[r.badge] = badge;
    nav.appendChild(h('a', { href: `#/${r.path}`, dataset: { path: r.path } }, icon(r.icon), h('span', {}, r.label), badge));
  }
  const displayName = user.organization || user.name;
  const content = h('main', { class: 'content', id: 'content', tabindex: '-1' });
  const ticker = h('span', {}, '—');

  const shell = h(
    'div',
    { class: 'shell' },
    h(
      'aside',
      { class: 'sidebar' },
      h('a', { class: 'brand', href: '#/panel' }, h('img', { src: '/img/logo.svg', alt: '' }), h('span', {}, 'Comparte', h('small', {}, 'Red de donaciones'))),
      nav,
      h(
        'div',
        { class: 'sidebar-foot' },
        h('span', { class: 'avatar' }, initials(user.name)),
        h('div', { class: 'who' }, h('strong', {}, user.name), h('span', {}, ROLE_LABEL[user.role])),
        h('button', { type: 'button', class: 'icon-btn plain', 'aria-label': 'Cerrar sesión', title: 'Cerrar sesión', onclick: logout }, icon('logout')),
      ),
    ),
    h('div', { class: 'backdrop', onclick: () => shell.classList.remove('nav-open') }),
    h(
      'div',
      { class: 'main' },
      h(
        'header',
        { class: 'topbar' },
        h('a', { class: 'mobile-brand', href: '#/panel', 'aria-label': 'Comparte' }, h('img', { src: '/img/logo.svg', alt: '' })),
        h('div', { class: 'ticker' }, icon('clock'), ticker),
        h('div', { class: 'spacer' }),
        h('div', { class: 'pill', title: user.email }, h('span', { class: 'name' }, displayName), h('span', { class: 'role-dot' }, ROLE_LABEL[user.role])),
        themeToggle(),
        h('button', { type: 'button', class: 'icon-btn menu-btn', 'aria-label': 'Abrir menú', onclick: () => shell.classList.toggle('nav-open') }, icon('menu')),
      ),
      content,
      h(
        'footer',
        { class: 'footer' },
        h('span', {}, `© ${new Date().getFullYear()} Comparte | Todos los derechos reservados`),
        h('div', { class: 'checks' }, h('span', {}, icon('check'), 'Sesión protegida con JWT'), h('span', {}, icon('check'), 'Datos en servidor propio')),
      ),
    ),
  );
  return { el: shell, nav, content, ticker, badges, routes };
}

async function refreshChrome() {
  const { shell, user } = state;
  try {
    const { stats } = await api.publicStats();
    shell.ticker.textContent = `${num(stats.availableDonations)} donaciones disponibles · ${num(stats.deliveredDonations)} entregadas`;
    if (user.role === 'admin') {
      const { stats: s } = await api.stats();
      setBadge(shell.badges.requests, s.requests.pendiente);
      setBadge(shell.badges.users, s.users.pendientes);
    }
  } catch {
    /* la barra superior es informativa; si falla no bloquea la vista */
  }
}
function setBadge(el, count) {
  el.hidden = !count;
  el.textContent = String(count);
}

async function render() {
  if (!state.user) {
    const mode = currentPath() === 'registro' ? 'registro' : 'login';
    clear(app, await authView(mode, { onLogin, themeToggle }));
    return;
  }
  if (!state.shell) {
    state.shell = buildShell(state.user);
    clear(app, state.shell.el);
  }
  const { shell } = state;
  const route = shell.routes.find((r) => r.path === currentPath());
  if (!route) {
    location.hash = '#/panel';
    return;
  }
  shell.el.classList.remove('nav-open');
  shell.nav.querySelectorAll('a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.path === route.path));
  shell.nav.querySelector(`a[data-path="${route.path}"]`).setAttribute('aria-current', 'page');
  document.title = `${route.label} · Comparte`;

  clear(shell.content, h('div', { class: 'loading' }, 'Cargando…'));
  const ctx = { user: state.user, go, refreshChrome };
  try {
    const view = await route.view(ctx);
    clear(shell.content, view);
  } catch (err) {
    if (err.status === 401) return;
    clear(
      shell.content,
      h('div', { class: 'card' }, empty('No se pudo cargar esta sección', err.message, 'alert'), h('div', { class: 'empty' }, h('button', { class: 'btn btn-outline', onclick: render }, 'Reintentar'))),
    );
  }
  window.scrollTo(0, 0);
  refreshChrome();
}

function onLogin(user) {
  state.user = user;
  state.shell = null;
  location.hash = '#/panel';
  render();
}

setUnauthorizedHandler(() => {
  if (!state.user) return;
  state.user = null;
  state.shell = null;
  toast('Tu sesión expiró. Inicia sesión de nuevo.', 'error');
  location.hash = '#/login';
  render();
});

window.addEventListener('hashchange', render);

async function start() {
  applyTheme(readTheme());
  try {
    const { user } = await api.me();
    state.user = user;
  } catch {
    state.user = null;
  }
  render();
}

start();
