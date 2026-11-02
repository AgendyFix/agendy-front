// ============================================
// POSTCSS: FALLBACK DE OPACIDAD PARA SAFARI < 16.2
// ============================================
// Tailwind v4 genera las clases con opacidad (bg-primary/10) así:
//   .x { background-color: var(--primary) }
//   @supports (color: color-mix(...)) { .x { background-color: color-mix(in oklab, var(--primary) 10%, transparent) } }
// En navegadores sin color-mix (Safari/iOS 15) queda el color sólido,
// y cosas como "bg-primary/10 text-primary" se vuelven ilegibles.
//
// Este plugin:
//   1. Expone los canales de cada variable oklch: --primary-ch: 0.72 0.15 50
//   2. Inserta antes de cada @supports un fallback oklch(var(--primary-ch) / 10%),
//      que Safari 15.4+ sí soporta. Los navegadores modernos siguen usando el @supports.

const OKLCH_VAR = /^oklch\(\s*([^/)]+?)\s*\)$/;
const COLOR_MIX = /^color-mix\(in oklab,\s*var\((--[\w-]+)\)\s*([\d.]+%),\s*transparent\)$/;

/** @type {import('postcss').PluginCreator} */
const colorMixFallback = () => ({
  postcssPlugin: "color-mix-fallback",
  OnceExit(root, { Rule }) {
    const channelVars = new Set();

    root.walkDecls(/^--/, (decl) => {
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

      // Sin minificar, Tailwind anida el @supports dentro de la regla: .x { color: …; @supports … { color: … } }
      atRule.each((node) => {
        const fallback = node.type === "decl" && toFallback(node);
        if (fallback) atRule.before(fallback);
      });

      // Minificado (build de producción) va aplanado: .x { … } @supports … { .x { … } }
      atRule.each((node) => {
        if (node.type !== "rule") return;
        const fallbacks = node.nodes.map((d) => d.type === "decl" && toFallback(d)).filter(Boolean);
        if (fallbacks.length) atRule.before(new Rule({ selector: node.selector, nodes: fallbacks }));
      });
    });
  },
});

colorMixFallback.postcss = true;

module.exports = colorMixFallback;
