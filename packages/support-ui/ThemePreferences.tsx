"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
const STORAGE_KEY = "greenplus.theme.v1";

export function normalizeTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

function applyTheme(value: ThemePreference) {
  const dark = value === "dark" || (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.gpTheme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Shared preference UI for every GreenPlus web portal.
 * The theme is a local appearance preference only. It never touches auth,
 * cookies, server data, or creates a cross-tenant identifier.
 */
function preferenceSnapshot(): ThemePreference {
  try { return normalizeTheme(localStorage.getItem(STORAGE_KEY)); }
  catch { return "system"; }
}
function subscribePreference(onChange: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", storage);
  window.addEventListener("greenplus-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener("greenplus-theme-change", onChange);
  };
}
const serverPreference = (): ThemePreference => "system";

export default function ThemePreferences() {
  const preference = useSyncExternalStore(subscribePreference, preferenceSnapshot, serverPreference);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    applyTheme(preference);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => { if (preference === "system") applyTheme(preference); };
    media.addEventListener("change", onSchemeChange);
    return () => media.removeEventListener("change", onSchemeChange);
  }, [preference]);

  function choose(next: ThemePreference) {
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* local storage disabled */ }
    window.dispatchEvent(new Event("greenplus-theme-change"));
    applyTheme(next);
    setExpanded(false);
  }

  return <div className="gp-theme-switcher" data-gp-theme-control>
    <button className="gp-theme-trigger" type="button" aria-label="Tùy chọn giao diện" aria-haspopup="true"
      aria-expanded={expanded} onClick={() => setExpanded(!expanded)} title="Giao diện sáng/tối">
      <span aria-hidden="true">◐</span><span className="gp-theme-trigger-caption">Giao diện</span>
    </button>
    {expanded ? <div role="group" aria-label="Chọn chế độ giao diện" className="gp-theme-options">
      {([ ["light", "Sáng"], ["dark", "Tối"], ["system", "Theo thiết bị"] ] as const).map(([value, label]) =>
        <button key={value} type="button" aria-pressed={preference === value} onClick={() => choose(value)}>{label}</button>)}
    </div> : null}
  </div>;
}
