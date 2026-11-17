"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell from "../shared/AdminShell";
import AiAssistantTabs from "./AiAssistantTabs";
import { AiNotice,aiFetch,field,panel,primary,postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";

type Line={role:"user"|"assistant";text:string;mode?:string;confidence?:number};
export default function AiChat() {
  const {storeId,storePicker,ready}=useAiScope();
  const [messages,setMessages]=useState<Line[]>([]);
  const [conversationId,setConversationId]=useState("");
  const [question,setQuestion]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const currentStore = useRef(storeId);
  currentStore.current = storeId;
  useEffect(()=>{setMessages([]);setConversationId("");setError("");},[storeId]);
  const send=async()=>{
    const text=question.trim();if(!text||busy)return;
    const requestStore = storeId;
    setBusy(true);setError("");setQuestion("");
    try {const result=await aiFetch<{conversationId:string;answer:string;mode:string;confidence:number}>("/api/ai/chat",postJson({storeId:storeId||undefined,question:text,conversationId:conversationId||undefined}));
      if (currentStore.current !== requestStore) return;
      setConversationId(result.conversationId);setMessages(old=>[...old,{role:"user",text},{role:"assistant",text:result.answer,mode:result.mode,confidence:result.confidence}]);}
    catch(e){if(currentStore.current === requestStore){setError(e instanceof Error?e.message:"Không nhận được phản hồi");setQuestion(text);}}
    finally{setBusy(false);}
  };
  return <AdminShell title="Trợ lý GreenPlus" description="Hỏi đáp dựa trên kho tri thức được phê duyệt của cửa hàng.">
    <AiAssistantTabs active="chat" />{storePicker}{error?<AiNotice kind="error">{error}</AiNotice>:null}
    <section className={panel}><div className="min-h-72 space-y-4" aria-live="polite">{messages.length?messages.map((item,index)=><article key={index} className={`max-w-3xl rounded-2xl px-4 py-3 text-sm ${item.role==="assistant"?"border border-emerald-100 bg-emerald-50":"ml-auto bg-slate-100"}`}><p className="whitespace-pre-wrap">{item.text}</p>{item.mode?<p className="mt-2 text-xs text-emerald-800">{item.mode==="hybrid_rag_llm"?"FAQ đã duyệt + AI":item.mode==="retrieval"?"FAQ đã duyệt":["smalltalk","llm_general"].includes(item.mode)?"Hỗ trợ chung":"Chưa có nguồn xác minh"}</p>:null}</article>):<p className="text-slate-500"> </p>}{busy?<p role="status" className="text-sm text-emerald-700">Đang kiểm tra kho tri thức và soạn câu trả lời...</p>:null}</div><div className="mt-5 flex flex-wrap gap-2"><input className={`${field} flex-1`} value={question} maxLength={1500} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send();}} placeholder="Nhập câu hỏi của bạn"/><button className={primary} disabled={busy||!question.trim()||!ready} onClick={()=>void send()}>{busy?"Đang trả lời...":"Gửi"}</button></div></section>
  </AdminShell>;
}
