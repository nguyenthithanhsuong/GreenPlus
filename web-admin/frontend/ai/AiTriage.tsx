"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "../shared/AdminShell";
import { AiNotice,aiFetch,field,panel,primary,secondary,postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";

type Triage={complaint_id:string;category:string;priority:string;confidence:number;model_version:string;reviewed_at:string|null};
type ComplaintChoice = { complaint_id: string; description: string; type: string; status: string };
export default function AiTriage({ embedded = false, complaints = [] }: { embedded?: boolean; complaints?: ComplaintChoice[] }) {
  const {role,storeId,storeQuery,storePicker,ready}=useAiScope();
  const [complaintId,setComplaintId]=useState("");
  const [items,setItems]=useState<Triage[]>([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const reload=useCallback(async()=>{try{setItems((await aiFetch<{items:Triage[]}>(`/api/ai/triage${storeQuery}`)).items);setError("");}catch(e){setError(e instanceof Error?e.message:"Không tải được phân loại");}},[storeQuery]);
  useEffect(()=>{if(ready)void reload();},[ready,reload]);
  const run=async()=>{if(!complaintId)return;setBusy(true);try{await aiFetch("/api/ai/triage",postJson({storeId:storeId||undefined,complaintId}));setComplaintId("");await reload();}catch(e){setError(e instanceof Error?e.message:"Không phân tích được khiếu nại");}finally{setBusy(false);}};
  useEffect(() => {
    const onRefresh = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("greenplus:data-updated", onRefresh);
    return () => window.removeEventListener("greenplus:data-updated", onRefresh);
  }, [reload]);
  const content = <div className="space-y-4">
    {!embedded && storePicker}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-bold text-slate-900">Phân loại & ưu tiên bằng AI</h2><p className="text-sm text-slate-500">Nhãn gợi ý, không tự thay đổi trạng thái khiếu nại.</p></div>
      {!embedded && <button type="button" className={secondary} onClick={()=>void reload()} disabled={busy}>Làm mới phân tích</button>}
    </div>
    {error?<AiNotice kind="error">{error}</AiNotice>:null}
    {role==="manager"?<section className={panel}>
      <label htmlFor="ai-complaint-choice" className="mb-2 block text-sm font-semibold text-slate-700">Khiếu nại cần phân tích</label>
      {complaints.length ? <select id="ai-complaint-choice" className={field} value={complaintId} onChange={e=>setComplaintId(e.target.value)}>
        <option value="">Chọn khiếu nại từ danh sách</option>
        {complaints.map(item=><option key={item.complaint_id} value={item.complaint_id}>{item.type} · {item.description.slice(0,90)} ({item.status})</option>)}
      </select> : embedded ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Không có khiếu nại trong cửa hàng để phân loại. Hãy kiểm tra tab Danh sách khiếu nại.</p> : <input id="ai-complaint-choice" className={field} placeholder="Mã khiếu nại" value={complaintId} onChange={e=>setComplaintId(e.target.value)}/>}
      <button disabled={busy||!complaintId} className={`${primary} mt-3`} onClick={()=>void run()}>Phân tích khiếu nại</button>
    </section>:null}
    <section className={panel}><h3 className="mb-3 font-bold">Kết quả phân loại ({items.length})</h3><div className="space-y-3">
      {items.map(item=>{const choice=complaints.find(c=>c.complaint_id===item.complaint_id);return <article key={item.complaint_id} className="rounded-xl border border-slate-100 p-4">
        <p className="font-semibold text-slate-900">{choice?.type ?? "Khiếu nại"} · {item.category} · {item.priority}</p>
        <p className="mt-1 text-sm text-slate-600">{choice?.description.slice(0,140) ?? "Phân loại theo cửa hàng"}</p>
        <p className="mt-2 text-xs text-slate-500">Độ tin cậy {Math.round(item.confidence*100)}% · {item.model_version}</p>
      </article>;})}
      {!items.length?<p className="text-sm text-slate-500">Chưa có nhãn phân loại. Có thể phân tích một khiếu nại trong danh sách để bắt đầu.</p>:null}
    </div></section>
  </div>;
  return embedded ? content : <AdminShell title="Khiếu nại · AI hỗ trợ" description="Gợi ý phân loại để nhân viên quyết định, không tự động duyệt hay từ chối.">{content}</AdminShell>;
}
