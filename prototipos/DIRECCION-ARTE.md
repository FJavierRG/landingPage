# Dirección de arte — Portfolio "escritorio retro"

Nota viva. Cada ronda de A/B testing fija decisiones aquí. Los prototipos de esta
carpeta son desechables; este documento es la fuente de verdad.

## Concepto

Portfolio como escritorio de ordenador de principios de los 90 reinterpretado con
sensibilidad actual. Pantalla de arranque con el nombre, escritorio con accesos
directos, y ventanas (Trabajos, Proyectos, Sobre mí, Contacto) que se abren con
doble click en PC y tap en móvil. Efecto CRT tipo Balatro por encima, con
intensidad ajustable.

## Decisiones fijadas

- **Empezar de 0 en la UI**, conservando repo, Astro, Tailwind, deploy a GitHub
  Pages, `site.ts` (datos) e imágenes de proyectos.
- **CRT por WebGL**: canvas superpuesto a pantalla completa con uniform de
  intensidad 0–1. Scanlines, viñeta, flicker, banda de refresco, grille RGB.
  Se desactiva con `prefers-reduced-motion`.
- **Síntesis de tres familias** (referencias del usuario, 2026-07-14):
  - *Estructura cozy*: ventanas crema, contorno negro grueso, esquinas
    ligeramente redondeadas, sombra dura desplazada sin difuminar, aire generoso.
  - *Atmósfera cyberpunk*: fondo oscuro donde el CRT brilla; decoración de
    escritorio a línea fina.
  - *Detalle pixel*: iconos, cursor y acentos en pixel art gordo; imágenes de
    proyectos con dithering 1-bit. El píxel nunca en el cuerpo de texto.
- **Tono de copy**: seco, funcional, humor de diálogo de sistema. Nada de
  lenguaje de LinkedIn/consultoría.
- Contenido de las ventanas renderizado en el HTML (oculto por CSS) y mapeado a
  hash/ruta para SEO y enlaces compartibles.

## Decisiones fijadas (rondas)

- **Dominante de color: verde saturado** (`#59b463` provisional) con ventanas
  crema. Ganó a la opción azul noche en la ronda 1.
- **Banda de rodadura**: una pasada cada 10s, indefinidamente (sin parada).
  Velocidad 90 (barrido de ~2,7s), fuerza 55.
- **Tearing**: intensidad 30, vía filtro SVG `feDisplacementMap` (la imagen se
  parte en franjas desplazadas al paso de la banda). Solo activo durante el
  desgarro; fallback pendiente para Safari.
- **Geometría del tubo** (retocable tras testear en otras pantallas):
  base CRT 10, curvatura 35, sombra de marco 56. Técnica Babylon/libretro de
  distorsión cúbica; fuera del tubo, negro opaco con esquinas redondeadas.
- **Barra de tareas**: 58px de alto, contenido elevado (padding inferior 14px)
  y con margen lateral para que ni la sombra del tubo ni las esquinas lo tapen.
- **Marco físico del monitor**: 30px de grosor, plástico beige `#d5c9a4` con
  moteado procedural (feTurbulence, opacidad 0.34), filo de luz alrededor del
  cristal, sombra de pantalla hundida y LED verde de encendido. El tubo del
  shader y la cuadrícula del fondo se reescalan al hueco del marco. Solo PC por
  ahora; móvil pendiente.
- **Estrategia de curvatura del contenido**: el DOM (texto, ventanas, iconos)
  no se dobla — queda plano dentro de una *zona segura* con margen para no caer
  bajo las esquinas negras. Lo que no lleva texto sí se dobla: la textura del
  fondo del escritorio se dibuja en un canvas 2D detrás del DOM siguiendo la
  misma curvatura del shader. Descartados: filtro de desplazamiento permanente
  (rendimiento/Safari) y render completo en WebGL (accesibilidad, nitidez de
  texto, complejidad).

- **Tipografías**: Nunito (texto) / Silkscreen (pixel) / IBM Plex Mono (sistema).
- **Chrome de ventana**: semáforo de tres puntos estilo Mac. Scrollbars nativas
  por ahora.
- **Iconografía**: iconos genéricos de OS (carpetas, documentos, sobre) — sin
  iconos custom, para no debilitar la metáfora de "esto es un monitor de PC".
