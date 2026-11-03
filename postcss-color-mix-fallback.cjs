// ============================================
// POSTCSS: FALLBACKS DE COLOR PARA SAFARI 15.4 – 16.1
// ============================================
// Tailwind v4 genera las clases con opacidad (bg-primary/10) así:
//   .x { background-color: var(--primary) }
//   @supports (color: color-mix(...)) { .x { background-color: color-mix(in oklab, var(--primary) 10%, transparent) } }
// En navegadores sin color-mix (Safari/iOS 15) queda el color sólido,
// y cosas como "bg-primary/10 text-primary" se vuelven ilegibles.
// Para los colores de la paleta (@layer theme) Tailwind ya calcula un hex; el
// problema son solo nuestras variables de tema (:root / .dark), que resuelve en runtime.
//
// Este plugin:
//   1. Expone los canales de las variables oklch del tema: --primary-ch: 0.72 0.15 50
//   2. Inserta antes de cada @supports un fallback oklch(var(--primary-ch) / 10%),
//      que Safari 15.4+ sí soporta. Los navegadores modernos siguen usando el @supports.
//   3. Quita la interpolación "in oklab" de los degradados donde no se soporta.

const OKLCH_VAR = /^oklch\(\s*([^/)]+?)\s*\)$/;
const COLOR_MIX = /^color-mix\(in oklab,\s*var\((--[\w-]+)\)\s*([\d.]+%),\s*transparent\)$/;
const GRADIENT_INTERPOLATION = /^(.*?)\s+in\s+[a-z-]+(?:\s+[a-z]+\s+hue)?$/;
const GRADIENT_SUPPORTS = "(background-image: linear-gradient(in lab, red, red))";

const inThemeLayer = (node) => {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === "atrule" && p.name === "layer" && p.params === "theme") return true;
  }
  return false;
};

/** @type {import('postcss').PluginCreator} */
const colorMixFallback = () => ({
  postcssPlugin: "color-mix-fallback",
  OnceExit(root, { AtRule, Rule }) {
    const channelVars = new Set();

    root.walkDecls(/^--/, (decl) => {
      if (inThemeLayer(decl)) return;
      const match = decl.value.trim().match(OKLCH_VAR);
      if (!match) return;
      decl.cloneAfter({ prop: `${decl.prop}-ch`, value: match[1] });
      channelVars.add(decl.prop);
    });

    const toFallback = (decl) => {
      const match = decl.value.match(COLOR_MIX);
      if (!match || !channelVars.has(match[1])) return null;
      return decl.clone({ value: `oklch(var(${match[1]}-ch) / ${match[2]})` });
    };

    root.walkAtRules("supports", (atRule) => {
      if (!atRule.params.includes("color-mix")) return;

      atRule.each((node) => {
        if (node.type === "decl") {
          // Sin minificar, Tailwind anida el @supports dentro de la regla: .x { color: …; @supports … { color: … } }
          const fallback = toFallback(node);
          if (fallback) atRule.before(fallback);
        } else if (node.type === "rule") {
          // Minificado (build de producción) va aplanado: .x { … } @supports … { .x { … } }
          const fallbacks = node.nodes.map((d) => d.type === "decl" && toFallback(d)).filter(Boolean);
          if (fallbacks.length) atRule.before(new Rule({ selector: node.selector, nodes: fallbacks }));
        }
      });
    });

    // Degradados: Tailwind usa "--tw-gradient-position: to right in oklab". Safari < 16.2 no soporta
    // la interpolación "in <espacio>" y, al ir en una variable, invalida todo el background-image.
    // Fallback sin interpolación y la versión original dentro de un @supports.
    root.walkDecls("--tw-gradient-position", (decl) => {
      const match = decl.value.match(GRADIENT_INTERPOLATION);
      if (!match || decl.parent.type !== "rule") return;
      // La regla que insertamos abajo también se recorre: no volver a procesarla.
      if (decl.parent.parent?.type === "atrule" && decl.parent.parent.params === GRADIENT_SUPPORTS) return;

      const supported = new AtRule({ name: "supports", params: GRADIENT_SUPPORTS });
      supported.append(new Rule({ selector: decl.parent.selector, nodes: [decl.clone()] }));
      decl.parent.after(supported);
      decl.value = match[1];
    });
  },
});

colorMixFallback.postcss = true;

module.exports = colorMixFallback;
