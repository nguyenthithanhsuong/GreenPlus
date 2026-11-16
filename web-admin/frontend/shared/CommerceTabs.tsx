"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { id: string; label: string; href?: string };
export default function CommerceTabs({ tabs, current, onChange }: { tabs: Tab[]; current: string; onChange?: (id: string) => void }) {
  const pathname = usePathname();
  return <nav aria-label="Các chức năng liên quan" className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
    {tabs.map(tab => {
      const classes = `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${current === tab.id ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50"}`;
      if (onChange && pathname !== tab.href) return <button type="button" key={tab.id} aria-current={current === tab.id ? "page" : undefined} className={classes} onClick={() => onChange(tab.id)}>{tab.label}</button>;
      return <Link key={tab.id} href={tab.href || "#"} aria-current={current === tab.id ? "page" : undefined} className={classes}>{tab.label}</Link>;
    })}
  </nav>;
}
