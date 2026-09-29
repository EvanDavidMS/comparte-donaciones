import { api } from '../api.js';
import { h, num, pageHead, metrics, tabs, field, formData, showFieldErrors, withBusy, toast, notice, chips } from '../dom.js';

export async function authView(mode, { onLogin, themeToggle }) {
  let stats = { availableDonations: 0, deliveredDonations: 0, deliveredKg: 0, verifiedOrganizations: 0 };
  let demo;
  try {
    ({ stats, demo } = await api.publicStats());
  } catch {
    /* las métricas son opcionales en la pantalla de acceso */
  }

  const isLogin = mode !== 'registro';
  const switchTo = (m) => (location.hash = m === 'login' ? '#/login' : '#/registro');

  return h(
    'div',
    {},
    h(
      'header',
      { class: 'auth-top' },
      h('a', { class: 'brand', href: '#/login' }, h('img', { src: '/img/logo.svg', alt: '' }), h('span', {}, 'Conecta +', h('small', {}, 'Red de donaciones'))),
      h('div', { class: 'spacer' }),
      h('a', { class: 'btn btn-primary', href: isLogin ? '#/registro' : '#/login' }, isLogin ? 'Crear cuenta' : 'Iniciar sesión'),
      themeToggle(),
    ),
    h(
      'main',
      { class: 'auth-page' },
      pageHead(isLogin ? 'Bienvenido a Conecta +' : 'Únete a la red', 'Conectamos excedentes de empresas con organizaciones sociales', {
        icon: 'heart',
        value: `${num(stats.deliveredKg)} kg`,
        label: 'Alimentos entregados',
      }),
      h(
        'div',
        { class: 'grid-2' },
        h(
          'section',
          { class: 'card' },
          tabs(
            [
              ['login', 'Iniciar sesión'],
              ['registro', 'Crear cuenta'],
            ],
            isLogin ? 'login' : 'registro',
            switchTo,
          ),
          isLogin ? loginForm(onLogin, demo) : registerForm(onLogin),
        ),
        metrics([
          { label: 'Donaciones disponibles', value: num(stats.availableDonations), icon: 'package' },
          { label: 'Entregas completadas', value: num(stats.deliveredDonations), icon: 'arrowUpRight' },
          { label: 'Organizaciones verificadas', value: num(stats.verifiedOrganizations), icon: 'trending' },
        ]),
      ),
      notice(
        'Importante',
        'Las organizaciones beneficiarias se verifican manualmente antes de poder solicitar donaciones. Los donadores pueden publicar desde el primer momento.',
      ),
    ),
  );
}

function loginForm(onLogin, demo) {
  const form = h(
    'form',
    { class: 'form', novalidate: true },
    field({ label: 'Correo electrónico', name: 'email', type: 'email', required: true, attrs: { autocomplete: 'email', placeholder: 'tu@correo.com' } }),
    field({ label: 'Contraseña', name: 'password', type: 'password', required: true, attrs: { autocomplete: 'current-password', placeholder: '••••••••' } }),
  );
  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Iniciar sesión');
  form.append(submit, h('p', { class: 'form-foot' }, '¿Aún no tienes cuenta? ', h('button', { type: 'button', onclick: () => (location.hash = '#/registro') }, 'Regístrate')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email, password } = formData(form);
    if (!email || !password) {
      showFieldErrors(form, { details: [!email && { field: 'email', message: 'Ingresa tu correo' }, !password && { field: 'password', message: 'Ingresa tu contraseña' }].filter(Boolean) });
      return;
    }
    await withBusy(submit, async () => {
      try {
        const { user } = await api.login(email, password);
        toast(`Hola, ${user.name}`);
        onLogin(user);
      } catch (err) {
        showFieldErrors(form, err);
      }
    });
  });

  if (demo) {
    form.append(
      h(
        'div',
        { class: 'demo' },
        h('p', {}, `Modo demostración · contraseña de las cuentas de prueba: ${demo.password}`),
        chips(
          demo.accounts.map((a) => [a.email, a.role]),
          null,
          (email) => {
            form.email.value = email;
            form.password.value = demo.password;
            form.password.focus();
          },
        ),
      ),
    );
  }
  return form;
}

function registerForm(onLogin) {
  const roleOption = (value, title, text, checked) =>
    h('label', { class: 'role-option' }, h('input', { type: 'radio', name: 'role', value, checked }), h('div', {}, h('strong', {}, title), h('span', {}, text)));

  const orgField = field({
    label: 'Empresa u organización',
    name: 'organization',
    hint: 'Opcional para donadores particulares',
    attrs: { autocomplete: 'organization', maxlength: 100 },
  });
  const form = h(
    'form',
    { class: 'form', novalidate: true },
    h(
      'fieldset',
      { class: 'field fieldset-reset', dataset: { field: 'role' } },
      h('legend', { class: 'sr-only' }, 'Tipo de cuenta'),
      h(
        'div',
        { class: 'role-options' },
        roleOption('donador', 'Quiero donar', 'Empresa o persona con alimentos o recursos', true),
        roleOption('beneficiario', 'Quiero recibir', 'Organización social que atiende a personas', false),
      ),
      h('span', { class: 'error' }),
    ),
    field({ label: 'Nombre completo', name: 'name', required: true, attrs: { autocomplete: 'name', maxlength: 80 } }),
    orgField,
    field({ label: 'Correo electrónico', name: 'email', type: 'email', required: true, attrs: { autocomplete: 'email', maxlength: 120 } }),
    field({
      label: 'Contraseña',
      name: 'password',
      type: 'password',
      required: true,
      hint: 'Mínimo 8 caracteres, con mayúscula, minúscula y número',
      attrs: { autocomplete: 'new-password', maxlength: 72 },
    }),
  );
  const hint = orgField.querySelector('.hint');
  form.addEventListener('change', (e) => {
    if (e.target.name !== 'role') return;
    const isOrg = e.target.value === 'beneficiario';
    hint.textContent = isOrg ? 'Obligatorio: nombre de la organización social' : 'Opcional para donadores particulares';
  });

  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Crear cuenta');
  form.append(submit, h('p', { class: 'form-foot' }, '¿Ya tienes cuenta? ', h('button', { type: 'button', onclick: () => (location.hash = '#/login') }, 'Inicia sesión')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formData(form);
    const payload = { name: data.name, email: data.email, password: data.password, role: data.role };
    if (data.organization.trim()) payload.organization = data.organization;
    await withBusy(submit, async () => {
      try {
        const { user } = await api.register(payload);
        toast(user.status === 'pendiente' ? 'Cuenta creada. Un administrador verificará tu organización.' : 'Cuenta creada. ¡Bienvenido!');
        onLogin(user);
      } catch (err) {
        showFieldErrors(form, err);
      }
    });
  });
  return form;
}

