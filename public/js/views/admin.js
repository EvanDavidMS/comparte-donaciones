import { api } from '../api.js';
import {
  h, clear, num, plural, qty, date, dateTime, pageHead, metrics, kv, notice, empty, table, chips, toast, dialog,
  statusBadge, categoryIcon, CATEGORY, ROLE_LABEL, initials,
} from '../dom.js';

async function run(action, message, done) {
  try {
    await action();
    toast(message);
    done();
  } catch (err) {
    toast(err.message, 'error');
  }
}

const reasonField = (placeholder) => [{ label: 'Motivo', name: 'reason', type: 'textarea', required: true, attrs: { maxlength: 200, minlength: 3, placeholder } }];

// ---------- Panel ----------
export async function dashboard({ go }) {
  const { stats } = await api.stats();
  const max = Math.max(1, ...Object.values(stats.byCategory));
  const deliveredCount = stats.donations.entregada;

  return h(
    'div',
    {},
    pageHead('Panel de administración', 'Visión general de la red de donaciones', {
      icon: 'clipboard',
      value: plural(stats.requests.pendiente, 'solicitud', 'solicitudes'),
      label: 'Por revisar',
    }),
    stats.users.pendientes
      ? notice('Organizaciones por verificar', `${stats.users.pendientes} organización(es) esperan verificación para poder solicitar donaciones.`, 'warn')
      : null,
    h(
      'div',
      { class: 'grid-2' },
      h(
        'section',
        { class: 'card', 'data-tour': 'activity' },
        h('h2', {}, 'Usuarios'),
        h('p', { class: 'card-sub' }, `${num(stats.users.total)} cuentas registradas`),
        kv([
          ['Donadores', num(stats.users.donadores)],
          ['Organizaciones beneficiarias', num(stats.users.beneficiarios)],
          ['Por verificar', num(stats.users.pendientes)],
          ['Suspendidas', num(stats.users.suspendidos)],
        ]),
        h(
            'div',
            { class: 'card-actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: () => go('solicitudes') }, 'Revisar solicitudes'),
          h('button', { type: 'button', class: 'btn btn-outline btn-block', onclick: () => go('usuarios') }, 'Gestionar usuarios'),
        ),
      ),
      metrics([
        { label: 'Donaciones disponibles', value: num(stats.donations.disponible), icon: 'package' },
        { label: 'Kilos de alimento entregados', value: num(stats.delivered.kg), unit: 'kg', icon: 'arrowUpRight' },
        { label: 'Entregas completadas', value: num(deliveredCount), icon: 'trending' },
      ]),
    ),
    h(
      'div',
      { class: 'grid-2', 'data-tour': 'charts' },
      h(
        'section',
        { class: 'card' },
        h('h2', {}, 'Donaciones por categoría'),
        h('p', { class: 'card-sub' }, 'Total histórico publicado'),
        h(
          'div',
          { class: 'bars' },
          Object.entries(stats.byCategory).map(([k, v]) => {
            const fill = h('span', { class: 'bar-fill' });
            fill.style.width = `${(v / max) * 100}%`;
            return h('div', { class: 'bar-row' }, h('span', {}, CATEGORY[k]?.label || k), h('span', { class: 'bar-track' }, fill), h('strong', { class: 'num' }, num(v)));
          }),
        ),
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', {}, 'Principales donantes'),
        h('p', { class: 'card-sub' }, 'Por entregas completadas'),
        stats.topDonors.length
          ? kv(stats.topDonors.map((d) => [d.name, `${num(d.delivered)} entregadas · ${num(d.total)} publicadas`]))
          : empty('Sin donantes aún', 'Aparecerán cuando se publiquen donaciones.', 'users'),
      ),
    ),
  );
}

// ---------- Solicitudes ----------
export async function requests({ refreshChrome }) {
  const root = h('div');
  let filter = 'pendiente';

  async function draw() {
    const { requests: list } = await api.requests(filter ? { status: filter } : {});
    const done = () => {
      draw();
      refreshChrome();
    };
    clear(
      root,
      pageHead('Solicitudes', 'Aprueba o rechaza las solicitudes de las organizaciones', {
        icon: 'clipboard',
        value: `${num(list.length)}`,
        label: filter ? 'En este filtro' : 'Totales',
      }),
      h(
        'div',
        { class: 'section-head', 'data-tour': 'filters' },
        chips(
          [
            ['pendiente', 'Por revisar'],
            ['aprobada', 'Aprobadas'],
            ['entregada', 'Entregadas'],
            ['rechazada', 'Rechazadas'],
            ['', 'Todas'],
          ],
          filter,
          (v) => {
            filter = v;
            draw();
          },
        ),
      ),
      h(
        'div',
        { class: 'section', 'data-tour': 'table' },
        table(
          [
            {
              label: 'Organización',
              primary: true,
              render: (r) =>
                h(
                  'div',
                  { class: 'cell-main' },
                  h('span', { class: 'avatar' }, initials(r.beneficiary.name)),
                  h('div', {}, h('strong', {}, r.beneficiary.name), h('small', {}, r.beneficiary.email)),
                ),
            },
            {
              label: 'Donación',
              render: (r) => h('div', { class: 'cell-main' }, categoryIcon(r.donation.category), h('div', {}, h('strong', {}, r.donation.title), h('small', {}, `${qty(r.donation.quantity, r.donation.unit)} · ${r.donation.donor.name}`))),
            },
            { label: 'Mensaje', render: (r) => h('span', { class: 'clamp muted' }, r.message || r.reason || '—') },
            { label: 'Fecha', render: (r) => date(r.createdAt) },
            { label: 'Estado', render: (r) => statusBadge(r.status) },
            {
              label: 'Acciones',
              className: 'actions',
              render: (r) => {
                if (r.status === 'pendiente') {
                  return [
                    h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => approve(r, done) }, 'Aprobar'),
                    h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => reject(r, done) }, 'Rechazar'),
                  ];
                }
                if (r.status === 'aprobada') {
                  return [
                    h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => deliver(r, done) }, 'Marcar entregada'),
                    h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => revoke(r, done) }, 'Revocar'),
                  ];
                }
                return h('span', { class: 'muted' }, '—');
              },
            },
          ],
          list,
          empty('No hay solicitudes aquí', filter === 'pendiente' ? '¡Todo al día! No hay solicitudes por revisar.' : 'Cambia el filtro para ver otras solicitudes.', 'check'),
        ),
      ),
      notice('Importante', 'Al aprobar una solicitud, la donación queda reservada para esa organización y las demás solicitudes de la misma donación se rechazan automáticamente.'),
    );
  }
  await draw();
  return root;
}

