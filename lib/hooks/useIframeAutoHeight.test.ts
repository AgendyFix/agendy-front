// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useIframeAutoHeight } from "./useIframeAutoHeight";

const SRC = "https://us-data.agendyfix.com/embed/dashboard/abc";
const ORIGIN = "https://us-data.agendyfix.com";

function setup() {
  const hook = renderHook(() => useIframeAutoHeight(SRC, 700));
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  hook.result.current.iframeRef.current = iframe;
  const frameWindow = iframe.contentWindow as Window;

  const dispatch = (data: unknown, { origin = ORIGIN, source = frameWindow as MessageEventSource | null } = {}) =>
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data, origin, source }));
    });

  return { ...hook, frameWindow, dispatch };
}

describe("useIframeAutoHeight", () => {
  it("arranca con la altura de fallback", () => {
    const { result } = setup();
    expect(result.current.height).toBe(700);
  });

  it("toma la altura que reporta el iframe", () => {
    const { result, dispatch } = setup();
    dispatch("[iFrameSizer]agendy-autoheight:1570:718:mutationObserver");
    expect(result.current.height).toBe(1570);
  });

  it("nunca baja de la altura de fallback", () => {
    const { result, dispatch } = setup();
    dispatch("[iFrameSizer]agendy-autoheight:300:718:init");
    expect(result.current.height).toBe(700);
  });

  it("ignora mensajes de otro origen, de otra ventana o de otro iframe", () => {
    const { result, dispatch } = setup();
    dispatch("[iFrameSizer]agendy-autoheight:1570:718:init", { origin: "https://evil.example" });
    dispatch("[iFrameSizer]agendy-autoheight:1570:718:init", { source: window });
    dispatch("[iFrameSizer]otro-frame:1570:718:init");
    expect(result.current.height).toBe(700);
  });

  it("ignora los mensajes que no son de tamaño (scrollTo trae una coordenada, no una altura)", () => {
    const { result, dispatch } = setup();
    dispatch("[iFrameSizer]agendy-autoheight:2400:0:scrollTo");
    expect(result.current.height).toBe(700);
  });

  it("reenvía el init cuando el script hijo avisa que está listo", () => {
    const { frameWindow, dispatch } = setup();
    const postMessage = vi.spyOn(frameWindow, "postMessage").mockImplementation(() => {});

    dispatch("[iFrameResizerChild]Ready");

    expect(postMessage).toHaveBeenCalledWith(expect.stringMatching(/^\[iFrameSizer\]agendy-autoheight:/), ORIGIN);
  });
});
