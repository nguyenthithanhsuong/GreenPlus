"use client";

import { Fragment, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

type Role = {role_id:string; role_name:string; is_admin:boolean|null; is_manager:boolean|null; is_employee:boolean|null};
type Permission = {id:string; key:string; description:string};
type Grant = {role_id:string; permission_id:string};
type Matrix = {roles:Role[]; permissions:Permission[]; grants:Grant[]; transitional:boolean};

export default function PermissionMatrix(){
 const [data,setData]=useState<Matrix|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function load(){
   setBusy(true);
   try{const res=await fetch("/api/roles/permissions",{cache:"no-store"});const body=await res.json() as Matrix&{error?:string};
     if(!res.ok)throw new Error(body.error||"Không thể đọc ma trận quyền");setData(body);setError("");
   }catch(e){setError(e instanceof Error?e.message:"Không thể đọc ma trận quyền");}
   finally{setBusy(false);}
 }
 useEffect(()=>{void load();},[]);
 const grantKeys=new Set((data?.grants??[]).map(x=>`${x.role_id}:${x.permission_id}`));
 const modules=[...new Set((data?.permissions??[]).map(p=>p.key.split(".")[0]))];
 return <section className="rounded-2xl border border-slate-200 bg-white p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShieldCheck size={20}/>Ma trận quyền RBAC</h2><button type="button" onClick={()=>void load()} disabled={busy} className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60">Tải lại ma trận</button></div>
   <p className="mt-2 text-sm text-amber-800">Giai đoạn chuyển tiếp: đây là các quyền đã cấp trong registry. Một số API hiện vẫn sử dụng các cờ vai trò cũ; chưa dùng bảng này để thu hồi quyền thực tế.</p>
   {error&&<p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
   {data&&<div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-slate-200"><table className="min-w-[680px] w-full text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-50"><tr><th className="min-w-48 px-4 py-3">Nhóm / quyền</th>{data.roles.map(role=><th key={role.role_id} className="min-w-28 px-3 py-3 text-center">{role.role_name}</th>)}</tr></thead>
   <tbody>{modules.map(module=><Fragment key={module}>
     <tr key={`group-${module}`} className="bg-emerald-50"><td colSpan={data.roles.length+1} className="px-4 py-2 font-bold uppercase text-emerald-800">{module}</td></tr>
     {data.permissions.filter(p=>p.key.split(".")[0]===module).map(permission=><tr key={permission.id} className="border-t border-slate-100"><td className="px-4 py-2" title={permission.description}>{permission.key}</td>{data.roles.map(role=><td key={role.role_id} className="px-3 py-2 text-center">{grantKeys.has(`${role.role_id}:${permission.id}`)?<span className="font-bold text-emerald-700" aria-label="Đã cấp">✓</span>:<span className="text-slate-300" aria-label="Chưa cấp">—</span>}</td>)}</tr>)}
   </Fragment>)}</tbody></table></div>}
 </section>;
}
