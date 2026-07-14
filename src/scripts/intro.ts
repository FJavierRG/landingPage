/**
 * Secuencia de intro en dos fases:
 *  1. Firma (3 s): nombre sobre negro puro, FUERA del ordenador virtual
 *     (la capa cubre también el marco y el CRT).
 *  2. Acid boot (3 s): staccato tipográfico a lo Symphony in Acid
 *     (Ksawery Komputery) — bloques de palabras y tokens de sistema que
 *     aparecen a golpes discretos, se corrompen con typos, se invierten
 *     en negativo y saltan de sitio. Sin movimiento suave: cortes secos
 *     a ritmo de ~100 ms. Dentro de la pantalla y bajo el overlay CRT.
 */

const SIGNATURE_MS = 3000;
const ACID_MS = 3000;

const PAPER = '#f3ecd9';
const BG = '#0a0d0a';
const GLYPHS = '#$%&/\\|<>[]{}()=+-*:;.,_@~^!?0123456789';

// Sin mensaje: palabras sueltas en varios idiomas + tokens de sistema.
const WORDS = [
  'void', 'null', 'goto', 'sudo', 'init', 'boot', 'kernel', 'malloc', 'segfault',
  'stack', 'heap', 'panic', 'grep', 'fork', 'pipe', 'flush', 'halt', 'abort',
  '0x3F8', '0xFF', '0xC0DE', 'IRQ07', 'SYS_CFG', '/dev/tty0', 'A:\\>', 'NaN',
  'undefined', 'true', 'false', 'if', 'else', 'while', 'break', 'return',
  'sistema', 'error', 'ruido', 'lenguaje', 'palabra', 'signal', 'noise',
  'system', 'machine', 'sprache', 'fehler', 'mot', 'bruit', 'codice', 'dado',
  'ERR', 'OK??', 'MEM', 'CHK', 'ACK', 'EOF', 'ESC', ':::', '////', '....',
];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pick = <T,>(arr: readonly T[]): T => arr[(Math.random() * arr.length) | 0];

