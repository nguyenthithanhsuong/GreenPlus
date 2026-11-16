"use client";
import { useState } from "react";
import Link from "next/link";
import { ChefHat,ShoppingBasket } from "lucide-react";
import { selectedStoreId } from "@/lib/stores/store-selection";
import AiRecipeIngredients from "./AiRecipeIngredients";
type Recipe={name:string;ingredients:string[];missing_ingredients:string[];steps:string[];match_ratio:number;servings:number};
export default function AiRecipes(){
 const [text,setText]=useState("");const [fromCart,setFromCart]=useState(false);const [servings,setServings]=useState(2);
 const [data,setData]=useState<Recipe[]>([]);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
 const suggest=async()=>{setLoading(true);setError("");try{const response=await fetch("/api/ai/recipes",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeId:selectedStoreId()||undefined,ingredients:text.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean),useCart:fromCart,servings})});const result=await response.json();if(!response.ok)throw new Error(result.error??"Không tải được thực đơn");setData(result.recipes??[]);}catch(e){setError(e instanceof Error?e.message:"Trợ lý thực đơn chưa sẵn sàng");}finally{setLoading(false);}};
 return <main className="mx-auto min-h-screen max-w-[520px] bg-white px-4 pb-28 pt-8"><Link className="text-sm font-semibold text-emerald-700" href="/dashboard">← Trang chủ</Link><h1 className="mt-5 flex items-center gap-2 text-2xl font-bold text-slate-800"><ChefHat className="text-emerald-700"/>GreenCreator AI</h1><p className="mt-2 text-sm text-slate-500">Gợi ý từ thư viện công thức; hiển thị nguyên liệu còn thiếu. Không tự đặt hàng.</p>
 <label className="mt-5 block text-sm font-semibold">Nguyên liệu hiện có<textarea value={text} onChange={e=>setText(e.target.value)} rows={3} maxLength={800} placeholder="Cà chua, trứng, rau cải..." className="mt-2 w-full rounded-xl border p-3 font-normal"/></label>
 <label className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" checked={fromCart} onChange={e=>setFromCart(e.target.checked)}/>Lấy thêm nguyên liệu từ giỏ hàng</label>
 <label className="mt-3 block text-sm">Số khẩu phần <input type="number" min={1} max={12} value={servings} onChange={e=>setServings(Number(e.target.value)||1)} className="ml-2 w-20 rounded-lg border p-2"/></label>
 <button disabled={loading} onClick={()=>void suggest()} className="mt-4 w-full rounded-xl bg-emerald-700 py-3 font-bold text-white disabled:opacity-40">Đề xuất món ăn</button>
 {error?<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}
 <section className="mt-5 space-y-4">{data.map((r,index)=><article key={index} className="rounded-2xl border border-emerald-100 p-4"><h2 className="font-bold text-slate-800">{r.name}</h2><p className="mt-1 text-sm text-slate-500">Phù hợp {Math.round(r.match_ratio*100)}% · {r.servings} khẩu phần</p><p className="mt-3 text-sm"><strong>Nguyên liệu:</strong> {r.ingredients.join(", ")}</p><p className="mt-2 text-sm"><strong>Còn thiếu:</strong> {r.missing_ingredients.join(", ")||"Không có"}</p><ol className="mt-3 list-inside list-decimal space-y-1 text-sm">{r.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><AiRecipeIngredients ingredients={r.missing_ingredients}/><Link href="/cart" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShoppingBasket size={15}/>Xem giỏ hàng</Link></article>)}</section>
 </main>;
}
