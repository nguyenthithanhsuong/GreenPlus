"use client";
import LiveSupportView from "../../../../../packages/support-ui/LiveSupportView";
import { selectedStoreId, STORE_CHANGE_EVENT } from "@/lib/stores/store-selection";
import { useSyncExternalStore } from "react";
const subscribe=(notify:()=>void)=>{
  window.addEventListener(STORE_CHANGE_EVENT,notify);
  return()=>window.removeEventListener(STORE_CHANGE_EVENT,notify);
};
export default function CustomerLiveSupport(){
  const storeId=useSyncExternalStore(subscribe,selectedStoreId,()=>null);
  return <main className="min-h-dvh bg-emerald-50 px-3 py-8 md:px-8"><div className="mx-auto max-w-7xl"><LiveSupportView key={storeId??"no-store"} storeId={storeId} ready={Boolean(storeId)}/></div></main>;
}
