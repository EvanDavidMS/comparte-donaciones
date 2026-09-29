import { api } from '../api.js';
import {
  h, clear, icon, num, plural, qty, date, pageHead, metrics, kv, notice, empty, table, tabs, chips, field, formData,
  showFieldErrors, withBusy, toast, dialog, statusBadge, categoryIcon, CATEGORY, UNITS, daysUntil,
} from '../dom.js';

const firstName = (name) => name.split(' ')[0];

function donationCell(d) {
  return h('div', { class: 'cell-main' }, categoryIcon(d.category), h('div', {}, h('strong', {}, d.title), h('small', {}, CATEGORY[d.category]?.label)));
}

function expiryCell(d) {
  if (!d.expiresAt) return h('span', { class: 'muted' }, 'No aplica');
  const days = daysUntil(d.expiresAt);
  const soon = d.status === 'disponible' && days <= 3;
  return h('span', { class: soon ? 'status warn' : '' }, date(d.expiresAt));
}

function followUpCell(d) {
  if (d.assignedTo) return h('span', {}, d.assignedTo.name);
  if (d.status === 'disponible') {
    return h('span', { class: d.pendingRequests ? '' : 'muted' }, d.pendingRequests ? `${d.pendingRequests} solicitud(es) en revisión` : 'Sin solicitudes aún');
  }
  return h('span', { class: 'muted' }, '—');
}

async function cancelFlow(d, done) {
  const ok = await dialog({
    title: 'Cancelar donación',
    body: `¿Seguro que quieres cancelar "${d.title}"? Las solicitudes pendientes se rechazarán automáticamente.`,
    confirmLabel: 'Sí, cancelar',
    cancelLabel: 'Volver',
    danger: true,
  });
  if (!ok) return;
  try {
    await api.cancelDonation(d.id);
    toast('Donación cancelada');
    done();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function donationColumns(done) {
  return [
    { label: 'Donación', primary: true, render: donationCell },
    { label: 'Cantidad', className: 'num', render: (d) => qty(d.quantity, d.unit) },
    { label: 'Caducidad', render: expiryCell },
    { label: 'Estado', render: (d) => statusBadge(d.status) },
    { label: 'Seguimiento', render: followUpCell },
    {
      label: 'Acción',
      className: 'actions',
      render: (d) =>
        d.status === 'disponible'
          ? h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => cancelFlow(d, done) }, 'Cancelar')
          : h('span', { class: 'muted' }, '—'),
    },
  ];
}

// ---------- Panel ----------
export async function dashboard({ user, go }) {
  const root = h('div');
  async function draw() {
    const [{ stats }, { donations }] = await Promise.all([api.stats(), api.donations()]);
    const s = stats.donations;
    clear(
      root,
      pageHead(`Hola, ${firstName(user.name)}`, 'Resumen del impacto de tus donaciones', {
        icon: 'heart',
        value: plural(s.entregada, 'entrega', 'entregas'),
        label: 'Donaciones completadas',
      }),
      stats.pendingRequests
        ? notice('Tus donaciones tienen interesados', `${stats.pendingRequests} solicitud(es) de organizaciones están en revisión por el equipo administrador.`)
        : null,
      h(
        'div',
        { class: 'grid-2' },
        h(
          'section',
          { class: 'card' },
          h('h2', {}, 'Tu actividad'),
          h('p', { class: 'card-sub' }, user.organization || 'Donador particular'),
          kv([
            ['Donaciones publicadas', num(stats.total)],
            ['Disponibles', num(s.disponible)],
            ['Reservadas (por entregar)', num(s.reservada)],
            ['Entregadas', num(s.entregada)],
            ['Canceladas o vencidas', num(s.cancelada + s.vencida)],
          ]),
          h(
            'div',
            { class: 'card-actions' },
            h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: () => go('donar') }, icon('plus'), 'Publicar donación'),
            h('button', { type: 'button', class: 'btn btn-outline btn-block', onclick: () => go('mis-donaciones') }, 'Ver mis donaciones'),
          ),
        ),
        metrics([
          { label: 'Donaciones disponibles', value: num(s.disponible), icon: 'package' },
          { label: 'Kilos entregados', value: num(stats.delivered.kg), unit: 'kg', icon: 'arrowUpRight' },
          { label: 'Organizaciones apoyadas', value: num(stats.organizationsHelped), icon: 'trending' },
        ]),
      ),
      h(
        'section',
        { class: 'section' },
        h('div', { class: 'section-head' }, h('h2', { class: 'section-title' }, 'Donaciones recientes'), h('a', { class: 'link', href: '#/mis-donaciones' }, 'Ver todas', icon('arrowRight'))),
        table(donationColumns(draw), donations.slice(0, 5), empty('Aún no has publicado donaciones', 'Publica tu primera donación y ayuda a una organización cercana.', 'gift')),
      ),
    );
  }
  await draw();
  return root;
}

