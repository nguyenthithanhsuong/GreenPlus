"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { AlertTriangle,BrainCircuit,TrendingUp } from "lucide-react";
import { aiFetch } from "./ui";

type Stats={alerts:number;pending:number;lowConfidence:number;forecasts:number;partial:boolean};
export default function AiDashboardWidget({role}:{role:string}){
 const [stats,setStats]=useState<Stats|null>(null);const [error,setError]=useState("");
 useEffect(()=>{if(role!=="manager")return;let active=true;
 void aiFetch<Stats>("/api/ai/dashboard").then(value=>{if(active)setStats(value);}).catch(()=>{if(active)setError("AI chưa sẵn sàng");});
 return()=>{active=false;};},[role]);
 if(!["admin","manager"].includes(role))return null;
 return <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><BrainCircuit className="text-emerald-700"/>AI tồn kho & đề xuất</h2><Link href="/ai" className="text-sm font-semibold text-emerald-700 underline">Mở AI Dashboard</Link></div>
 {role==="admin"?<p className="text-sm text-slate-500">Chọn cửa hàng trong AI Dashboard để xem dữ liệu; Admin không duyệt khuyến mãi.</p>:stats?<div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-orange-50 p-3"><AlertTriangle className="text-orange-700"/><p className="mt-2 text-sm">Cảnh báo kho</p><p className="text-2xl font-bold">{stats.alerts}</p></div><div className="rounded-xl bg-emerald-50 p-3"><TrendingUp className="text-emerald-700"/><p className="mt-2 text-sm">Dự báo</p><p className="text-2xl font-bold">{stats.forecasts}</p></div><div className="rounded-xl bg-blue-50 p-3"><BrainCircuit className="text-blue-700"/><p className="mt-2 text-sm">Chờ duyệt</p><p className="text-2xl font-bold">{stats.pending}</p></div>{stats.partial?<p className="col-span-full text-xs text-orange-700">Dữ liệu thống kê đã bị giới hạn; cần truy vấn đầy đủ để quyết định.</p>:null}</div>:<p role="status" className="text-sm text-slate-500">{error||"Đang tải dữ liệu AI..."}</p>}
 </section>;
}
