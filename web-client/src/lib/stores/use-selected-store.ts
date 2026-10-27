"use client";

import { useEffect, useSyncExternalStore } from "react";
import { STORE_CHANGE_EVENT, selectedStoreId } from "./store-selection";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(STORE_CHANGE_EVENT, onStoreChange);
  // A change in a second tab must also refresh cart/orders in this tab.
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(STORE_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useSelectedStoreId() {
  return useSyncExternalStore(subscribe, selectedStoreId, () => null);
}

/** Reset transient screen data only when the user actually changes the store. */
export function useResetOnStoreChange(onReset: () => void) {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "greenplus:selected-store-v2") onReset();
    };
    window.addEventListener(STORE_CHANGE_EVENT, onReset);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STORE_CHANGE_EVENT, onReset);
      window.removeEventListener("storage", onStorage);
    };
  }, [onReset]);
}