async function approve(r, done) {
  const ok = await dialog({
    title: 'Aprobar solicitud',
    body: `"${r.donation.title}" se reservará para ${r.beneficiary.name}. Las demás solicitudes de esta donación se rechazarán.`,
    confirmLabel: 'Aprobar',
  });
  if (ok) run(() => api.approveRequest(r.id), 'Solicitud aprobada', done);
}
async function reject(r, done) {
  const values = await dialog({ title: 'Rechazar solicitud', body: `Solicitud de ${r.beneficiary.name} para "${r.donation.title}".`, fields: reasonField('Explica brevemente el motivo'), confirmLabel: 'Rechazar', danger: true });
  if (values) run(() => api.rejectRequest(r.id, values.reason), 'Solicitud rechazada', done);
}
async function revoke(r, done) {
  const values = await dialog({
    title: 'Revocar asignación',
    body: 'La donación volverá a estar disponible para otras organizaciones.',
    fields: reasonField('Ej. La organización no recogió a tiempo'),
    confirmLabel: 'Revocar',
    danger: true,
  });
  if (values) run(() => api.revokeRequest(r.id, values.reason), 'Asignación revocada', done);
}
async function deliver(r, done) {
  const ok = await dialog({ title: 'Marcar como entregada', body: `Confirma que ${r.beneficiary.name} recibió "${r.donation.title}".`, confirmLabel: 'Confirmar entrega' });
  if (ok) run(() => api.confirmRequest(r.id), 'Entrega registrada', done);
}

