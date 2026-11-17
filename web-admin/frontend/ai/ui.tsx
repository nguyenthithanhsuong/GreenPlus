"use client";
import type { ReactNode } from "react";

export const panel = "rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm";
export const primary = "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-40";
export const secondary = "rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-40";
export const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none";
export function AiNotice({children,kind="info"}:{children:ReactNode;kind?:"info"|"error"}) {
  return <div role={kind==="error"?"alert":"status"} className={`rounded-xl border px-4 py-3 text-sm ${kind==="error"?"border-red-200 bg-red-50 text-red-700":"border-emerald-100 bg-emerald-50 text-emerald-900"}`}>{children}</div>;
}
export async function aiFetch<T>(path:string,init?:RequestInit):Promise<T> {
  const response=await fetch(path,{credentials:"same-origin",cache:"no-store",...init});
  const data=await response.json().catch(()=>({error:"Không đọc được phản hồi"}));
  if (!response.ok) {
    const fallback = response.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại." :
      response.status === 403 ? "Bạn không có quyền thực hiện thao tác này." :
      response.status === 503 ? "Chưa thể truy cập dịch vụ hoặc dữ liệu AI. Hãy kiểm tra AI trong Hệ thống." :
      "Yêu cầu chưa hoàn tất";
    throw new Error(typeof data.error === "string" ? data.error : fallback);
  }
  return data as T;
}
export const postJson=(body:unknown):RequestInit=>({method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
