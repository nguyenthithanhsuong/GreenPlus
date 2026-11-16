"use client";
import { useState } from "react";
import Link from "next/link";
import AdminShell from "../shared/AdminShell";
import { AiNotice,aiFetch,field,panel,primary } from "./ui";
type Result={items:{name:string;available:number;confidence:string;model_version:string;predicted_daily_units:number}[];notice:string;partial:boolean};
export default function AiDockerPreview(){
 const [storeId,setStoreId]=useState("");const [result,setResult]=useState<Result|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 const run=async()=>{setLoading(true);setError("");try{setResult(await aiFetch<Result>(`/api/ai/docker-preview?storeId=${encodeURIComponent(storeId)}`));}catch(e){setError(e instanceof Error?e.message:"Không đọc được Docker");}finally{setLoading(false);}};
 return <AdminShell title="AI Docker Three-Tier Sandbox" description="Dự báo xem trước; tách biệt hoàn toàn với dữ liệu production Supabase."><Link href="/ai" className="text-sm font-semibold text-emerald-700">← AI Dashboard</Link>{error?<AiNotice kind="error">{error}</AiNotice>:null}<section className={panel}><label className="block text-sm font-semibold">Store ID từ Demo Catalog<input className={`${field} mt-2`} value={storeId} onChange={e=>setStoreId(e.target.value)} placeholder="UUID cửa hàng trong Docker"/></label><button className={`${primary} mt-3`} disabled={loading||!storeId} onClick={()=>void run()}>Dự báo thử nghiệm</button></section>{result?<section className={panel}><AiNotice>{result.notice}</AiNotice><div className="mt-4 space-y-2">{result.items.map((item,index)=><div key={index} className="flex justify-between rounded-lg border border-slate-100 p-3 text-sm"><span>{item.name}</span><span>Tồn {item.available} · {item.confidence} · {item.model_version}</span></div>)}</div>{result.partial?<AiNotice kind="error">Chỉ đọc tối đa 200 bản ghi Docker.</AiNotice>:null}</section>:null}</AdminShell>;
}
