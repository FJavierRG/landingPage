/**
 * Efectos de pantalla: cuadrícula curvada de fondo, overlay CRT (WebGL)
 * y tearing real vía filtro SVG (feDisplacementMap).
 * Valores fijados en la fase de diseño: ver prototipos/DIRECCION-ARTE.md
 */

const FIXED = {
  bar: 0.55, // fuerza de la banda de rodadura
  sweepDur: 2.7, // duración del barrido en segundos
  tear: 0.3, // intensidad del tearing
  interval: 10, // segundos entre pasadas
  base: 0.1, // scanlines + grano
  curv: 0.35, // curvatura del tubo
  frame: 0.56, // sombra de marco
};

const BEZEL = 30; // px del marco físico en PC (0 en móvil)

const mqMobile = window.matchMedia('(max-width: 700px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// El feDisplacementMap animado sobre todo el DOM rinde mal en WebKit:
// en Safari se omite el tearing y queda solo la banda del shader.
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);
const bezelPx = () => (mqMobile.matches ? 0 : BEZEL);

/* ================= Cuadrícula curvada (canvas 2D detrás del DOM) ================= */

// Inversa aproximada del warp del shader (3 iteraciones de punto fijo)
function invWarp(u: number, v: number, k: number): [number, number] {
  const tx = u * 2 - 1;
  const ty = v * 2 - 1;
  let x = tx;
  let y = ty;
  for (let i = 0; i < 3; i++) {
    const ox = Math.abs(y) * k;
    const oy = Math.abs(x) * k;
    x = tx / (1 + ox * ox);
    y = ty / (1 + oy * oy);
  }
  return [(x + 1) / 2, (y + 1) / 2];
}

function initGrid() {
  const canvas = document.getElementById('bg-grid') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  function draw() {
    const d = dpr();
    const w = Math.round(innerWidth * d);
    const h = Math.round(innerHeight * d);
    canvas!.width = w;
    canvas!.height = h;
    const inset = bezelPx() * d;
    const iw = w - 2 * inset;
    const ih = h - 2 * inset;
    if (iw <= 0 || ih <= 0) return;
    const k = FIXED.curv * 0.5;
    const spacing = 46 * d;
    ctx!.clearRect(0, 0, w, h);
    ctx!.strokeStyle = 'rgba(15, 45, 20, 0.14)';
    ctx!.lineWidth = d;

    for (let gx = spacing / 2; gx < iw; gx += spacing) {
      ctx!.beginPath();
      for (let i = 0; i <= 40; i++) {
        const [px, py] = invWarp(gx / iw, i / 40, k);
        const sx = inset + px * iw;
        const sy = inset + py * ih;
        i === 0 ? ctx!.moveTo(sx, sy) : ctx!.lineTo(sx, sy);
      }
      ctx!.stroke();
    }
    for (let gy = spacing / 2; gy < ih; gy += spacing) {
      ctx!.beginPath();
      for (let i = 0; i <= 40; i++) {
        const [px, py] = invWarp(i / 40, gy / ih, k);
        const sx = inset + px * iw;
        const sy = inset + py * ih;
        i === 0 ? ctx!.moveTo(sx, sy) : ctx!.lineTo(sx, sy);
      }
      ctx!.stroke();
    }
  }

  draw();
  window.addEventListener('resize', draw);
  mqMobile.addEventListener('change', draw);
}

/* ================= Overlay CRT (WebGL) ================= */