function runAcid(canvas: HTMLCanvasElement, done: () => void) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    done();
    return;
  }

  canvas.style.display = 'block';
  const d = Math.min(window.devicePixelRatio || 1, 1.5);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * d);
  canvas.height = Math.round(rect.height * d);

  const cellW = 8.5 * d;
  const cellH = 17 * d;
  const cols = Math.max(1, Math.floor(canvas.width / cellW));
  const rows = Math.max(1, Math.floor(canvas.height / cellH));

  // estado de la composición: carácter e inversión por celda, offset por fila
  const chars: string[] = new Array(cols * rows).fill(' ');
  const inverted: boolean[] = new Array(cols * rows).fill(false);
  const rowOff: number[] = new Array(rows).fill(0);
  let bigWord: string | null = null;
  let bigInverted = false;

  /* ---- operaciones de un beat ---- */

  function region() {
    const w = 8 + ((Math.random() * (cols * 0.5)) | 0);
    const h = 2 + ((Math.random() * (rows * 0.35)) | 0);
    const x0 = (Math.random() * (cols - w)) | 0;
    const y0 = (Math.random() * (rows - h)) | 0;
    return { x0, y0, w, h };
  }

  // rellena un bloque escribiendo palabras del pool, con saltos de línea duros
  function writeWords() {
    const { x0, y0, w, h } = region();
    for (let y = y0; y < y0 + h; y++) {
      let x = x0;
      while (x < x0 + w) {
        const word = pick(WORDS);
        for (let i = 0; i < word.length && x < x0 + w; i++, x++) {
          chars[y * cols + x] = word[i];
        }
        x++; // espacio entre palabras
      }
    }
  }

  // typos: corrompe una parte de los caracteres ya escritos
  function scramble() {
    const { x0, y0, w, h } = region();
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const i = y * cols + x;
        if (chars[i] !== ' ' && Math.random() < 0.35) chars[i] = pick([...GLYPHS]);
      }
    }
  }

  function invertBlock() {
    const { x0, y0, w, h } = region();
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        inverted[y * cols + x] = !inverted[y * cols + x];
      }
    }
  }

  function clearBlock() {
    const { x0, y0, w, h } = region();
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const i = y * cols + x;
        chars[i] = ' ';
        inverted[i] = false;
      }
    }
  }

  function shiftRows() {
    const y0 = (Math.random() * rows) | 0;
    const h = 1 + ((Math.random() * 3) | 0);
    const dx = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 35) * d;
    for (let y = y0; y < Math.min(y0 + h, rows); y++) rowOff[y] = dx;
  }

  function beat(p: number) {
    // los saltos de fila y la palabra gigante duran un solo beat
    rowOff.fill(0);
    bigWord = null;

    // densidad creciente: al principio se escribe, luego se corrompe
    writeWords();
    if (p > 0.15) writeWords();
    if (Math.random() < 0.3 + p * 0.5) scramble();
    if (Math.random() < 0.35) invertBlock();
    if (Math.random() < 0.25 + p * 0.2) clearBlock();
    if (Math.random() < 0.3) shiftRows();
    if (Math.random() < 0.18) {
      bigWord = pick(WORDS);
      bigInverted = Math.random() < 0.5;
    }
  }

  /* ---- render: solo cambia en los beats, cortes secos ---- */

  function draw() {
    ctx!.fillStyle = BG;
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
    ctx!.font = `${13 * d}px 'IBM Plex Mono', monospace`;
    ctx!.textBaseline = 'top';

    for (let y = 0; y < rows; y++) {
      const off = rowOff[y];
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const ch = chars[i];
        if (ch === ' ' && !inverted[i]) continue;
        const px = x * cellW + off;
        const py = y * cellH;
        if (inverted[i]) {
          ctx!.fillStyle = PAPER;
          ctx!.fillRect(px, py, cellW + 0.5, cellH);
          if (ch !== ' ') {
            ctx!.fillStyle = BG;
            ctx!.fillText(ch, px, py + 2 * d);
          }
        } else {
          ctx!.fillStyle = PAPER;
          ctx!.fillText(ch, px, py + 2 * d);
        }
      }
    }

    if (bigWord) {
      const size = Math.min(canvas.width / (bigWord.length * 0.65), canvas.height * 0.28);
      ctx!.font = `700 ${size}px 'IBM Plex Mono', monospace`;
      ctx!.textBaseline = 'middle';
      const tw = ctx!.measureText(bigWord).width;
      const bx = (canvas.width - tw) / 2;
      const by = canvas.height / 2;
      if (bigInverted) {
        ctx!.fillStyle = PAPER;
        ctx!.fillRect(bx - size * 0.2, by - size * 0.62, tw + size * 0.4, size * 1.24);
        ctx!.fillStyle = BG;
      } else {
        ctx!.fillStyle = PAPER;
      }
      ctx!.fillText(bigWord, bx, by);
    }
  }

  const start = performance.now();
  let raf = 0;
  let fading = false;
  let nextBeat = start;

  function frame(now: number) {
    const elapsed = now - start;
    if (elapsed >= ACID_MS) {
      cancelAnimationFrame(raf);
      done();
      return;
    }
    if (!fading && elapsed >= ACID_MS - 250) {
      fading = true;
      canvas.style.opacity = '0'; // transición CSS de 0.25 s
    }

    if (now >= nextBeat) {
      beat(elapsed / ACID_MS);
      draw();
      nextBeat = now + 70 + Math.random() * 90;
    }

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}

function runIntro() {
  const firma = document.getElementById('firma');
  const acid = document.getElementById('acid') as HTMLCanvasElement | null;
  if (!firma || !acid) return;

  if (reducedMotion) {
    firma.remove();
    acid.remove();
    return;
  }

  firma.classList.add('play');
  // el acid arranca justo antes de que la firma termine de fundirse,
  // para que el "encendido" del monitor ya esté en marcha al revelarse
  setTimeout(() => runAcid(acid, () => acid.remove()), SIGNATURE_MS - 350);
  setTimeout(() => firma.remove(), SIGNATURE_MS);
}

runIntro();
