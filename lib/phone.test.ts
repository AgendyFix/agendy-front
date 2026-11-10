import { describe, it, expect } from "vitest";
import { whatsappUrl } from "./phone";

describe("whatsappUrl", () => {
  it("10 dígitos sin lada → México", () => {
    expect(whatsappUrl("999 123 4567")).toBe("https://wa.me/529991234567");
  });
  it("respeta la lada si ya viene", () => {
    expect(whatsappUrl("+52 999 123 4567")).toBe("https://wa.me/529991234567");
    expect(whatsappUrl("529991234567")).toBe("https://wa.me/529991234567");
    expect(whatsappUrl("+1 (415) 555-0100")).toBe("https://wa.me/14155550100");
    expect(whatsappUrl("+34 612345678")).toBe("https://wa.me/34612345678");
  });
  it("formato viejo 521 de celular MX", () => {
    expect(whatsappUrl("5219991234567")).toBe("https://wa.me/529991234567");
  });
  it("formas desconocidas → null (cae a tel:)", () => {
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl("")).toBeNull();
    expect(whatsappUrl("9991234")).toBeNull();
    expect(whatsappUrl("044 999 123 4567")).toBeNull();
    expect(whatsappUrl("01 999 123 4567")).toBeNull();
    expect(whatsappUrl("999 123 4567 ext 2")).toBeNull();
  });
});
