import posthog from "posthog-js";

const isDev = process.env.NODE_ENV === "development";

function phReady(): boolean {
  return typeof window !== "undefined" && posthog.__loaded === true;
}

export function trackEvent(type: string, metadata?: Record<string, unknown>) {
  try {
    if (!phReady()) return;
    posthog.capture(type, metadata);
    if (isDev) console.debug("[PostHog]", type, metadata);
  } catch (err) {
    if (isDev) console.warn("[PostHog] capture failed:", type, err);
  }
}

export function getVariant(flag: string): string | undefined {
  try {
    if (!phReady()) return undefined;
    const value = posthog.getFeatureFlag(flag);
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

// UTM persistence
const UTM_KEY = "agendyfix_utm";
const FIRST_TOUCH_KEY = "agendyfix_first_touch";

export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const val = sp.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

export function persistUtm() {
  const utm = getUtmParams();
  if (Object.keys(utm).length > 0) {
    try {
      localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    } catch {}
  }
}

export function getPersistedUtm(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(UTM_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getFirstTouchUrl(): string {
  try {
    const stored = localStorage.getItem(FIRST_TOUCH_KEY);
    if (stored) return stored;
    const url = window.location.href;
    localStorage.setItem(FIRST_TOUCH_KEY, url);
    return url;
  } catch {
    return "";
  }
}

export const WA_NUMBER = "525667714084";
export const WA_URL = "https://wa.me/525667714084";

export function buildWaUrl(message: string): string {
  return `${WA_URL}?text=${encodeURIComponent(message)}`;
}

export function trackWaClick(location: string, extra?: Record<string, unknown>) {
  trackEvent("wa_click", { location, ...extra });
  trackEvent("conversion", { type: "whatsapp", location, ...extra });
}
