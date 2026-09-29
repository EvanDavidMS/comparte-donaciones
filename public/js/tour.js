// Motor de la ruta guiada: resalta un elemento de la pantalla, explica qué hace
// y avanza paso a paso, navegando entre los paneles del rol cuando hace falta.
import { h, icon } from './dom.js';

const WAIT_MS = 4000;
const GAP = 14;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Espera a que el elemento exista y la vista haya terminado de cargar. */
async function waitFor(selector, route) {
  const start = Date.now();
  while (Date.now() - start < WAIT_MS) {
    const ready = !route || document.getElementById('content')?.dataset.route === route;
    const el = selector ? document.querySelector(selector) : null;
    if (ready && (!selector || el)) return el;
    await sleep(60);
  }
  return selector ? document.querySelector(selector) : null;
}

/** Un elemento cuenta como visible si tiene tamaño y está dentro de la pantalla (p. ej. no en el menú móvil cerrado). */
function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
}

let active = null;

export function isTourActive() {
  return Boolean(active);
}

export function endTour() {
  active?.end(false);
}

/**
 * Inicia un recorrido.
 * steps: [{ route?, target?, title, text }]
 * go: función de navegación; currentPath: ruta actual; onFinish(completed)
 */
export function startTour(steps, { go, currentPath, onFinish = () => {} }) {
  if (active) active.end(false);

  const blocker = h('div', { class: 'tour-blocker' });
  const spot = h('div', { class: 'tour-spot', 'aria-hidden': 'true' });
  const counter = h('span', { class: 'tour-count' });
  const title = h('h2', { id: 'tour-title' });
  const text = h('p', { id: 'tour-text' });
  const prev = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Anterior');
  const next = h('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Siguiente');
  const skip = h('button', { type: 'button', class: 'tour-skip' }, 'Saltar recorrido');
  const dots = h('div', { class: 'tour-dots', 'aria-hidden': 'true' }, steps.map(() => h('span')));
  const pop = h(
    'div',
    { class: 'tour-pop', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tour-title', 'aria-describedby': 'tour-text' },
    h('div', { class: 'tour-head' }, h('span', { class: 'tour-badge' }, icon('compass'), 'Ruta guiada'), counter),
    title,
    text,
    dots,
    h('div', { class: 'tour-foot' }, skip, h('div', { class: 'tour-nav' }, prev, next)),
  );
  document.body.append(blocker, spot, pop);

  let index = 0;
  let target = null;
  let token = 0;

  function place() {
    const mobile = window.innerWidth <= 640;
    if (!isVisible(target)) {
      spot.classList.add('center');
      spot.removeAttribute('style');
      pop.classList.toggle('sheet', mobile);
      pop.classList.add('centered');
      pop.style.left = '';
      pop.style.top = '';
      return;
    }
    spot.classList.remove('center');
    pop.classList.remove('centered');
    const r = target.getBoundingClientRect();
    const pad = 8;
    Object.assign(spot.style, {
      left: `${r.left - pad}px`,
      top: `${r.top - pad}px`,
      width: `${r.width + pad * 2}px`,
      height: `${r.height + pad * 2}px`,
    });
    if (mobile) {
      pop.classList.add('sheet');
      pop.style.left = '';
      pop.style.top = '';
      return;
    }
    pop.classList.remove('sheet');
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    let top = r.bottom + GAP;
    if (top + ph > window.innerHeight - 12) top = r.top - ph - GAP;
    if (top < 12) {
      // No cabe arriba ni abajo: a un costado del elemento.
      top = Math.max(12, Math.min(r.top, window.innerHeight - ph - 12));
      const right = r.right + GAP;
      pop.style.left = `${right + pw < window.innerWidth - 12 ? right : Math.max(12, r.left - pw - GAP)}px`;
      pop.style.top = `${top}px`;
      return;
    }
    const left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  async function show(i) {
    const current = ++token;
    index = i;
    const step = steps[i];
    pop.classList.add('busy');
    if (step.route && currentPath() !== step.route) go(step.route);
    const el = await waitFor(step.target, step.route);
    if (current !== token) return;
    target = el;
    if (isVisible(target)) {
      target.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    counter.textContent = `Paso ${i + 1} de ${steps.length}`;
    title.textContent = step.title;
    text.textContent = step.text;
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
    prev.disabled = i === 0;
    next.textContent = i === steps.length - 1 ? 'Finalizar' : 'Siguiente';
    pop.classList.remove('busy');
    place();
    next.focus();
  }

  const onKey = (e) => {
    if (e.key === 'Escape') end(false);
    else if (e.key === 'ArrowRight' && index < steps.length - 1) show(index + 1);
    else if (e.key === 'ArrowLeft' && index > 0) show(index - 1);
  };
  const onMove = () => place();

  function end(completed) {
    token += 1;
    blocker.remove();
    spot.remove();
    pop.remove();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onMove);
    window.removeEventListener('scroll', onMove, true);
    active = null;
    onFinish(completed);
  }

  next.addEventListener('click', () => (index === steps.length - 1 ? end(true) : show(index + 1)));
  prev.addEventListener('click', () => index > 0 && show(index - 1));
  skip.addEventListener('click', () => end(false));
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onMove);
  window.addEventListener('scroll', onMove, true);

  active = { end };
  show(0);
}
