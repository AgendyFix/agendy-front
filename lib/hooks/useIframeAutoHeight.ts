"use client";

// ============================================
// IFRAME AUTO HEIGHT (protocolo iframe-resizer v4)
// ============================================
// Los embeds de Metabase traen el script hijo de iframe-resizer v4.
// Al hacer el handshake, el iframe nos reporta la altura real de su contenido
// y lo dejamos crecer: así no hay scroll anidado (que en iOS se traba)
// y la página se recorre completa con un solo scroll.

import { useCallback, useEffect, useRef, useState } from "react";

const MSG_PREFIX = "[iFrameSizer]";
const FRAME_ID = "agendy-autoheight";
const CHILD_READY = "[iFrameResizerChild]Ready";
// En estos tipos el segundo campo no es una altura (scrollTo trae la coordenada Y).
const NON_RESIZE_TYPES = new Set(["scrollTo", "scrollToOffset", "close"]);

// Formato v4: id:bodyMarginV1:sizeWidth:log:interval:enablePublicMethods:autoResize:bodyMargin:
//             heightCalculationMethod:bodyBackground:bodyPadding:tolerance:inPageLinks:resizeFrom:
//             widthCalculationMethod:mouseEvents
const INIT_MESSAGE = `${MSG_PREFIX}${FRAME_ID}:8:false:false:32:true:true::bodyOffset:::0:false:parent:scroll:false`;

export function useIframeAutoHeight(src: string, fallbackHeight: number) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(fallbackHeight);

  const origin = src ? new URL(src).origin : null;

  const sendInit = useCallback(() => {
    if (origin) iframeRef.current?.contentWindow?.postMessage(INIT_MESSAGE, origin);
  }, [origin]);

  useEffect(() => {
    if (!origin) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== iframeRef.current?.contentWindow) return;
      if (typeof event.data !== "string") return;

      // El script hijo puede cargar después del onLoad del iframe: avisa cuando está listo.
      if (event.data === CHILD_READY) return sendInit();
      if (!event.data.startsWith(`${MSG_PREFIX}${FRAME_ID}:`)) return;

      const [, reportedHeight, , type] = event.data.slice(MSG_PREFIX.length).split(":");
      if (NON_RESIZE_TYPES.has(type)) return;

      const reported = Number(reportedHeight);
      if (reported > 0) setHeight(Math.max(reported, fallbackHeight));
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [origin, fallbackHeight, sendInit]);

  return { iframeRef, height, onLoad: sendInit };
}
