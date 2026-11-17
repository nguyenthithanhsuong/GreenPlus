"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrainCircuit,MessageCircle,Send } from "lucide-react";
import { selectedStoreId, STORE_CHANGE_EVENT } from "@/lib/stores/store-selection";

type ChatLine={role:"user"|"assistant";text:string;source?:string;confidence?:number};
export default function CustomerAiChat(){
 const [question,setQuestion]=useState("");const [lines,setLines]=useState<ChatLine[]>([]);
 const [conversationId,setConversationId]=useState("");const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const storeEpoch=useRef(0);
 useEffect(()=>{const reset=()=>{storeEpoch.current++;setConversationId("");setLines([]);setError("");};window.addEventListener(STORE_CHANGE_EVENT,reset);return()=>window.removeEventListener(STORE_CHANGE_EVENT,reset);},[]);
 const send=async()=>{const text=question.trim();if(!text||loading)return;
 const requestStore=selectedStoreId();
 if(!requestStore){setError("Vui lòng chọn cửa hàng trước khi hỏi AI.");return;}
 const requestEpoch=storeEpoch.current;
 setLoading(true);setError("");
 try{const res=await fetch("/api/ai/chat",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:text,storeId:requestStore,conversationId:conversationId||undefined})});
 const result=await res.json();if(!res.ok)throw new Error(result.error??"Không gửi được câu hỏi");
 if(storeEpoch.current!==requestEpoch||selectedStoreId()!==requestStore)return;
 setConversationId(result.conversationId);setLines(v=>[...v,{role:"user",text},{role:"assistant",text:result.answer,source:result.mode,confidence:result.confidence}]);setQuestion("");}
 catch(e){if(storeEpoch.current===requestEpoch){setError(e instanceof Error?e.message:"Trợ lý chưa sẵn sàng");}}finally{setLoading(false);}};
 return <div className="mx-auto min-h-screen max-w-[520px] bg-white px-4 pb-28 pt-8 text-slate-800">
 <Link className="text-sm font-semibold text-emerald-700" href="/dashboard">← Trang chủ</Link>
 <div className="mt-5 flex items-center gap-3"><BrainCircuit className="text-emerald-700"/><h1 className="text-2xl font-bold">Trợ lý GreenPlus</h1></div>
 <p className="mt-2 text-sm text-slate-500">Hỏi về sản phẩm, chính sách và hỗ trợ mua sắm theo cửa hàng đã chọn. Trả lời dựa trên FAQ được duyệt.</p>
 {error?<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}
 <section aria-live="polite" className="mt-6 min-h-[40vh] space-y-3">{lines.map((line,index)=><div key={index} className={`rounded-2xl p-4 text-sm ${line.role==="assistant"?"border border-emerald-100 bg-emerald-50":"ml-8 bg-slate-100"}`}><p className="whitespace-pre-wrap">{line.text}</p>{line.source?<p className="mt-2 text-xs text-slate-500">Nguồn: {line.source} · độ khớp {Math.round((line.confidence??0)*100)}%</p>:null}</div>)}</section>
 <div className="mt-4 flex gap-2"><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send();}} maxLength={1500} placeholder="Nhập câu hỏi" className="min-w-0 flex-1 rounded-xl border p-3 text-sm"/><button aria-label="Gửi câu hỏi" disabled={loading||!question.trim()} onClick={()=>void send()} className="rounded-xl bg-emerald-700 px-4 text-white disabled:opacity-40"><Send size={18}/></button></div>
 <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-emerald-700"><Link href="/ai/recipes">Gợi ý thực đơn</Link><Link href="/support">Liên lạc cửa hàng</Link><Link href="/ai/promotions">Ưu đãi đang có</Link><Link href="/profile/help"><MessageCircle size={14} className="mr-1 inline"/>Trợ giúp</Link></div>
 </div>;
}