// ---------- Donaciones ----------
function assignedCell(d) {
  if (d.assignedTo) return d.assignedTo.name;
  const text = d.pendingRequests ? `${d.pendingRequests} solicitud(es)` : '—';
  return h('span', { class: 'muted' }, text);
}

export async function donations() {
  const root = h('div');
  let filter = '';
  async function draw() {
    const { donations: list } = await api.donations(filter ? { status: filter } : {});
    clear(
      root,
      pageHead('Donaciones', 'Todas las donaciones publicadas en la red', { icon: 'package', value: `${num(list.length)}`, label: filter ? 'En este filtro' : 'Totales' }),
      h(
        'div',
        { class: 'section-head', 'data-tour': 'filters' },
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
      ),
      h(
        'div',
        { class: 'section', 'data-tour': 'table' },
        table(
          [
            { label: 'Donación', primary: true, render: (d) => h('div', { class: 'cell-main' }, categoryIcon(d.category), h('div', {}, h('strong', {}, d.title), h('small', {}, d.location))) },
            { label: 'Donante', render: (d) => h('div', { class: 'cell-main' }, h('div', {}, h('strong', {}, d.donor.name), h('small', {}, d.donor.email))) },
            { label: 'Cantidad', className: 'num', render: (d) => qty(d.quantity, d.unit) },
            { label: 'Caducidad', render: (d) => (d.expiresAt ? date(d.expiresAt) : h('span', { class: 'muted' }, 'No aplica')) },
            { label: 'Estado', render: (d) => statusBadge(d.status) },
            { label: 'Asignada a', render: assignedCell },
            {
              label: 'Acción',
              className: 'actions',
              render: (d) =>
                d.status === 'disponible'
                  ? h(
                      'button',
                      {
                        type: 'button',
                        class: 'btn btn-ghost btn-sm',
                        onclick: async () => {
                          const ok = await dialog({ title: 'Cancelar donación', body: `¿Cancelar "${d.title}"? Esta acción no se puede deshacer.`, confirmLabel: 'Sí, cancelar', cancelLabel: 'Volver', danger: true });
                          if (ok) run(() => api.cancelDonation(d.id), 'Donación cancelada', draw);
                        },
                      },
                      'Cancelar',
                    )
                  : h('span', { class: 'muted' }, '—'),
            },
          ],
          list,
          empty('Sin donaciones', 'No hay donaciones con este estado.', 'package'),
        ),
      ),
    );
  }
  await draw();
  return root;
}

// ---------- Usuarios ----------
function statusVerb(u, suspending) {
  if (suspending) return 'Suspender';
  return u.status === 'pendiente' ? 'Verificar' : 'Reactivar';
}

async function changeStatus(u, status, done) {
  const suspending = status === 'suspendido';
  const verb = statusVerb(u, suspending);
  const who = u.organization || u.name;
  const extra = u.role === 'beneficiario' ? ' y solicitar donaciones' : '';
  const ok = await dialog({
    title: `${verb} cuenta`,
    body: suspending
      ? `${who} no podrá iniciar sesión y sus sesiones activas se cerrarán de inmediato.`
      : `${who} podrá usar la plataforma${extra}.`,
    confirmLabel: verb,
    danger: suspending,
  });
  if (ok) run(() => api.setUserStatus(u.id, status), `Cuenta ${suspending ? 'suspendida' : 'activada'}`, done);
}

