"use client";
import { useState } from "react";
import ShipperShell from "../shared/ShipperShell";
import { chatMsg } from "../../../../packages/ai-core/MSG.mjs";

type Line = {question:string; answer:string; mode:string};
export default function ShipperAiChat() {
  const [question,setQuestion]=useState("");
  const [items,setItems]=useState<Line[]>([]);
  const [conversationId,setConversationId]=useState("");
  const [level,setLevel]=useState<"low"|"medium"|"high">("low");
  const [locale,setLocale]=useState<"vi"|"en">("vi");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const msg=(key:Parameters<typeof chatMsg>[1])=>chatMsg(locale,key);
  const send=async()=>{
    const text=question.trim(); if(!text||busy)return;
    setBusy(true); setError("");
    try {
      const response=await fetch("/api/ai/chat",{
        method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({question:text,conversationId:conversationId||undefined,level,locale})
      });
      const result=await response.json();
      if(!response.ok)throw new Error(result.error??msg("error"));
      setItems(old=>[...old,{question:text,answer:result.answer,mode:result.mode}]);
      setConversationId(result.conversationId);
      setQuestion("");
    } catch(e) {setError(e instanceof Error?e.message:msg("error"));}
    finally {setBusy(false);}
  };
  return <ShipperShell title="Trợ lý GreenPlus" description="Chính sách giao vận theo cửa hàng" icon="ai">
    <div className="mb-4 flex flex-wrap gap-3">
      <label className="text-xs">{msg("level")}
        <select aria-label={msg("level")} className="gp-input mt-1" disabled={busy} value={level}
          onChange={e=>setLevel(e.target.value as typeof level)}>
          <option value="low">{msg("low")}</option><option value="medium">{msg("medium")}</option><option value="high">{msg("high")}</option>
        </select>
      </label>
      <label className="text-xs">{msg("language")}
        <select aria-label={msg("language")} className="gp-input mt-1" disabled={busy} value={locale}
          onChange={e=>setLocale(e.target.value as typeof locale)}>
          <option value="vi">Tiếng Việt</option><option value="en">English</option>
        </select>
      </label>
    </div>
    {level==="high"?<p className="mb-3 text-xs text-amber-800">{msg("privacy")} {msg("highUnverified")}</p>:null}
    {error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}
    <div className="space-y-3">{items.map((item,index)=><article key={index} className="rounded-xl border border-emerald-100 bg-white p-3">
      <p className="font-semibold">{item.question}</p><p className="mt-2 whitespace-pre-wrap text-sm">{item.answer}</p>
      <p className="mt-2 text-xs text-slate-500">{msg((["retrieval","rag_local","hybrid_rag_llm","smalltalk","llm_general"].includes(item.mode)?item.mode:"notVerified") as Parameters<typeof chatMsg>[1])}</p>
    </article>)}{busy?<p role="status" className="text-sm text-emerald-700">{msg("waiting")}</p>:null}</div>
    <div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border p-3" value={question}
      maxLength={1500} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void send();}}
      placeholder={msg("placeholder")}/><button className="rounded-lg bg-emerald-700 px-4 text-white"
      disabled={busy||!question.trim()} onClick={()=>void send()}>{busy?msg("waiting"):msg("send")}</button></div>
  </ShipperShell>;
}
