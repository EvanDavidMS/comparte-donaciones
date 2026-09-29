import { api } from '../api.js';
import {
  h, clear, icon, num, qty, date, pageHead, metrics, kv, notice, empty, table, chips, toast, dialog, statusBadge,
  categoryIcon, CATEGORY, daysUntil,
} from '../dom.js';

const pendingNotice = () =>
  notice(
    'Tu organización está en revisión',
    'Un administrador debe verificar tu cuenta antes de que puedas solicitar donaciones. Mientras tanto puedes explorar el catálogo.',
    'warn',
  );

function donationCell(d) {
  return h('div', { class: 'cell-main' }, categoryIcon(d.category), h('div', {}, h('strong', {}, d.title), h('small', {}, d.donor.name)));
}

async function confirmFlow(r, done) {
  const ok = await dialog({
    title: 'Confirmar recepción',
    body: `Confirma que tu organización recibió "${r.donation.title}" (${qty(r.donation.quantity, r.donation.unit)}).`,
    confirmLabel: 'Sí, la recibimos',
  });
  if (!ok) return;
  try {
    await api.confirmRequest(r.id);
    toast('¡Gracias! La entrega quedó registrada.');
    done();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function cancelFlow(r, done) {
  const ok = await dialog({ title: 'Cancelar solicitud', body: `¿Cancelar tu solicitud de "${r.donation.title}"?`, confirmLabel: 'Sí, cancelar', cancelLabel: 'Volver', danger: true });
  if (!ok) return;
  try {
    await api.cancelRequest(r.id);
    toast('Solicitud cancelada');
    done();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function requestColumns(done) {
  return [
    {
      label: 'Donación',
      primary: true,
      render: (r) => h('div', { class: 'cell-main' }, categoryIcon(r.donation.category), h('div', {}, h('strong', {}, r.donation.title), h('small', {}, r.donation.donor.name))),
    },
    { label: 'Cantidad', className: 'num', render: (r) => qty(r.donation.quantity, r.donation.unit) },
    { label: 'Recolección', render: (r) => r.donation.location },
    { label: 'Solicitada', render: (r) => date(r.createdAt) },
    {
      label: 'Estado',
      render: (r) => h('div', {}, statusBadge(r.status), r.reason ? h('small', { class: 'muted' }, h('br'), r.reason) : null),
    },
    {
      label: 'Acción',
      className: 'actions',
      render: (r) => {
        if (r.status === 'aprobada') return h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => confirmFlow(r, done) }, 'Confirmar recepción');
        if (r.status === 'pendiente') return h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => cancelFlow(r, done) }, 'Cancelar');
        return h('span', { class: 'muted' }, '—');
      },
    },
  ];
}

// ---------- Panel ----------
export async function dashboard({ user, go }) {
  const root = h('div');
  async function draw() {
    const [{ stats }, { requests }] = await Promise.all([api.stats(), api.requests()]);
    const r = stats.requests;
    const toPickUp = requests.filter((x) => x.status === 'aprobada');
    clear(
      root,
      stats.accountStatus === 'pendiente' ? pendingNotice() : null,
      pageHead(`Hola, ${user.organization || user.name}`, 'Resumen de las donaciones de tu organización', {
        icon: 'truck',
        value: `${num(stats.received.kg)} kg`,
        label: 'Alimentos recibidos',
      }),
      h(
        'div',
        { class: 'grid-2' },
        h(
          'section',
          { class: 'card', 'data-tour': 'activity' },
          h('h2', {}, 'Tus solicitudes'),
          h('p', { class: 'card-sub' }, `Responsable: ${user.name}`),
          kv([
            ['En revisión', num(r.pendiente)],
            ['Aprobadas (por recoger)', num(r.aprobada)],
            ['Recibidas', num(r.entregada)],
            ['Rechazadas o canceladas', num(r.rechazada + r.cancelada)],
          ]),
          h(
            'div',
            { class: 'card-actions' },
            h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: () => go('disponibles') }, icon('search'), 'Explorar donaciones'),
            h('button', { type: 'button', class: 'btn btn-outline btn-block', onclick: () => go('mis-solicitudes') }, 'Ver mis solicitudes'),
          ),
        ),
        metrics([
          { label: 'Donaciones disponibles ahora', value: num(stats.availableDonations), icon: 'package' },
          { label: 'Donaciones recibidas', value: num(stats.receivedCount), icon: 'arrowUpRight' },
          { label: 'Solicitudes en revisión', value: num(r.pendiente), icon: 'trending' },
        ]),
      ),
      h(
        'section',
        { class: 'section', 'data-tour': 'table' },
        h('div', { class: 'section-head' }, h('h2', { class: 'section-title' }, 'Por recoger'), h('a', { class: 'link', href: '#/mis-solicitudes' }, 'Ver todas', icon('arrowRight'))),
        table(requestColumns(draw), toPickUp, empty('Nada pendiente de recoger', 'Cuando un administrador apruebe una solicitud aparecerá aquí.', 'truck')),
      ),
    );
  }
  await draw();
  return root;
}

