"use client";
import { useCallback,useEffect,useState } from "react";
import AdminShell from "../shared/AdminShell";
import { AiNotice,aiFetch,field,panel,primary,secondary,postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";

type Thread={id:string;order_id:string;customer_id:string;shipper_id:string|null;status:string;is_escalated:boolean};
type Message={id:string;sender_role:string;body:string;created_at:string};
export default function AiSupport(){
 const {role,storeId,storeQuery,storePicker,ready}=useAiScope();
 const [items,setItems]=useState<Thread[]>([]);
 const [orderId,setOrderId]=useState("");const [selected,setSelected]=useState("");
 const [lines,setLines]=useState<Message[]>([]);const [text,setText]=useState("");
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{if(!ready)return;try{const result=await aiFetch<{items:Thread[]}>(`/api/support/threads${storeQuery}`);setItems(result.items);setError("");}catch(e){setError(e instanceof Error?e.message:"Không thể tải hội thoại");}},[ready,storeQuery]);
 const loadMessages=useCallback(async(id:string)=>{if(!id)return;try{const value=await aiFetch<{items:Message[]}>(`/api/support/threads/${id}/messages${storeQuery}`);setLines(value.items);}catch(e){setError(e instanceof Error?e.message:"Không tải được tin nhắn");}},[storeQuery]);
 useEffect(()=>{void load();},[load]);useEffect(()=>{void loadMessages(selected);},[loadMessages,selected]);useEffect(()=>{if(!selected)return;const tick=window.setInterval(()=>{if(document.visibilityState==="visible")void loadMessages(selected);},10000);return()=>window.clearInterval(tick);},[selected,loadMessages]);
 const create=async()=>{setBusy(true);try{const value=await aiFetch<Thread>("/api/support/threads",postJson({orderId,storeId:storeId||undefined}));setSelected(value.id);setOrderId("");await load();}catch(e){setError(e instanceof Error?e.message:"Không tạo được hội thoại");}finally{setBusy(false);}};
 const send=async()=>{if(!selected||!text.trim())return;setBusy(true);try{await aiFetch(`/api/support/threads/${selected}/messages`,postJson({body:text,storeId:storeId||undefined}));setText("");await loadMessages(selected);}catch(e){setError(e instanceof Error?e.message:"Không gửi được tin nhắn");}finally{setBusy(false);}};
 const escalate=async()=>{setBusy(true);try{await aiFetch(`/api/support/threads/${selected}/escalate`,postJson({storeId:storeId||undefined}));await load();}catch(e){setError(e instanceof Error?e.message:"Không chuyển cấp được");}finally{setBusy(false);}};
 return <AdminShell title="Liên lạc theo đơn hàng" description="Trao đổi giữa Customer, Shipper và cửa hàng; phân quyền theo đơn thực tế.">
 {storePicker}{error?<AiNotice kind="error">{error}</AiNotice>:null}
 {role!=="admin"?<section className={panel}><h2 className="mb-2 font-semibold">Mở trao đổi theo đơn</h2><div className="flex flex-wrap gap-2"><input className={`${field} flex-1`} value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="Mã UUID đơn hàng"/><button className={primary} disabled={busy||!orderId} onClick={()=>void create()}>Mở hội thoại</button></div></section>:null}
 <div className="grid gap-4 lg:grid-cols-[290px_1fr]"><section className={panel}><h2 className="mb-3 font-bold">Hội thoại ({items.length})</h2><div className="max-h-[60vh] space-y-2 overflow-auto">{items.map(t=><button key={t.id} onClick={()=>setSelected(t.id)} className={`w-full rounded-xl border p-3 text-left text-sm ${selected===t.id?"border-emerald-500 bg-emerald-50":"border-slate-100"}`}><span className="block font-semibold">Đơn {t.order_id.slice(0,8)}</span><span className="text-slate-500">{t.is_escalated?"Đã chuyển cấp · ":""}{t.status}</span></button>)}</div></section>
 <section className={panel}><h2 className="mb-3 font-bold">Tin nhắn</h2>{selected?<><div aria-live="polite" className="min-h-64 max-h-[50vh] space-y-2 overflow-auto">{lines.map(line=><article key={line.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="mb-1 font-semibold text-emerald-800">{line.sender_role} · {new Date(line.created_at).toLocaleString("vi-VN")}</p><p className="whitespace-pre-wrap">{line.body}</p></article>)}</div><div className="mt-3 flex gap-2"><input className={`${field} flex-1`} value={text} maxLength={2000} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send();}} placeholder="Nội dung trao đổi"/><button className={primary} disabled={busy||!text.trim()} onClick={()=>void send()}>Gửi</button></div>{role==="manager"?<button className={`${secondary} mt-3`} disabled={busy} onClick={()=>void escalate()}>Chuyển cấp lên Admin</button>:null}</>:<p className="text-sm text-slate-500">Chọn một cuộc hội thoại.</p>}</section></div>
 </AdminShell>;
}