// ---------- Publicar donación ----------
export async function donate({ go }) {
  const { stats } = await api.stats();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const form = h(
    'form',
    { class: 'form', novalidate: true },
    field({ label: 'Título', name: 'title', required: true, attrs: { maxlength: 80, placeholder: 'Ej. Arroz en costales de 5 kg' } }),
    h(
      'div',
      { class: 'form-row' },
      field({ label: 'Categoría', name: 'category', value: 'alimentos', options: Object.entries(CATEGORY).map(([k, v]) => [k, v.label]) }),
      field({ label: 'Ubicación de recolección', name: 'location', required: true, attrs: { maxlength: 80, placeholder: 'Ciudad, estado' } }),
    ),
    h(
      'div',
      { class: 'form-row' },
      field({ label: 'Cantidad', name: 'quantity', type: 'number', required: true, attrs: { min: 1, max: 100000, step: 1, inputmode: 'numeric', placeholder: '0' } }),
      field({ label: 'Unidad', name: 'unit', value: 'kg', options: Object.entries(UNITS).map(([k]) => [k, k]) }),
    ),
    field({ label: 'Fecha de caducidad', name: 'expiresAt', type: 'date', hint: 'Obligatoria para alimentos', attrs: { min: tomorrow } }),
    field({ label: 'Descripción (opcional)', name: 'description', type: 'textarea', attrs: { maxlength: 500, placeholder: 'Estado del producto, horario de recolección, presentación…' } }),
  );
  const hint = form.querySelector('[data-field="expiresAt"] .hint');
  form.category.addEventListener('change', () => {
    hint.textContent = form.category.value === 'alimentos' ? 'Obligatoria para alimentos' : 'Opcional para esta categoría';
  });

  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Publicar donación');
  form.append(submit);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formData(form);
    const payload = {
      title: data.title,
      category: data.category,
      quantity: data.quantity === '' ? undefined : Number(data.quantity),
      unit: data.unit,
      location: data.location,
    };
    if (data.expiresAt) payload.expiresAt = data.expiresAt;
    if (data.description.trim()) payload.description = data.description;
    await withBusy(submit, async () => {
      try {
        await api.createDonation(payload);
        toast('Donación publicada. Las organizaciones ya pueden verla.');
        go('mis-donaciones');
      } catch (err) {
        showFieldErrors(form, err);
      }
    });
  });

  return h(
    'div',
    {},
    pageHead('Publicar donación', 'Comparte excedentes en buen estado con organizaciones verificadas', {
      icon: 'gift',
      value: `${num(stats.total)}`,
      label: 'Donaciones publicadas',
    }),
    h(
      'div',
      { class: 'grid-2' },
      h(
        'section',
        { class: 'card' },
        tabs(
          [
            ['nueva', 'Nueva donación'],
            ['mis', 'Mis donaciones'],
          ],
          'nueva',
          (v) => v === 'mis' && go('mis-donaciones'),
        ),
        form,
      ),
      h(
        'section',
        { class: 'metrics steps', 'aria-label': 'Cómo funciona' },
        step(1, 'Publicas la donación', 'Indica qué es, cuánto hay y dónde se recoge. Queda visible al instante.'),
        step(2, 'Las organizaciones la solicitan', 'Organizaciones sociales verificadas explican para qué la necesitan.'),
        step(3, 'Se aprueba y se entrega', 'El equipo administrador asigna la donación y la organización confirma la recepción.'),
      ),
    ),
    notice('Importante', 'Dona solo productos en buen estado. Los alimentos que llegan a su fecha de caducidad sin ser asignados se marcan como vencidos automáticamente.'),
  );
}

function step(n, title, text) {
  return h('div', { class: 'step' }, h('span', { class: 'n' }, String(n)), h('div', {}, h('strong', {}, title), h('p', {}, text)));
}

// ---------- Mis donaciones ----------
export async function myDonations({ go }) {
  const root = h('div');
  let filter = '';
  async function draw() {
    const [{ donations }, { stats }] = await Promise.all([api.donations(filter ? { status: filter } : {}), api.stats()]);
    clear(
      root,
      pageHead('Mis donaciones', 'Da seguimiento al estado de cada donación', {
        icon: 'package',
        value: plural(stats.donations.disponible, 'disponible', 'disponibles'),
        label: `${num(stats.total)} en total`,
      }),
      h(
        'div',
        { class: 'section-head' },
        chips(
          [
            ['', 'Todas'],
            ['disponible', 'Disponibles'],
            ['reservada', 'Reservadas'],
            ['entregada', 'Entregadas'],
            ['cancelada', 'Canceladas'],
            ['vencida', 'Vencidas'],
          ],
          filter,
          (v) => {
            filter = v;
            draw();
          },
        ),
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => go('donar') }, icon('plus'), 'Nueva donación'),
      ),
      h('div', { class: 'section' }, table(donationColumns(draw), donations, empty('No hay donaciones en esta vista', 'Cambia el filtro o publica una nueva donación.', 'package'))),
      notice('¿Cómo avanza una donación?', 'Disponible → Reservada (un administrador aprobó a una organización) → Entregada (la organización confirmó que la recibió).'),
    );
  }
  await draw();
  return root;
}