export async function users({ refreshChrome }) {
  const root = h('div');
  let filter = 'pendiente';

  async function draw() {
    const { users: list } = await api.users(filter ? { status: filter } : {});
    const done = () => {
      draw();
      refreshChrome();
    };
    clear(
      root,
      pageHead('Usuarios', 'Verifica organizaciones y gestiona el acceso', { icon: 'users', value: `${num(list.length)}`, label: filter === 'pendiente' ? 'Por verificar' : 'En este filtro' }),
      h(
        'div',
        { class: 'section-head', 'data-tour': 'filters' },
        chips(
          [
            ['pendiente', 'Por verificar'],
            ['activo', 'Activos'],
            ['suspendido', 'Suspendidos'],
            ['', 'Todos'],
          ],
          filter,
          (v) => {
            filter = v;
            draw();
          },
        ),
      ),
      h(
        'div',
        { class: 'section', 'data-tour': 'table' },
        table(
          [
            {
              label: 'Usuario',
              primary: true,
              render: (u) => h('div', { class: 'cell-main' }, h('span', { class: 'avatar' }, initials(u.name)), h('div', {}, h('strong', {}, u.name), h('small', {}, u.email))),
            },
            { label: 'Rol', render: (u) => ROLE_LABEL[u.role] },
            { label: 'Organización', render: (u) => u.organization || h('span', { class: 'muted' }, '—') },
            { label: 'Registro', render: (u) => date(u.createdAt) },
            { label: 'Estado', render: (u) => statusBadge(u.status) },
            {
              label: 'Acciones',
              className: 'actions',
              render: (u) => {
                if (u.role === 'admin') return h('span', { class: 'muted' }, 'Administrador');
                if (u.status === 'pendiente') {
                  return [
                    h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => changeStatus(u, 'activo', done) }, 'Verificar'),
                    h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => changeStatus(u, 'suspendido', done) }, 'Rechazar'),
                  ];
                }
                if (u.status === 'activo') return h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => changeStatus(u, 'suspendido', done) }, 'Suspender');
                return h('button', { type: 'button', class: 'btn btn-outline btn-sm', onclick: () => changeStatus(u, 'activo', done) }, 'Reactivar');
              },
            },
          ],
          list,
          empty('No hay usuarios aquí', filter === 'pendiente' ? 'No hay organizaciones esperando verificación.' : 'Cambia el filtro para ver otras cuentas.', 'users'),
        ),
      ),
    );
  }
  await draw();
  return root;
}

// ---------- Auditoría ----------
const ACTION_LABELS = {
  REGISTRO: 'Registro',
  INICIO_SESION: 'Inicio de sesión',
  CUENTA_BLOQUEADA: 'Cuenta bloqueada',
  DONACION_PUBLICADA: 'Donación publicada',
  DONACION_CANCELADA: 'Donación cancelada',
  SOLICITUD_CREADA: 'Solicitud creada',
  SOLICITUD_CANCELADA: 'Solicitud cancelada',
  SOLICITUD_APROBADA: 'Solicitud aprobada',
  SOLICITUD_RECHAZADA: 'Solicitud rechazada',
  ASIGNACION_REVOCADA: 'Asignación revocada',
  ENTREGA_CONFIRMADA: 'Entrega confirmada',
  USUARIO_VERIFICADO: 'Organización verificada',
  USUARIO_SUSPENDIDO: 'Cuenta suspendida',
  USUARIO_REACTIVADO: 'Cuenta reactivada',
};
const actionLabel = (a) => ACTION_LABELS[a] || a;

export async function audit() {
  const { entries } = await api.audit();
  return h(
    'div',
    {},
    pageHead('Auditoría', 'Registro de acciones relevantes en la plataforma', { icon: 'shield', value: `${num(entries.length)}`, label: 'Eventos recientes' }),
    h(
      'div',
      { class: 'section', 'data-tour': 'table' },
      table(
        [
          { label: 'Fecha', render: (e) => dateTime(e.at) },
          { label: 'Usuario', primary: true, render: (e) => h('div', { class: 'cell-main' }, h('div', {}, h('strong', {}, e.actorName), h('small', {}, ROLE_LABEL[e.actorRole] || 'Sistema'))) },
          { label: 'Acción', render: (e) => h('strong', {}, actionLabel(e.action)) },
          { label: 'Detalle', render: (e) => h('span', { class: 'muted' }, e.detail || '—') },
        ],
        entries,
        empty('Sin eventos', 'Las acciones aparecerán aquí.', 'shield'),
      ),
    ),
    notice('Trazabilidad', 'Se conservan los últimos 1000 eventos: registros, inicios de sesión, publicaciones, aprobaciones, entregas y cambios de estado de cuentas.'),
  );
}

