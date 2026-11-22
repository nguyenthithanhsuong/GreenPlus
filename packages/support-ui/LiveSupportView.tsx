"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { normalizeSupportLocale, supportMsg, type SupportMessageKey, type SupportLocale } from "./MSG.mjs";

const LANGUAGE_KEY="greenplus.language.v1";
const getLanguage=():SupportLocale=>{try{return normalizeSupportLocale(localStorage.getItem(LANGUAGE_KEY));}catch{return "vi";}};
const serverLanguage=():SupportLocale=>"vi";
function subscribeLanguage(onChange:()=>void){
  const listener=(event:StorageEvent)=>{if(event.key===LANGUAGE_KEY)onChange();};
  window.addEventListener("storage",listener);window.addEventListener("greenplus-language-change",onChange);
  return()=>{window.removeEventListener("storage",listener);window.removeEventListener("greenplus-language-change",onChange);};
}

type Inquiry = { id:string; subject:string; status:string; created_at:string; created_by:string };
type Message = { id:string; body:string; sender_role:string; created_at:string };
type Props = { storeId?:string|null; ready?:boolean; title?:string; canManage?:boolean; canEscalate?:boolean };
async function loadJson<T>(url:string, init?:RequestInit):Promise<T>{
  const response=await fetch(url,{credentials:"same-origin",cache:"no-store",...init});
  const data:unknown=await response.json().catch(()=>null);
  if(!response.ok){
    const error=data&&typeof data==="object"&&"error" in data&&typeof data.error==="string"?data.error:supportMsg(getLanguage(),"networkError");
    throw new Error(error);
  }
  return data as T;
}
export default function LiveSupportView({storeId,ready=true,title="Nhắn trực tiếp với nhân viên",canManage=false,canEscalate=false}:Props){
  const locale=useSyncExternalStore(subscribeLanguage,getLanguage,serverLanguage);
  const t=useCallback((key:SupportMessageKey)=>supportMsg(locale,key),[locale]);
  const [items,setItems]=useState<Inquiry[]>([]);
  const [selected,setSelected]=useState("");
  const [subject,setSubject]=useState("");
  const [draft,setDraft]=useState("");
  const [messages,setMessages]=useState<Message[]>([]);
  // Keep messages tied to the selected store+conversation so changing stores
  // never leaves the previous tenant's conversation visible while loading.
  const [messageContext,setMessageContext]=useState("");
  const messageViewport=useRef<HTMLDivElement|null>(null);
  const nearBottom=useRef(true);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const requestId=useRef(0);
  const listingInFlight=useRef(false);
  const currentMessageRequest=useRef<{key:string;controller:AbortController}|null>(null);
  const query=storeId?`?storeId=${encodeURIComponent(storeId)}`:"";
  const payload=(data:Record<string,unknown>):RequestInit=>({
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,...(storeId?{storeId}:{})}),
  });
  const refresh=useCallback(async()=>{
    if(!ready||listingInFlight.current)return;
    listingInFlight.current=true;
    try {
      const data=await loadJson<{items:Inquiry[]}>(`/api/support/inquiries${query}`);
      setItems(data.items);
    } catch(e){setError(e instanceof Error?e.message:t("loadingError"));}
    finally { listingInFlight.current=false; }
  },[ready,query,t]);
  const refreshMessages=useCallback(async(force=false)=>{
    if(!ready||!selected)return;
    const key=`${selected}:${query}`;
    const prior=currentMessageRequest.current;
    // Avoid repeated requests while still allowing an immediate refresh after send.
    if(prior?.key===key&&!force)return;
    if(prior)prior.controller.abort();
    const controller=new AbortController();
    currentMessageRequest.current={key,controller};
    const serial=++requestId.current;
    try{
      const data=await loadJson<{items:Message[]}>(`/api/support/inquiries/${encodeURIComponent(selected)}/messages${query}`,{signal:controller.signal});
      if(serial===requestId.current&&!controller.signal.aborted){
        setMessageContext(key);
        setMessages(previous=>previous.length===data.items.length && previous.every((message,i)=>message.id===data.items[i]?.id && message.body===data.items[i]?.body)?previous:data.items);
      }
    } catch(e){
      if(!controller.signal.aborted&&serial===requestId.current)setError(e instanceof Error?e.message:t("messageError"));
    } finally {
      if(currentMessageRequest.current?.controller===controller)currentMessageRequest.current=null;
    }
  },[ready,selected,query,t]);
  useEffect(()=>{void refresh();},[refresh]);
  useEffect(()=>{
    if(!ready)return;
    const tick=window.setInterval(()=>{
      if(document.visibilityState==="visible")void refresh();
    },15000);
    return()=>window.clearInterval(tick);
  },[ready,refresh]);
  useEffect(()=>{
    void refreshMessages(true);
    return()=>{requestId.current+=1;currentMessageRequest.current?.controller.abort();currentMessageRequest.current=null;};
  },[refreshMessages]);
  useEffect(()=>{
    if(!selected||!ready)return;
    const tick=window.setInterval(()=>{
      if(document.visibilityState==="visible")void refreshMessages();
    },12000);
    return()=>window.clearInterval(tick);
  },[ready,selected,refreshMessages]);
  useEffect(()=>{
    if(!ready)return;
    const onVisible=()=>{
      if(document.visibilityState==="visible"){
        void refresh();
        void refreshMessages();
      }
    };
    window.addEventListener("focus",onVisible);
    document.addEventListener("visibilitychange",onVisible);
    return()=>{window.removeEventListener("focus",onVisible);document.removeEventListener("visibilitychange",onVisible);};
  },[ready,refresh,refreshMessages]);
  useEffect(()=>{
    const element=messageViewport.current;
    if(element && nearBottom.current)element.scrollTop=element.scrollHeight;
  },[messages,messageContext]);
  const currentMessageKey=`${selected}:${query}`;
  const visibleMessages=messageContext===currentMessageKey?messages:[];
  async function create(){
    if(busy||!subject.trim())return;
    setBusy(true);setError("");
    try{
      const record=await loadJson<Inquiry>("/api/support/inquiries",payload({subject}));
      setSelected(record.id);setSubject("");setMessages([]);setMessageContext("");nearBottom.current=true;
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:t("createError"));}
    finally{setBusy(false);}
  }
  async function send(){
    if(busy||!selected||!draft.trim())return;
    setBusy(true);setError("");
    try{
      await loadJson(`/api/support/inquiries/${encodeURIComponent(selected)}/messages`,payload({body:draft}));
      setDraft("");await refreshMessages(true);
    }catch(e){setError(e instanceof Error?e.message:t("sendError"));}
    finally{setBusy(false);}
  }
  async function updateState(action:"resolve"|"escalate") {
    if(!selected||busy)return;
    setBusy(true);setError("");
    try{
      await loadJson(`/api/support/inquiries/${encodeURIComponent(selected)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...(storeId?{storeId}:{})})});
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:t("updateError"));}
    finally{setBusy(false);}
  }
  return <section aria-label="Hỗ trợ trực tiếp" className="gp-live-support w-full min-w-0 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm md:p-7">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-extrabold text-emerald-950 md:text-3xl">{title === "Nhắn trực tiếp với nhân viên" ? t("heading") : title}</h2>
    <p className="mt-2 text-base text-slate-600">{t("intro")}</p></div>
    <label className="text-sm font-semibold text-slate-700">{t("language")}<select aria-label={t("language")} className="ml-2 rounded-lg border border-slate-300 bg-white p-2 text-sm" value={locale} onChange={event=>{try{localStorage.setItem(LANGUAGE_KEY,event.target.value);}catch{/* browser storage disabled */}window.dispatchEvent(new Event("greenplus-language-change"));}}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label></header>
    {!ready?<p role="status" className="rounded-xl bg-amber-50 p-4 text-amber-900">{t("needStore")}</p>:null}
    {error?<p role="alert" className="my-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</p>:null}
    <div className="mb-5 flex flex-wrap gap-2">
      <label className="min-w-48 flex-1"><span className="mb-1 block text-sm font-semibold text-slate-700">{t("subject")}</span>
        <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus-visible:outline-emerald-600" value={subject} maxLength={160} onChange={e=>setSubject(e.target.value)} placeholder={t("subjectPlaceholder")}/></label>
      <button type="button" disabled={!ready||busy||subject.trim().length<3} onClick={()=>void create()} className="self-end rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50">{t("create")}</button>
    </div>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(230px,320px)_minmax(0,1fr)]">
      <div className="max-h-[55vh] min-w-0 space-y-2 overflow-y-auto" aria-label={t("conversation")}>
        {items.length===0?<p className="rounded-xl bg-slate-50 p-4 text-slate-500">{t("empty")}</p>:items.map(item=><button key={item.id} type="button" onClick={()=>{setSelected(item.id);setMessages([]);setMessageContext("");nearBottom.current=true;}} className={`w-full rounded-xl border p-4 text-left transition hover:border-emerald-400 ${item.id===selected?"border-emerald-600 bg-emerald-50":"border-slate-200 bg-white"}`}>
          <span className="block truncate text-base font-bold text-slate-800">{item.subject}</span><span className="mt-1 block text-sm text-slate-500">{item.status==="open"?t("open"):t("resolved")}</span>
        </button>)}
      </div>
      <section className="min-w-0 rounded-2xl border border-slate-200 p-3 md:p-5" aria-label={t("messages")}>
        {!selected?<p className="p-8 text-center text-base text-slate-500">{t("pick")}</p>:<>
          <div ref={messageViewport} onScroll={event=>{const element=event.currentTarget;nearBottom.current=element.scrollHeight-element.scrollTop-element.clientHeight<100;}} className="max-h-[50vh] min-h-56 space-y-3 overflow-y-auto" aria-live="polite" aria-relevant="additions text">
            {visibleMessages.map(message=><article key={message.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold text-emerald-800">{message.sender_role} · {new Date(message.created_at).toLocaleString("vi-VN")}</p><p className="mt-1 whitespace-pre-wrap break-words text-base text-slate-800">{message.body}</p></article>)}
          </div>
          {canManage&&items.some(item=>item.id===selected&&item.status==="open")?<div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={()=>void updateState("resolve")} className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50">{t("finish")}</button>
            {canEscalate?<button type="button" disabled={busy} onClick={()=>void updateState("escalate")} className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-50">{t("escalate")}</button>:null}
          </div>:null}
          <div className="mt-4 flex flex-wrap gap-2"><input aria-label={t("draft")} className="min-w-40 flex-1 rounded-xl border border-slate-200 p-3 text-base" value={draft} maxLength={2000} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder={t("draftPlaceholder")}/>
          <button type="button" disabled={busy||!ready||!draft.trim()||items.find(item=>item.id===selected)?.status!=="open"} onClick={()=>void send()} className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{t("send")}</button></div>
        </>}
      </section>
    </div>
  </section>;
}
