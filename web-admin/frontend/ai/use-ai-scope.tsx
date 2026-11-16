"use client";
import { useEffect,useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { aiFetch,field } from "./ui";

export function useAiScope() {
  const role=useAuthStore((state)=>state.user?.role_name??state.session?.role_name)?.toLowerCase()??"";
  const [storeId,setStoreId]=useState("");
  const [stores,setStores]=useState<{store_id:string;name:string}[]>([]);
  useEffect(()=>{
    if(role!=="admin")return;
    let active=true;
    void aiFetch<{items?:{store_id:string;name:string}[]}>("/api/stores").then((data)=>{
      if(!active)return;
      const choices=data.items??[];setStores(choices);setStoreId(choices[0]?.store_id??"");
    }).catch(()=>{if(active)setStores([]);});
    return ()=>{active=false;};
  },[role]);
  const storeQuery=storeId?`?storeId=${encodeURIComponent(storeId)}`:"";
  const storePicker=role==="admin"?<label className="block text-sm font-medium text-slate-700">Cửa hàng
    <select className={`${field} mt-2`} value={storeId} onChange={(event)=>setStoreId(event.target.value)}>
      <option value="">Chọn cửa hàng</option>
      {stores.map((item)=><option key={item.store_id} value={item.store_id}>{item.name}</option>)}
    </select>
  </label>:null;
  return {role,storeId,storeQuery,storePicker,ready:role!=="admin"||Boolean(storeId)};
}
