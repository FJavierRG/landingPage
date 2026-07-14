/**
 * Gestor de escritorio: ventanas (abrir/cerrar/foco/arrastre),
 * rutas por hash, barra de tareas y reloj.
 * La secuencia de intro (firma + acid boot) vive en intro.ts.
 */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ================= Gestor de ventanas ================= */

let zTop = 10;
const originFor: Record<string, HTMLElement> = {}; // id de ventana -> elemento de origen del zoom
const taskBtns: Record<string, HTMLButtonElement> = {};
const openList = document.querySelector<HTMLElement>('.taskbar .open-list');

function isVisible(el: HTMLElement | undefined): el is HTMLElement {
  return !!el && el.offsetParent !== null;
}

function syncHash(id: string | null) {
  const hash = id ? '#' + id.replace(/^win-/, '') : ' ';
  history.replaceState(null, '', id ? hash : location.pathname + location.search);
}

function focusWin(win: HTMLElement) {
  zTop += 1;
  win.style.zIndex = String(zTop);
  document.querySelectorAll<HTMLElement>('.window.open').forEach((w) => {
    w.classList.toggle('inactive', w !== win);
  });
  Object.entries(taskBtns).forEach(([id, btn]) => {
    btn.classList.toggle('focused', id === win.id);
  });
  syncHash(win.id);
}

function addTaskBtn(win: HTMLElement) {
  if (!openList || taskBtns[win.id]) return;
  const btn = document.createElement('button');
  btn.className = 'task-btn';
  btn.textContent = win.querySelector('.title')?.textContent ?? win.id;
  btn.addEventListener('click', () => focusWin(win));
  openList.appendChild(btn);
  taskBtns[win.id] = btn;
}

function removeTaskBtn(id: string) {
  taskBtns[id]?.remove();
  delete taskBtns[id];
}

function openWin(win: HTMLElement, origin?: HTMLElement) {
  if (win.classList.contains('open')) {
    focusWin(win);
    return;
  }
  win.classList.add('open');
  addTaskBtn(win);
  focusWin(win);

  // congela la posición CSS en píxeles (simplifica arrastre y animaciones)
  const wr = win.getBoundingClientRect();
  win.style.left = wr.left + 'px';
  win.style.top = wr.top + 'px';
  win.style.transform = 'none';

  if (reducedMotion) return;
  const from = isVisible(origin) ? origin : originFor[win.id];
  if (!isVisible(from)) return;
  const ir = from.getBoundingClientRect();
  const dx = ir.left + ir.width / 2 - (wr.left + wr.width / 2);
  const dy = ir.top + ir.height / 2 - (wr.top + wr.height / 2);
  const s = Math.max(ir.width / wr.width, 0.05);
  win.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.25 },
      { transform: 'none', opacity: 1 },
    ],
    { duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' },
  );
}

function closeWin(win: HTMLElement) {
  const cleanup = () => {
    win.classList.remove('open', 'inactive');
    win.style.left = '';
    win.style.top = '';
    win.style.transform = '';
    win.style.zIndex = '';
    removeTaskBtn(win.id);
    const rest = [...document.querySelectorAll<HTMLElement>('.window.open')];
    if (rest.length) {
      const top = rest.reduce((a, b) => (Number(a.style.zIndex) > Number(b.style.zIndex) ? a : b));
      focusWin(top);
    } else {
      syncHash(null);
    }
  };

  const origin = originFor[win.id];
  if (reducedMotion || !isVisible(origin)) {
    cleanup();
    return;
  }
  const wr = win.getBoundingClientRect();
  const ir = origin.getBoundingClientRect();
  const dx = ir.left + ir.width / 2 - (wr.left + wr.width / 2);
  const dy = ir.top + ir.height / 2 - (wr.top + wr.height / 2);
  const s = Math.max(ir.width / wr.width, 0.05);
  win.animate(
    [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.2 },
    ],
    { duration: 240, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)' },
  ).onfinish = cleanup;
}

function initWindows() {
  // disparadores: iconos de escritorio y archivos del explorador
  document.querySelectorAll<HTMLElement>('[data-opens]').forEach((trigger) => {
    const win = document.getElementById(trigger.dataset.opens!);
    if (!win) return;
    if (!originFor[win.id]) originFor[win.id] = trigger;
    const isDesktopIcon = trigger.classList.contains('icon');
    const event = isDesktopIcon && finePointer ? 'dblclick' : 'click';
    trigger.addEventListener(event, () => openWin(win, trigger));
    trigger.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') openWin(win, trigger);
    });
  });

  document.querySelectorAll<HTMLElement>('.window').forEach((win) => {
    win.addEventListener('pointerdown', () => {
      if (win.classList.contains('inactive')) focusWin(win);
    });
    win.querySelector('.dot-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWin(win);
    });

    const bar = win.querySelector<HTMLElement>('.titlebar');
    if (!bar) return;
    let drag: { dx: number; dy: number } | null = null;
    bar.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('.dot-close')) return;
      const wr = win.getBoundingClientRect();
      drag = { dx: e.clientX - wr.left, dy: e.clientY - wr.top };
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!drag) return;
      win.style.left = e.clientX - drag.dx + 'px';
      win.style.top = e.clientY - drag.dy + 'px';
    });
    bar.addEventListener('pointerup', () => (drag = null));
    bar.addEventListener('pointercancel', () => (drag = null));
  });

  // ruta por hash: /#proyectos abre la ventana correspondiente
  const openFromHash = () => {
    const id = location.hash.replace('#', '');
    if (!id) return;
    const win = document.getElementById('win-' + id);
    if (win?.classList.contains('window')) openWin(win);
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

/* ================= Reloj ================= */

function initClock() {
  const clock = document.getElementById('clock');
  if (!clock) return;
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  tick();
  setInterval(tick, 10000);
}

initWindows();
initClock();
