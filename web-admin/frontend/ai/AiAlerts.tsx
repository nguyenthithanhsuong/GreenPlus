"use client";
import { useCallback,useEffect,useState } from "react";
import AdminShell from "../shared/AdminShell";
import { AiNotice,aiFetch,panel,secondary } from "./ui";
import { useAiScope } from "./use-ai-scope";

type Alert={id:string;type:string;severity:string;status:string;product_id:string;batch_id:string|null;days_to_expiry:number|null;predicted_stockout_date:string|null;created_at:string};
export default function AiAlerts({ embedded = false }: { embedded?: boolean }) {
  const {role,storeId,storeQuery,storePicker,ready}=useAiScope();
  const [items,setItems]=useState<Alert[]>([]);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  const reload=useCallback(async()=>{try{setItems((await aiFetch<{items:Alert[]}>(`/api/ai/alerts${storeQuery}`)).items);setError("");}catch(e){setError(e instanceof Error?e.message:"Không tải được cảnh báo");}},[storeQuery]);
  useEffect(()=>{if(ready)void reload();},[reload,ready]);
  const acknowledge=async(id:string)=>{setBusy(true);try{await aiFetch("/api/ai/alerts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeId:storeId||undefined,alertId:id})});await reload();}catch(e){setError(e instanceof Error?e.message:"Cập nhật thất bại");}finally{setBusy(false);}};
  const content = <>{storePicker}{error?<AiNotice kind="error">{error}</AiNotice>:null}<section className={panel}><div className="space-y-3">{items.map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><p className="font-semibold">{item.type} · {item.severity}</p><p className="text-sm text-slate-500">Sản phẩm {item.product_id.slice(0,8)} · Lô {item.batch_id?.slice(0,8)??"Chung"}</p><p className="text-xs text-slate-500">Hạn còn {item.days_to_expiry??"Không xác định"} ngày · Dự báo hết hàng {item.predicted_stockout_date??"Chưa đủ dữ liệu"}</p></div><div className="flex items-center gap-3"><span className="text-sm text-slate-500">{item.status}</span>{role==="manager"&&item.status==="open"?<button disabled={busy} className={secondary} onClick={()=>void acknowledge(item.id)}>Đã xem</button>:null}</div></article>)}{!items.length?<p className="text-slate-500">Chưa có cảnh báo nào.</p>:null}</div></section></>;
  return embedded ? content : <AdminShell title="Cảnh báo tồn kho" description="Theo dõi các lô cận hạn, tồn thấp và tồn dư.">{content}</AdminShell>;
}
