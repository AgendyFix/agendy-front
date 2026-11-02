import { describe, it, expect } from "vitest";
import postcss from "postcss";
import colorMixFallback from "./postcss-color-mix-fallback.cjs";

const run = async (css: string) => (await postcss([colorMixFallback()]).process(css, { from: undefined })).css;

const THEME = ":root{--primary:oklch(0.72 0.15 50)}";
const MIX = "color-mix(in oklab,var(--primary) 10%,transparent)";

describe("postcss color-mix-fallback", () => {
  it("expone los canales de las variables oklch", async () => {
    expect(await run(THEME)).toContain("--primary-ch:0.72 0.15 50");
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

  it("ignora variables que no son oklch y @supports que no son de color-mix", async () => {
    const css = ":root{--x:#fff}.bg{color:var(--x)}@supports (display:grid){.bg{color:color-mix(in oklab,var(--x) 10%,transparent)}}";
    expect(await run(css)).toBe(css);
  });
});
