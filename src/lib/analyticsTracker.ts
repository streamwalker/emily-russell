import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("er_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("er_session_id", sid);
  }
  return sid;
}

export function trackPageView(page: string) {
  const startTime = Date.now();
  const sessionId = getSessionId();

  // Fire and forget insert
  supabase.from("analytics_events").insert({
    event_type: "page_view",
    page,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    session_id: sessionId,
  }).then(() => {}).catch(() => {});

  // On page unload, log duration using fetch + keepalive (headers instead of query-string key)
  const handleUnload = () => {
    const duration_ms = Date.now() - startTime;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_events`;
    const body = JSON.stringify({
      event_type: "page_view_duration",
      page,
      session_id: sessionId,
      duration_ms,
    });
    fetch(url, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Prefer": "return=minimal",
      },
      body,
    }).catch(() => {});
  };

  window.addEventListener("beforeunload", handleUnload, { once: true });

  return () => {
    window.removeEventListener("beforeunload", handleUnload);
  };
}

export function trackLinkClick(label: string, target: string) {
  const sessionId = getSessionId();
  supabase.from("analytics_events").insert({
    event_type: "link_click",
    label,
    target,
    page: window.location.pathname,
    session_id: sessionId,
  }).then(() => {}).catch(() => {});
}
