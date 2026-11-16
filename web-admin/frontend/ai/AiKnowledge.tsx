"use client";
import { useCallback,useEffect,useState } from "react";
import AdminShell from "../shared/AdminShell";
import AiAssistantTabs from "./AiAssistantTabs";
import { AiNotice,aiFetch,field,panel,primary,secondary,postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";

type Entry={id:string;question:string;answer:string;enabled:boolean};
export default function AiKnowledge() {
  const {role,storeId,storeQuery,storePicker,ready}=useAiScope();
  const [items,setItems]=useState<Entry[]>([]);
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [editing,setEditing]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const reload=useCallback(async()=>{
    try {const data=await aiFetch<{items:Entry[]}>(`/api/ai/knowledge${storeQuery}`);setItems(data.items);setMessage("");}
    catch(e){setMessage(e instanceof Error?e.message:"Không tải được kho tri thức");}
  },[storeQuery]);
  useEffect(()=>{if(ready)void reload();},[reload,ready]);
  const save=async()=>{
    setBusy(true);
    try {await aiFetch("/api/ai/knowledge",postJson({storeId:storeId||undefined,id:editing||undefined,question,answer}));
      setQuestion("");setAnswer("");setEditing("");await reload();}
    catch(e){setMessage(e instanceof Error?e.message:"Không lưu được tài liệu");}
    finally{setBusy(false);}
  };
  const disable=async(id:string)=>{
    setBusy(true);
    try{await aiFetch(`/api/ai/knowledge/${id}${storeQuery}`,{method:"DELETE"});await reload();}
    catch(e){setMessage(e instanceof Error?e.message:"Không cập nhật được tài liệu");}
    finally{setBusy(false);}
  };
  return <AdminShell title="Kho tri thức trợ lý" description="FAQ và chính sách được duyệt, phân tách theo cửa hàng.">
    <AiAssistantTabs active="knowledge" />{storePicker}{message?<AiNotice kind="error">{message}</AiNotice>:null}
    {role==="manager"?<section className={panel}><h2 className="mb-3 text-lg font-bold">{editing?"Chỉnh sửa tài liệu":"Thêm tài liệu"}</h2><div className="space-y-3"><input className={field} value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} placeholder="Câu hỏi thường gặp"/><textarea className={`${field} min-h-28`} value={answer} maxLength={6000} onChange={e=>setAnswer(e.target.value)} placeholder="Nội dung trả lời đã được kiểm duyệt"/><div className="flex gap-2"><button disabled={busy||!question.trim()||!answer.trim()} className={primary} onClick={()=>void save()}>Lưu tài liệu</button><button className={secondary} onClick={()=>{setEditing("");setQuestion("");setAnswer("");}}>Làm mới</button></div></div></section>:null}
    <section className={panel}><h2 className="mb-3 text-lg font-bold">Danh sách tài liệu ({items.length})</h2><div className="space-y-3">{items.map(item=><div key={item.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{item.question}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.answer}</p><p className="mt-1 text-xs text-slate-400">{item.enabled?"Đang sử dụng":"Đã ẩn"}</p></div>{role==="manager"?<div className="flex gap-2"><button className={secondary} onClick={()=>{setEditing(item.id);setQuestion(item.question);setAnswer(item.answer);}}>Sửa</button>{item.enabled?<button className={secondary} disabled={busy} onClick={()=>void disable(item.id)}>Ẩn</button>:null}</div>:null}</div></div>)}{!items.length?<p className="text-sm text-slate-500">Chưa có tài liệu.</p>:null}</div></section>
  </AdminShell>;
}
