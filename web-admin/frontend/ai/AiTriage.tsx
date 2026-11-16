"use client";
import { useCallback,useEffect,useState } from "react";
import AdminShell from "../shared/AdminShell";
import { AiNotice,aiFetch,field,panel,primary,postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";

type Triage={complaint_id:string;category:string;priority:string;confidence:number;model_version:string;reviewed_at:string|null};
export default function AiTriage() {
  const {role,storeId,storeQuery,storePicker,ready}=useAiScope();
  const [complaintId,setComplaintId]=useState("");const [items,setItems]=useState<Triage[]>([]);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  const reload=useCallback(async()=>{try{setItems((await aiFetch<{items:Triage[]}>(`/api/ai/triage${storeQuery}`)).items);setError("");}catch(e){setError(e instanceof Error?e.message:"Không tải được phân loại");}},[storeQuery]);
  useEffect(()=>{if(ready)void reload();},[ready,reload]);
  const run=async()=>{setBusy(true);try{await aiFetch("/api/ai/triage",postJson({storeId:storeId||undefined,complaintId}));setComplaintId("");await reload();}catch(e){setError(e instanceof Error?e.message:"Không phân tích được khiếu nại");}finally{setBusy(false);}};
  return <AdminShell title="Phân loại khiếu nại" description="Nhãn và độ ưu tiên đề xuất cần nhân viên xác nhận.">{storePicker}{error?<AiNotice kind="error">{error}</AiNotice>:null}{role==="manager"?<div className={panel}><div className="flex flex-wrap gap-2"><input className={`${field} flex-1`} placeholder="Mã khiếu nại" value={complaintId} onChange={e=>setComplaintId(e.target.value)}/><button disabled={busy||!complaintId} className={primary} onClick={()=>void run()}>Phân loại</button></div></div>:null}<div className={panel}><div className="space-y-3">{items.map(item=><div key={item.complaint_id} className="rounded-xl border border-slate-100 p-4"><p className="font-bold">{item.category} · {item.priority}</p><p className="mt-1 text-sm text-slate-500">{item.complaint_id} · {Math.round(item.confidence*100)}% · {item.model_version}</p></div>)}{!items.length?<p className="text-slate-500">Chưa có nhãn phân loại.</p>:null}</div></div></AdminShell>;
}
