import { describe, it, expect } from "vitest";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import colorMixFallback from "./postcss-color-mix-fallback.cjs";

const run = async (css: string) => (await postcss([colorMixFallback()]).process(css, { from: undefined })).css;

const THEME = ":root{--primary:oklch(0.72 0.15 50)}";
const MIX = "color-mix(in oklab,var(--primary) 10%,transparent)";

describe("postcss color-mix-fallback", () => {
  it("expone los canales de las variables oklch del tema", async () => {
    expect(await run(THEME)).toContain("--primary-ch:0.72 0.15 50");
  });

  it("no genera canales para la paleta de Tailwind (@layer theme ya trae su fallback hex)", async () => {
    expect(await run("@layer theme{:root{--color-blue-50:oklch(0.97 0.014 254.604)}}")).not.toContain("-ch");
  });

  it("inserta el fallback oklch en la forma anidada (sin minificar)", async () => {
    const out = await run(`${THEME}.bg{background-color:var(--primary);@supports (color:color-mix(in lab, red, red)){background-color:${MIX}}}`);
    expect(out).toContain("background-color:var(--primary);background-color:oklch(var(--primary-ch) / 10%);@supports");
  });

  it("en la forma aplanada no toca la regla fusionada y agrega una regla propia antes del @supports", async () => {
    const out = await run(`${THEME}.a,.bg{background-color:var(--primary)}@supports (color:color-mix(in lab, red, red)){.bg{background-color:${MIX}}}`);
    expect(out).toContain(".a,.bg{background-color:var(--primary)}");
    expect(out).toMatch(/\.bg\s*\{\s*background-color:\s*oklch\(var\(--primary-ch\) \/ 10%\)\s*\}\s*@supports/);
  });

  it("cubre el color-mix anidado de las sombras (shadow-primary/25)", async () => {
    const shadow = "color-mix(in oklab, color-mix(in oklab, var(--primary) 25%, transparent) var(--tw-shadow-alpha), transparent)";
    const out = await run(`${THEME}.s{--tw-shadow-color:var(--primary)}@supports (color:color-mix(in lab, red, red)){.s{--tw-shadow-color:${shadow}}}`);
    expect(out).toMatch(/\.s\s*\{\s*--tw-shadow-color:\s*oklch\(var\(--primary-ch\) \/ 25%\)\s*\}\s*@supports/);
  });

  it("ignora variables que no son oklch y @supports que no son de color-mix", async () => {
    const css = ":root{--x:#fff}.bg{color:var(--x)}@supports (display:grid){.bg{color:color-mix(in oklab,var(--x) 10%,transparent)}}";
    expect(await run(css)).toBe(css);
  });
});

// Integración: si Tailwind cambia su salida, estos tests lo detectan en vez de fallar en silencio.
describe.each([
  ["sin minificar", false],
  ["minificado (build de producción)", { minify: true }],
] as const)("postcss color-mix-fallback con Tailwind real, %s", (_, optimize) => {
  const INPUT = `
    @import "tailwindcss" source(none);
    @source inline("bg-primary/10 bg-blue-50/50 shadow-lg shadow-primary/25");
    @theme inline { --color-primary: var(--primary); }
    :root { --primary: oklch(0.72 0.15 50); }
  `;
  const build = async () =>
    (
      await postcss([tailwind({ optimize }), colorMixFallback()]).process(INPUT, {
        from: path.join(__dirname, "app/fixture.css"),
      })
    ).css.replace(/\s+/g, " ");

  it("bg-primary/10 recibe el fallback oklch antes del @supports", async () => {
    expect(await build()).toMatch(/background-color: ?oklch\(var\(--primary-ch\) \/ 10%\);?\s*\}?\s*@supports/);
  });

  it("shadow-primary/25 recibe el fallback oklch", async () => {
    expect(await build()).toMatch(/--tw-shadow-color: ?oklch\(var\(--primary-ch\) \/ 25%\)/);
  });

  it("bg-blue-50/50 conserva el fallback que calcula Tailwind", async () => {
    const css = await build();
    // El hex lo calcula Tailwind al optimizar; sin minificar deja el color-mix con el valor literal.
    if (optimize) expect(css).toMatch(/\.bg-blue-50\\\/50\{background-color:#[0-9a-f]{8}\}/i);
    expect(css).not.toContain("--color-blue-50-ch");
    expect(css).not.toMatch(/oklch\(var\(--color-blue-50/);
  });
});
