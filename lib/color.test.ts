import { describe, it, expect } from "vitest";
import { pickTextOn } from "./color";

describe("pickTextOn", () => {
  it("usa texto oscuro sobre colores claros", () => {
    expect(pickTextOn("#F5F3F7")).toBe("#111111");
    expect(pickTextOn("#FFB020")).toBe("#111111");
    expect(pickTextOn("#00D68F")).toBe("#111111");
    expect(pickTextOn("#EE8545")).toBe("#111111");
  });
  it("usa texto claro sobre colores oscuros", () => {
    expect(pickTextOn("#000000")).toBe("#FFFFFF");
    expect(pickTextOn("#1E1E2E")).toBe("#FFFFFF");
    expect(pickTextOn("#E11D48")).toBe("#FFFFFF");
  });
  it("acepta minúsculas y cae a texto claro si el hex es inválido", () => {
    expect(pickTextOn("#ffffff")).toBe("#111111");
    expect(pickTextOn("rojo")).toBe("#FFFFFF");
  });
});
