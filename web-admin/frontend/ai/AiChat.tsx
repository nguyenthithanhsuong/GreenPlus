"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell from "../shared/AdminShell";
import AiAssistantTabs from "./AiAssistantTabs";
import { AiNotice,aiFetch,field,panel,primary,postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";
import { chatMsg } from "../../../packages/ai-core/MSG.mjs";

type Line={role:"user"|"assistant";text:string;mode?:string;confidence?:number};
export default function AiChat() {
  const {storeId,storePicker,ready}=useAiScope();
  const [messages,setMessages]=useState<Line[]>([]);
  const [conversationId,setConversationId]=useState("");
  const [question,setQuestion]=useState("");
  const [level,setLevel]=useState<"low"|"medium"|"high">("low");
  const [locale,setLocale]=useState<"vi"|"en">("vi");
  const msg=(key:Parameters<typeof chatMsg>[1])=>chatMsg(locale,key);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const currentStore = useRef(storeId);
  currentStore.current = storeId;
  useEffect(()=>{setMessages([]);setConversationId("");setError("");},[storeId]);
  const send=async()=>{
    const text=question.trim();if(!text||busy)return;
    const requestStore = storeId;
    setBusy(true);setError("");setQuestion("");
    try {const result=await aiFetch<{conversationId:string;answer:string;mode:string;confidence:number}>("/api/ai/chat",postJson({storeId:storeId||undefined,question:text,conversationId:conversationId||undefined,level,locale}));
      if (currentStore.current !== requestStore) return;
      setConversationId(result.conversationId);setMessages(old=>[...old,{role:"user",text},{role:"assistant",text:result.answer,mode:result.mode,confidence:result.confidence}]);}
    catch(e){if(currentStore.current === requestStore){setError(e instanceof Error?e.message:msg("error"));setQuestion(text);}}
    finally{setBusy(false);}
  };
  return <AdminShell title="Trợ lý GreenPlus" description="Hỏi đáp dựa trên kho tri thức được phê duyệt của cửa hàng.">
    <AiAssistantTabs active="chat" />{storePicker}{error?<AiNotice kind="error">{error}</AiNotice>:null}
    <section className={panel}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">{msg("level")}
          <select aria-label={msg("level")} className={`${field} mt-1`} value={level} disabled={busy}
            onChange={e=>setLevel(e.target.value as typeof level)}>
            <option value="low">{msg("low")}</option><option value="medium">{msg("medium")}</option>
            <option value="high">{msg("high")}</option>
          </select>
        </label>
        <label className="text-sm font-medium">{msg("language")}
          <select aria-label={msg("language")} className={`${field} mt-1`} value={locale} disabled={busy}
            onChange={e=>setLocale(e.target.value as typeof locale)}>
            <option value="vi">Tiếng Việt</option><option value="en">English</option>
          </select>
        </label>
      </div>
      {level==="high"?<p className="mb-3 text-xs text-amber-800">{msg("privacy")} {msg("highUnverified")}</p>:null}
      <div className="min-h-72 space-y-4" aria-live="polite">{messages.length?messages.map((item,index)=><article key={index} className={`max-w-3xl rounded-2xl px-4 py-3 text-sm ${item.role==="assistant"?"border border-emerald-100 bg-emerald-50":"ml-auto bg-slate-100"}`}><p className="whitespace-pre-wrap">{item.text}</p>{item.mode?<p className="mt-2 text-xs text-emerald-800">{msg((["retrieval","rag_local","hybrid_rag_llm","smalltalk","llm_general"].includes(item.mode)?item.mode:"notVerified") as Parameters<typeof chatMsg>[1])}</p>:null}</article>):<p className="text-slate-500"> </p>}{busy?<p role="status" className="text-sm text-emerald-700">{msg("waiting")}</p>:null}</div><div className="mt-5 flex flex-wrap gap-2"><input className={`${field} flex-1`} value={question} maxLength={1500} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send();}} placeholder={msg("placeholder")}/><button className={primary} disabled={busy||!question.trim()||!ready} onClick={()=>void send()}>{busy?msg("waiting"):msg("send")}</button></div></section>
  </AdminShell>;
}
