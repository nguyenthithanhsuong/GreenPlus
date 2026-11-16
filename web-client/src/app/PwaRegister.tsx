"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type BrowserNavigator = Navigator & { standalone?: boolean };

// Browser flags are external state, not state that needs initializing inside an effect.
// Server snapshots keep the initial HTML identical during React hydration.
const subscribeDisplayMode = (notify: () => void) => {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const getInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as BrowserNavigator).standalone);
const getServerInstalled = () => true;

const subscribeOnline = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
};
const getOnline = () => navigator.onLine;
const getServerOnline = () => true;

// The user agent does not change during a page session.
const subscribeStatic = () => () => {};
const getMobileBrowser = () => /Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
const getServerMobileBrowser = () => false;

/** A small, nonblocking mobile affordance; no order, auth or private API data is cached. */
export default function PwaRegister() {
  const installPrompt = useRef<InstallPromptEvent | null>(null);
  const reloadAfterUpdate = useRef(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installedByEvent, setInstalledByEvent] = useState(false);
  const isInstalled = useSyncExternalStore(subscribeDisplayMode, getInstalled, getServerInstalled) || installedByEvent;
  const mobileBrowser = useSyncExternalStore(subscribeStatic, getMobileBrowser, getServerMobileBrowser);
  const online = useSyncExternalStore(subscribeOnline, getOnline, getServerOnline);
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [confirmInstall, setConfirmInstall] = useState(false);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      installPrompt.current = event as InstallPromptEvent;
      setCanInstall(true);
    };
    const handleInstalled = () => {
      installPrompt.current = null;
      setCanInstall(false);
      setConfirmInstall(false);
      setInstalledByEvent(true);
    };
    const onControllerChange = () => {
      if (reloadAfterUpdate.current) window.location.reload();
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    // Work with an already active worker as well as a newly installed update.
    // Never replace a running app in the middle of checkout or a delivery action.
    let cancelled = false;
    let currentRegistration: ServiceWorkerRegistration | null = null;
    const onVisible = () => {
      if (document.visibilityState === "visible" && currentRegistration) {
        void currentRegistration.update().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const register = async () => {
      if (
        process.env.NODE_ENV !== "production" ||
        !("serviceWorker" in navigator)
      ) return;
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;
        currentRegistration = registration;
        const checkWaiting = () => {
          if (registration.waiting && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        };
        checkWaiting();
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (installing) {
            installing.addEventListener("statechange", () => {
              if (!cancelled && installing.state === "installed") checkWaiting();
            });
          }
        });
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
        // An existing service worker may be stale despite a long-lived app tab.
        void registration.update().catch(() => undefined);
      } catch (error) {
        console.warn("[GreenPlus PWA] Service worker registration failed", error);
      }
    };
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const install = async () => {
    const event = installPrompt.current;
    if (!event) return;
    installPrompt.current = null;
    setCanInstall(false);
    try {
      await event.prompt();
      await event.userChoice;
    } catch (error) {
      console.warn("[GreenPlus PWA] Installation prompt failed", error);
    }
  };

  const update = async () => {
    if (!("serviceWorker" in navigator)) return;
    let registration: ServiceWorkerRegistration | undefined;
    try { registration = await navigator.serviceWorker.getRegistration("/"); }
    catch { return; }
    if (!registration?.waiting) return;
    reloadAfterUpdate.current = true;
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  if (!online) {
    return (
      <div role="status" aria-live="polite" className="fixed bottom-20 right-3 z-[9999] max-w-[calc(100vw-1.5rem)] rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg ring-1 ring-amber-300">
        Đang ngoại tuyến. Đăng nhập, đơn hàng và thanh toán cần mạng để cập nhật chính xác.
      </div>
    );
  }
  if (updateReady) {
    return (
      <div role="status" aria-live="polite" className="fixed bottom-20 right-3 z-[9999] max-w-[calc(100vw-1.5rem)] rounded-xl bg-white p-3 text-sm text-slate-900 shadow-lg ring-1 ring-emerald-200">
        <p className="mb-2 font-medium">Có phiên bản GreenPlus mới. Hãy hoàn thành thao tác đang thực hiện trước khi cập nhật.</p>
        <button type="button" onClick={() => void update()} className="rounded-lg bg-emerald-700 px-3 py-2 font-semibold text-white">Cập nhật ứng dụng</button>
      </div>
    );
  }
  if (isInstalled || dismissed || (!canInstall && !mobileBrowser)) return null;
  return (
    <div className="fixed bottom-20 right-3 z-[9999] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-emerald-200">
      {canInstall ? (
        <button type="button" onClick={() => setConfirmInstall(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" aria-label="Tải và cài GreenPlus thành ứng dụng"><span aria-hidden="true" className="text-lg leading-none">⬇</span> Cài GreenPlus</button>
      ) : (
        <a href="/install" className="rounded-lg px-2 py-2 text-sm font-semibold text-emerald-800">Hướng dẫn cài ứng dụng</a>
      )}
      <button type="button" onClick={() => setDismissed(true)} className="rounded-lg px-2 py-2 text-sm text-slate-500" aria-label="Ẩn lời nhắc cài ứng dụng">Đóng</button>
      {confirmInstall && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setConfirmInstall(false); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="greenplus-install-title" className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700" aria-hidden="true">⬇</div>
          <h2 id="greenplus-install-title" className="text-xl font-bold">Cài GreenPlus?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Thêm GreenPlus vào thiết bị để truy cập nhanh như một ứng dụng. Việc cài đặt sẽ do trình duyệt xác nhận.</p>
          <div className="mt-6 flex gap-3"><button type="button" onClick={() => setConfirmInstall(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Để sau</button><button type="button" onClick={() => { setConfirmInstall(false); void install(); }} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">Xác nhận cài</button></div>
        </div>
      </div>}
    </div>
  );
}
