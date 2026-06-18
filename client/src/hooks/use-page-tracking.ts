import { useEffect } from "react";
import { useLocation } from "wouter";

function getDeviceType(): "mobile" | "desktop" | "tablet" {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getSessionId(): string {
  let id = localStorage.getItem("liloscandle_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("liloscandle_session", id);
  }
  return id;
}

function normalizeReferrer(ref: string): string {
  if (!ref) return "";
  try {
    const u = new URL(ref);
    return u.hostname;
  } catch {
    return ref.slice(0, 100);
  }
}

export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location,
        sessionId: getSessionId(),
        deviceType: getDeviceType(),
        referrer: normalizeReferrer(document.referrer),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [location]);
}