- **Efectos reducidos** (`prefers-reduced-motion`): se apagan banda, tearing,
  flicker y grano animado; se conservan curvatura, esquinas, sombra y scanlines
  estáticas.

- **Cursor pixel** via CSS `cursor: url()` (nativo del SO, sin lag). Validado.
  Falta variante "mano" para elementos clicables (fase de construcción).
- **Pantalla de arranque**: fundido del nombre y borrado de izquierda a derecha
  (referencia Keita Yamada), **duración total ~4s**, desemboca en el
  escritorio.
- **Dithering 1-bit**: validado el pipeline Floyd–Steinberg sobre imagen real.
  El usuario adaptará las imágenes de proyectos al estilo (ver brief más
  abajo). En la web real la conversión se hace en build.

- **Móvil (≤700px)**: mismo stack visual que PC — CRT completo (curvatura,
  esquinas, sombra, banda, tearing), cuadrícula curvada y pantalla de arranque
  a viewport completo. Diferencias: **sin marco físico** (ni bisel, ni LED) y
  contenido responsive. Las ventanas **no** van a pantalla completa: siguen
  siendo ventanas flotantes (principal a 92vw centrada, secundarias
  recolocadas), barra de tareas compacta, iconos pegados al borde.

- **Ventanas** (`ab-03-ventanas.html`): apertura desde icono (doble click PC /
  tap móvil), cierre con animación inversa, foco activa/inactiva, traer al
  frente al clicar, arrastre por barra de título. **Efecto de apertura/cierre:
  zoom sólido desde el icono** (280ms apertura / 240ms cierre), ganó a los
  rectángulos Win 3.1 en PC y móvil.

## Decisiones abiertas

- (ninguna — diseño y comportamiento base validados; queda la construcción
  real en Astro, ver "Pendiente para la web real")

## Pendiente para la web real (fase de construcción)

- Portar el stack al proyecto Astro (borrar la landing antigua, conservar
  `site.ts`, deploy y assets).
- Contenido real de las 4 ventanas + reescritura de copys en el tono acordado.
- Rutas por hash (`/#proyectos`) con contenido en el HTML para SEO y enlaces
  compartibles.
- Barra de tareas con ventanas abiertas.
- Cursor "mano" pixel para clicables.
- `prefers-reduced-motion` (política ya definida).
- Fallback del tearing para Safari.
- Dithering de imágenes en build (el usuario adapta las imágenes).
- Comprobación de compilación del shader con aviso en desarrollo.

## Brief para encargar ilustraciones (imágenes de proyectos)

Estilo: **ilustración 1-bit con dithering** (referencias: *Return of the Obra
Dinn*, Macintosh clásico).

- Dos colores exactos: tinta `#16130d` y papel `#f3ecd9`.
- Trabajar y entregar a resolución baja real (~200–320 px de ancho), sin
  antialiasing. El escalado a píxel gordo lo hace la web.
- Dithering ordenado (Bayer) mejor que Floyd–Steinberg para encargo manual.
- El texto de los diagramas nunca se ditheriza: rótulos grandes en tinta plana.
- Alternativa de pipeline: pedir línea limpia de alto contraste sin dithering y
  entramar automáticamente en build (consistencia y regenerable si cambia la
  paleta). Recomendado para diagramas técnicos.

## Registro de rondas

| Ronda | Pregunta | Resultado |
| --- | --- | --- |
| 1 | Dominante de color: azul noche vs verde | **B — verde saturado** |
| 2 | Carácter del CRT: banda de rodadura + tearing | **cada 10s, velocidad 90, tearing real 30, banda 55, sin parada** |
| 3 | Geometría del tubo: curvatura + sombra de marco | **base 10, curvatura 35, sombra 56** + zona segura con fondo curvado en canvas |
| 4 | Marco físico del monitor | **grosor 30px, plástico moteado procedural (grano 0.34), filo de luz, pantalla hundida, LED verde** |
| 5 | Cursor pixel + pantalla de arranque + dithering 1-bit | **cursor validado; arranque a 4s; dithering validado (imágenes las adapta el usuario)** |
| 6 | Responsive móvil | **mismo stack sin marco físico; ventanas flotantes adaptadas, nunca pantalla completa** |
| 7 | Efecto de apertura/cierre de ventanas: zoom vs rectángulos | **zoom sólido desde el icono, en PC y móvil** |
