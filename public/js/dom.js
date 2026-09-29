// Utilidades de interfaz. Todo el contenido dinámico se inserta como texto
// (textContent / createTextNode): nunca se usa innerHTML con datos del usuario,
// lo que evita XSS aunque un dato malicioso llegara al servidor.

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  home: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  gift: ['M20 12v9H4v-9', 'M2 7h20v5H2z', 'M12 21V7', 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z', 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'],
  package: ['M16.5 9.4 7.55 4.24', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.27 6.96 12 12.01l8.73-5.05', 'M12 22.08V12'],
  search: ['M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', 'm21 21-4.35-4.35'],
  clipboard: ['M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M9 12h6', 'M9 16h4'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'm9 12 2 2 4-4'],
  clock: ['M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z', 'M12 6v6l4 2'],
  moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
  sun: ['M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  check: ['M20 6 9 17l-5-5'],
  info: ['M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z', 'M12 16v-4', 'M12 8h.01'],
  alert: ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  arrowUpRight: ['M7 17 17 7', 'M7 7h10v10'],
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  trending: ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  heart: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z'],
  truck: ['M10 17h4V5H2v12h3', 'M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1', 'M7.5 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M17.5 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'],
  plus: ['M12 5v14', 'M5 12h14'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  building: ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z', 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2', 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2', 'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4'],
  chart: ['M3 3v18h18', 'm19 9-5 5-4-4-3 3'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z'],
  apple: ['M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z', 'M10 2c1 .5 2 2 2 5'],
  shirt: ['M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z'],
  droplet: ['M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  sofa: ['M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3', 'M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z', 'M4 18v2', 'M20 18v2'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
};

export function icon(name, className = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ICONS[name] || ICONS.info) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

/**
 * Crea un elemento DOM de forma segura.
 * h('button', { class: 'btn', onclick: fn }, 'Texto', otroNodo)
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

// ---------- Etiquetas y formatos ----------
export const CATEGORY = {
  alimentos: { label: 'Alimentos', icon: 'apple' },
  ropa: { label: 'Ropa', icon: 'shirt' },
  higiene: { label: 'Higiene', icon: 'droplet' },
  utiles: { label: 'Útiles escolares', icon: 'book' },
  hogar: { label: 'Hogar', icon: 'sofa' },
  otros: { label: 'Otros', icon: 'package' },
};
export const UNITS = { kg: 'kg', litros: 'L', unidades: 'uds.', cajas: 'cajas', paquetes: 'paquetes' };
export const ROLE_LABEL = { admin: 'Administrador', donador: 'Donador', beneficiario: 'Beneficiario' };

const STATUS = {
  disponible: ['Disponible', 'ok'],
  reservada: ['Reservada', 'info'],
  entregada: ['Entregada', ''],
  cancelada: ['Cancelada', 'bad'],
  vencida: ['Vencida', 'bad'],
  pendiente: ['Pendiente', 'warn'],
  aprobada: ['Aprobada', 'info'],
  rechazada: ['Rechazada', 'bad'],
  activo: ['Activo', 'ok'],
  suspendido: ['Suspendido', 'bad'],
};

export const statusLabel = (s) => (STATUS[s] || [s])[0];
export const statusBadge = (s) => h('span', { class: `status ${(STATUS[s] || [])[1] || ''}` }, statusLabel(s));

export function categoryIcon(category) {
  const c = CATEGORY[category] || CATEGORY.otros;
  return h('span', { class: `cat cat-${category}`, title: c.label }, icon(c.icon));
}

const nf = new Intl.NumberFormat('es-MX');
export const num = (n) => nf.format(n || 0);
export const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;
export const qty = (n, unit) => `${num(n)} ${UNITS[unit] || unit}`;

export function date(iso) {
  if (!iso) return '—';
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function dateTime(iso) {
  return iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}
export function daysUntil(isoDate) {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T23:59:59`);
  return Math.ceil((target - Date.now()) / 86400000);
}
export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

// ---------- Componentes ----------
export function pageHead(title, subtitle, highlight) {
  return h(
    'header',
    { class: 'page-head' },
    h('div', {}, h('h1', {}, title), h('p', { class: 'subtitle' }, icon('clock'), subtitle)),
    highlight
      ? h('div', { class: 'highlight' }, icon(highlight.icon || 'heart'), h('strong', {}, highlight.value), h('span', {}, highlight.label))
      : null,
  );
}

export function metrics(items) {
  return h(
    'section',
    { class: 'metrics', 'aria-label': 'Métricas' },
    items.map((m, i) =>
      h(
        'div',
        { class: 'metric' },
        h('div', {}, h('div', { class: 'label' }, m.label), h('div', { class: 'value' }, m.value, m.unit ? h('small', {}, m.unit) : null)),
        h('span', { class: `badge-icon ${i === 1 ? 'solid' : ''}` }, icon(m.icon || 'trending')),
      ),
    ),
  );
}

export function kv(rows) {
  return h(
    'dl',
    { class: 'kv' },
    rows.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v))),
  );
}

export function notice(title, text, variant = '') {
  return h('div', { class: `notice ${variant}` }, icon(variant === 'warn' ? 'alert' : 'info'), h('div', {}, h('strong', {}, title), h('p', {}, text)));
}

export function empty(title, text, iconName = 'inbox') {
  return h('div', { class: 'empty' }, icon(iconName), h('strong', {}, title), h('span', {}, text));
}

/**
 * Tabla responsive: en móvil cada fila se convierte en tarjeta usando data-label.
 * columns: [{ label, render(row), className, primary }]
 */
export function table(columns, rows, emptyState) {
  if (!rows.length) return h('div', { class: 'table-wrap' }, emptyState);
  return h(
    'div',
    { class: 'table-wrap' },
    h(
      'table',
      { class: 'table' },
      h('thead', {}, h('tr', {}, columns.map((c) => h('th', { class: c.className || null, scope: 'col' }, c.label)))),
      h(
        'tbody',
        {},
        rows.map((row) =>
          h(
            'tr',
            {},
            columns.map((c) =>
              h('td', { class: [c.className, c.primary ? 'primary' : ''].filter(Boolean).join(' ') || null, 'data-label': c.label }, c.render(row)),
            ),
          ),
        ),
      ),
    ),
  );
}

export function tabs(options, current, onChange) {
  return h(
    'div',
    { class: 'tabs', role: 'tablist' },
    options.map(([value, label]) =>
      h('button', { type: 'button', role: 'tab', 'aria-selected': String(value === current), onclick: () => onChange(value) }, label),
    ),
  );
}

export function chips(options, current, onChange) {
  return h(
    'div',
    { class: 'chips', role: 'group' },
    options.map(([value, label]) =>
      h('button', { type: 'button', class: 'chip', 'aria-pressed': String(value === current), onclick: () => onChange(value) }, label),
    ),
  );
}

// ---------- Formularios ----------
export function field({ label, name, type = 'text', value = '', hint, options, required, attrs = {} }) {
  const id = `f-${name}`;
  let control;
  if (options) {
    control = h(
      'select',
      { class: 'select', id, name, required, ...attrs },
      options.map(([v, l]) => h('option', { value: v, selected: v === value }, l)),
    );
  } else if (type === 'textarea') {
    control = h('textarea', { class: 'textarea', id, name, required, ...attrs }, value);
  } else {
    control = h('input', { class: 'input', id, name, type, value, required, ...attrs });
  }
  return h(
    'div',
    { class: 'field', dataset: { field: name } },
    h('label', { for: id }, label),
    control,
    hint ? h('span', { class: 'hint' }, hint) : null,
    h('span', { class: 'error', id: `${id}-error` }),
  );
}

export function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

/** Muestra los errores de validación del servidor junto a cada campo. */
export function showFieldErrors(form, err) {
  form.querySelectorAll('.error').forEach((e) => (e.textContent = ''));
  form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  let placed = false;
  for (const d of err.details || []) {
    const wrap = form.querySelector(`[data-field="${CSS.escape(d.field)}"]`);
    if (!wrap) continue;
    wrap.querySelector('.error').textContent = d.message;
    wrap.querySelector('input, select, textarea')?.setAttribute('aria-invalid', 'true');
    placed = true;
  }
  if (!placed) toast(err.message, 'error');
}

export async function withBusy(button, fn) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Procesando…';
  try {
    return await fn();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

// ---------- Toasts y diálogos ----------
export function toast(message, type = 'ok') {
  const box = document.getElementById('toasts');
  const el = h('div', { class: `toast ${type}` }, icon(type === 'error' ? 'alert' : 'check'), h('span', {}, message));
  box.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/**
 * Diálogo modal accesible (<dialog>). Si se pasan campos, devuelve sus valores;
 * si se cancela, devuelve null.
 */
export function dialog({ title, body, content = null, fields = [], confirmLabel = 'Confirmar', danger = false, cancelLabel = 'Cancelar' }) {
  return new Promise((resolve) => {
    const form = h('form', { method: 'dialog', novalidate: true });
    const dlg = h('dialog', { class: 'modal', 'aria-label': title }, form);
    const confirmBtn = h('button', { type: 'submit', class: `btn ${danger ? 'btn-danger' : 'btn-primary'}` }, confirmLabel);
    form.append(
      h('div', { class: 'modal-head' }, h('h2', {}, title), h('button', { type: 'button', class: 'icon-btn plain', 'aria-label': 'Cerrar', onclick: () => dlg.close() }, icon('x'))),
      h('div', { class: 'modal-body' }, body ? h('p', { class: 'muted' }, body) : null, content, fields.map(field)),
      h(
        'div',
        { class: 'modal-foot' },
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => dlg.close() }, cancelLabel),
        confirmLabel ? confirmBtn : null,
      ),
    );
    let result = null;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = [...form.querySelectorAll('[required]')].find((el) => !el.value.trim());
      if (invalid) {
        invalid.setAttribute('aria-invalid', 'true');
        invalid.closest('.field').querySelector('.error').textContent = 'Este campo es obligatorio';
        invalid.focus();
        return;
      }
      result = formData(form);
      dlg.close();
    });
    dlg.addEventListener('close', () => {
      dlg.remove();
      resolve(result);
    });
    document.body.appendChild(dlg);
    dlg.showModal();
  });
}