// ---------- Catálogo de donaciones disponibles ----------
export async function available({ user }) {
  const root = h('div');
  const filters = { q: '', category: '' };
  const pending = user.status !== 'activo';
  let timer;

  const search = h('input', { class: 'input', type: 'search', placeholder: 'Buscar por nombre, descripción o ciudad…', 'aria-label': 'Buscar', maxlength: 60 });
  const category = h(
    'select',
    { class: 'select', 'aria-label': 'Categoría' },
    h('option', { value: '' }, 'Todas las categorías'),
    Object.entries(CATEGORY).map(([k, v]) => h('option', { value: k }, v.label)),
  );
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      filters.q = search.value.trim();
      drawTable();
    }, 300);
  });
  category.addEventListener('change', () => {
    filters.category = category.value;
    drawTable();
  });

  const tableBox = h('div', { class: 'section', 'data-tour': 'table' });
  const head = h('div');

  async function requestFlow(d) {
    const values = await dialog({
      title: 'Solicitar donación',
      body: `${d.title} · ${qty(d.quantity, d.unit)} · ${d.location}`,
      fields: [{ label: 'Mensaje para el equipo (opcional)', name: 'message', type: 'textarea', attrs: { maxlength: 300, placeholder: '¿A cuántas personas beneficiará? ¿Cuándo pueden recoger?' } }],
      confirmLabel: 'Enviar solicitud',
    });
    if (!values) return;
    try {
      await api.createRequest(d.id, values.message.trim() || undefined);
      toast('Solicitud enviada. Te avisaremos cuando sea revisada.');
      drawTable();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function drawTable() {
    const { donations } = await api.donations(filters);
    clear(
      head,
      pageHead('Donaciones disponibles', 'Solicita lo que tu organización necesita', { icon: 'package', value: `${num(donations.length)}`, label: filters.q || filters.category ? 'Resultados' : 'Disponibles ahora' }),
    );
    clear(
      tableBox,
      table(
        [
          { label: 'Donación', primary: true, render: donationCell },
          { label: 'Cantidad', className: 'num', render: (d) => qty(d.quantity, d.unit) },
          { label: 'Recolección', render: (d) => d.location },
          {
            label: 'Caduca',
            render: (d) => {
              if (!d.expiresAt) return h('span', { class: 'muted' }, 'No aplica');
              const days = daysUntil(d.expiresAt);
              return h('span', { class: days <= 3 ? 'status warn' : '' }, days <= 3 ? `En ${days} día(s)` : date(d.expiresAt));
            },
          },
          { label: 'Detalle', render: (d) => h('span', { class: 'clamp muted' }, d.description || '—') },
          {
            label: 'Acción',
            className: 'actions',
            render: (d) =>
              d.myRequestStatus
                ? statusBadge(d.myRequestStatus)
                : h('button', { type: 'button', class: 'btn btn-outline btn-sm', disabled: pending, title: pending ? 'Tu cuenta aún no está verificada' : null, onclick: () => requestFlow(d) }, 'Solicitar'),
          },
        ],
        donations,
        empty('No encontramos donaciones', 'Prueba con otra búsqueda o categoría. Se publican nuevas donaciones constantemente.', 'search'),
      ),
    );
  }

  await drawTable();
  clear(
    root,
    pending ? pendingNotice() : null,
    head,
    h('div', { class: 'filters', 'data-tour': 'filters' }, search, category),
    tableBox,
    notice('Importante', 'Las solicitudes son revisadas por el equipo administrador. Si se aprueba, coordina la recolección y confirma la recepción en "Mis solicitudes".'),
  );
  return root;
}

// ---------- Mis solicitudes ----------
export async function myRequests() {
  const root = h('div');
  let filter = '';
  async function draw() {
    const { requests } = await api.requests(filter ? { status: filter } : {});
    clear(
      root,
      pageHead('Mis solicitudes', 'Revisa el estado de lo que has solicitado', {
        icon: 'clipboard',
        value: `${num(requests.length)}`,
        label: filter ? 'En este filtro' : 'Solicitudes totales',
      }),
      h(
        'div',
        { class: 'section-head', 'data-tour': 'filters' },
        chips(
          [
            ['', 'Todas'],
            ['pendiente', 'En revisión'],
            ['aprobada', 'Aprobadas'],
            ['entregada', 'Recibidas'],
            ['rechazada', 'Rechazadas'],
            ['cancelada', 'Canceladas'],
          ],
          filter,
          (v) => {
            filter = v;
            draw();
          },
        ),
      ),
      h('div', { class: 'section', 'data-tour': 'table' }, table(requestColumns(draw), requests, empty('Sin solicitudes', 'Explora el catálogo de donaciones disponibles para hacer tu primera solicitud.', 'clipboard'))),
    );
  }
  await draw();
  return root;
}
