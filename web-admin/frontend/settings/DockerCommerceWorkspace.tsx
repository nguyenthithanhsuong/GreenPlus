"use client";
import {useEffect, useState} from "react";
import Link from "next/link";
import DockerCommerceInspector from "./DockerCommerceInspector";

type Store={store_id:string;name:string;tier:string};
/** Main Admin Orders/Inventory pages switch to this separate Docker sandbox only. */
export default function DockerCommerceWorkspace({kind}:{kind:"inventory"|"orders"}) {
 const [stores,setStores]=useState<Store[]>([]);
 const [storeId,setStoreId]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/tenant-demo",{cache:"no-store",signal:controller.signal})
   .then(async response=>{const value=await response.json();if(!response.ok)throw new Error(value.error||"Không thể tải cửa hàng");return value;})
   .then((value:{items?:Store[]})=>{
    const next=Array.isArray(value.items)?value.items:[];
    setStores(next);setStoreId(current=>next.some(row=>row.store_id===current)?current:next[0]?.store_id??"");
   })
   .catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Docker không khả dụng");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[]);
 return <main className="mx-auto max-w-5xl space-y-5 p-6 text-slate-800">
  <div className="flex flex-wrap items-center justify-between"><div><h1 className="text-2xl font-semibold">{kind==="inventory"?"Kho hàng":"Đơn hàng"}</h1><p className="text-sm text-emerald-700">Docker Local — Sandbox</p></div><Link href="/settings" className="text-sm text-emerald-700 underline">Nguồn dữ liệu</Link></div>
  {loading&&<p>Đang tải cửa hàng Docker...</p>}
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  {!loading&&!error&&!stores.length&&<p>Chưa có tenant demo. <Link href="/settings/tenant-demo" className="underline">Tạo thử nghiệm</Link></p>}
  {stores.length>0&&<label className="block max-w-md text-sm">Cửa hàng Docker<select className="mt-1 w-full rounded border p-2" value={storeId} onChange={e=>setStoreId(e.target.value)}>{stores.map(row=><option key={row.store_id} value={row.store_id}>{row.name} ({row.tier})</option>)}</select></label>}
  {storeId&&<DockerCommerceInspector key={`${storeId}:${kind}`} storeId={storeId} initialTab={kind}/>}
 </main>;
}