const VS = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FS = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_base;   // scanlines + grano
uniform float u_bar;    // fuerza de la banda de rodadura
uniform float u_barPos; // posicion vertical de la banda, 0 abajo - 1 arriba
uniform float u_curv;   // curvatura del tubo (esquinas negras)
uniform float u_frame;  // sombra de marco que se adelgaza hacia el centro
uniform float u_inset;  // grosor del marco fisico en pixeles de canvas

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Deformacion de tubo clasica: distorsion cubica que empuja
// las coordenadas hacia fuera cerca de los bordes.
vec2 warp(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) * k;
  uv = uv + uv * offset * offset;
  return uv * 0.5 + 0.5;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - vec2(u_inset)) / (u_res - 2.0 * u_inset);

  vec2 wuv = warp(uv, u_curv * 0.5);
  vec2 q = min(wuv, 1.0 - wuv);
  float r = 0.02 + 0.06 * u_curv;
  float dcorner = length(max(vec2(r) - q, 0.0));
  float mask = 1.0 - smoothstep(r - 0.005, r, dcorner);

  float scan = 0.5 + 0.5 * sin(wuv.y * u_res.y * 2.0943951);
  float darken = 0.26 * u_base * (1.0 - scan);

  float g = hash(uv * 917.0 + fract(u_time) * 61.0);
  darken += 0.05 * u_base * (g - 0.5);

  darken *= 1.0 + 0.04 * sin(u_time * 87.0);

  float edgeDist = min(q.x, q.y);
  float shw = 0.04 + 0.18 * u_frame;
  darken += 0.6 * u_frame * (1.0 - smoothstep(0.0, shw, edgeDist));

  float d = wuv.y - u_barPos;
  float core = exp(-d * d / 0.0028);
  darken += 0.30 * u_bar * core;
  float e = d - 0.055;
  float glowEdge = exp(-e * e / 0.0004);
  float lighten = 0.10 * u_bar * glowEdge;
  darken += 0.10 * u_bar * core * (hash(uv * 431.0 + u_time * 97.0) - 0.5);

  float m = mod(gl_FragCoord.x + core * u_bar * 3.0, 3.0);
  vec3 stripe = vec3(step(m, 1.0), step(1.0, m) * step(m, 2.0), step(2.0, m));

  float net = lighten - darken;
  float a = clamp(abs(net), 0.0, 0.85);
  vec3 col = net > 0.0 ? vec3(1.0) : stripe * 0.30;

  gl_FragColor = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(col * a, a), mask);
}
`;

function initCrt() {
  const desk = document.getElementById('desk') as HTMLElement | null;
  const canvas = document.getElementById('crt') as HTMLCanvasElement | null;
  if (!desk || !canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
  if (!gl) {
    canvas.style.display = 'none';
    return;
  }

  function compile(type: number, src: string): WebGLShader | null {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.error('[crt] error compilando shader:', gl!.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) {
    canvas.style.display = 'none';
    return;
  }

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[crt] error enlazando programa:', gl.getProgramInfoLog(prog));
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    base: gl.getUniformLocation(prog, 'u_base'),
    bar: gl.getUniformLocation(prog, 'u_bar'),
    barPos: gl.getUniformLocation(prog, 'u_barPos'),
    curv: gl.getUniformLocation(prog, 'u_curv'),
    frame: gl.getUniformLocation(prog, 'u_frame'),
    inset: gl.getUniformLocation(prog, 'u_inset'),
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  function resize() {
    const d = dpr();
    canvas!.width = Math.round(innerWidth * d);
    canvas!.height = Math.round(innerHeight * d);
    gl!.viewport(0, 0, canvas!.width, canvas!.height);
  }
  resize();

  function render(time: number, barPos: number, bar: number) {
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.uniform2f(u.res, canvas!.width, canvas!.height);
    gl!.uniform1f(u.time, time);
    gl!.uniform1f(u.base, FIXED.base);
    gl!.uniform1f(u.bar, bar);
    gl!.uniform1f(u.barPos, barPos);
    gl!.uniform1f(u.curv, FIXED.curv);
    gl!.uniform1f(u.frame, FIXED.frame);
    gl!.uniform1f(u.inset, bezelPx() * dpr());
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  // Con movimiento reducido: un solo fotograma estático
  // (curvatura, scanlines y sombra; sin banda, grano ni tearing).
  if (reducedMotion) {
    render(0, -1, 0);
    const redraw = () => {
      resize();
      render(0, -1, 0);
    };
    window.addEventListener('resize', redraw);
    mqMobile.addEventListener('change', redraw);
    return;
  }

  window.addEventListener('resize', resize);

  /* ----- Tearing: filtro SVG con bandas de desplazamiento ----- */
  const bandA = document.getElementById('tear-band-a');
  const bandB = document.getElementById('tear-band-b');
  const disp = document.getElementById('tear-disp');
  const tearAvailable = !isSafari && bandA && bandB && disp;
  let tearOn = false;

  function setTear(pos: number, strength: number) {
    if (!tearAvailable) return;
    const yTop = (1 - pos) * 100;
    const hA = 2.5 + ((pos * 977) % 1) * 3;
    const hB = 1.5 + ((pos * 449) % 1) * 2.5;
    bandA!.setAttribute('y', (yTop - hA).toFixed(2) + '%');
    bandA!.setAttribute('height', hA.toFixed(2) + '%');
    bandB!.setAttribute('y', yTop.toFixed(2) + '%');
    bandB!.setAttribute('height', hB.toFixed(2) + '%');
    disp!.setAttribute('scale', (strength * FIXED.tear * 36).toFixed(1));
    if (!tearOn) {
      desk!.style.filter = 'url(#tearFilter)';
      tearOn = true;
    }
  }

  function clearTear() {
    if (tearOn) {
      desk!.style.filter = '';
      disp!.setAttribute('scale', '0');
      tearOn = false;
    }
  }

  /* ----- Bucle: barrido -> espera -> barrido ----- */
  let state: 'sweep' | 'wait' = 'sweep';
  let stateStart = performance.now();
  let tearPoints: number[] = [];

  function newTearPoints() {
    const n = 1 + Math.floor(Math.random() * 2);
    tearPoints = Array.from({ length: n }, () => 0.15 + Math.random() * 0.7);
  }
  newTearPoints();

  function frame() {
    const now = performance.now();
    const inState = (now - stateStart) / 1000;

    let pos = -1; // fuera de pantalla = banda invisible
    let tearStrength = 0;
    let tearPos = 0;

    if (state === 'sweep') {
      const p = inState / FIXED.sweepDur;
      if (p >= 1) {
        state = 'wait';
        stateStart = now;
      } else {
        pos = p;
        for (const tp of tearPoints) {
          const dist = Math.abs(pos - tp);
          if (dist < 0.035) {
            const s = 1 - dist / 0.035;
            if (s > tearStrength) {
              tearStrength = s;
              tearPos = pos;
            }
          }
        }
      }
    } else if (inState >= FIXED.interval) {
      state = 'sweep';
      stateStart = now;
      newTearPoints();
    }

    if (tearStrength > 0.01) {
      setTear(tearPos, tearStrength);
    } else {
      clearTear();
    }

    render((now % 1e6) / 1000, pos, state === 'sweep' ? FIXED.bar : 0);
    requestAnimationFrame(frame);
  }
  frame();
}

initGrid();
initCrt();
