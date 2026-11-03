"use client";

import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaRegister() {
  const pending = useRef<InstallEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () =>
      setInstalled(
        displayMode.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    checkInstalled();
    displayMode.addEventListener("change", checkInstalled);
    const capture = (event: Event) => {
      event.preventDefault();
      pending.current = event as InstallEvent;
      setCanInstall(true);
    };
    const installed = () => {
      pending.current = null;
      setCanInstall(false);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);

    // Hydration can finish after the window 'load' event: do not miss registration.
    const register = () => {
      if (
        process.env.NODE_ENV !== "production" ||
        !("serviceWorker" in navigator)
      )
        return;
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.warn(
            "[GreenPlus PWA] Service worker registration failed",
            error,
          );
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      displayMode.removeEventListener("change", checkInstalled);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("load", register);
    };
  }, []);

  async function install() {
    const event = pending.current;
    if (!event) return;
    pending.current = null;
    setCanInstall(false);
    try {
      await event.prompt();
      await event.userChoice;
    } catch (error) {
      console.warn("[GreenPlus PWA] Installation prompt failed", error);
    }
  }

  if (installed) return null;
  if (!canInstall)
    return (
      <a
        href="/install"
        className="fixed bottom-20 right-3 z-[9999] rounded-full bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-md ring-1 ring-emerald-200"
      >
        Cài ứng dụng?
      </a>
    );
  return (
    <button
      type="button"
      onClick={() => void install()}
      aria-label="Cài GreenPlus thành ứng dụng"
      className="fixed bottom-20 right-3 z-[9999] rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
    >
      Cài GreenPlus
    </button>
  );
}
