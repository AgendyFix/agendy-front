// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useIframeAutoHeight } from "./useIframeAutoHeight";

const SRC = "https://us-data.agendyfix.com/embed/dashboard/abc";
const ORIGIN = "https://us-data.agendyfix.com";

const dispatch = (data: unknown, origin = ORIGIN) =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, origin }));
  });

describe("useIframeAutoHeight", () => {
  it("arranca con la altura de fallback", () => {
    const { result } = renderHook(() => useIframeAutoHeight(SRC, 700));
    expect(result.current.height).toBe(700);
  });

  it("toma la altura que reporta el iframe", () => {
    const { result } = renderHook(() => useIframeAutoHeight(SRC, 700));
    dispatch("[iFrameSizer]agendy-autoheight:1570:718:mutationObserver");
    expect(result.current.height).toBe(1570);
  });

  it("nunca baja de la altura de fallback", () => {
    const { result } = renderHook(() => useIframeAutoHeight(SRC, 700));
    dispatch("[iFrameSizer]agendy-autoheight:300:718:init");
    expect(result.current.height).toBe(700);
  });

  it("ignora mensajes de otros orígenes o de otro iframe", () => {
    const { result } = renderHook(() => useIframeAutoHeight(SRC, 700));
    dispatch("[iFrameSizer]agendy-autoheight:1570:718:init", "https://evil.example");
    dispatch("[iFrameSizer]otro-frame:1570:718:init");
    expect(result.current.height).toBe(700);
  });

  it("reenvía el init cuando el script hijo avisa que está listo", () => {
    const { result } = renderHook(() => useIframeAutoHeight(SRC, 700));
    const postMessage = vi.fn();
    Object.assign(result.current.iframeRef, { current: { contentWindow: { postMessage } } });

    dispatch("[iFrameResizerChild]Ready");

    expect(postMessage).toHaveBeenCalledWith(expect.stringMatching(/^\[iFrameSizer\]agendy-autoheight:/), ORIGIN);
  });
});
