"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import AdminShell from "../shared/AdminShell";
import AiAssistantTabs from "./AiAssistantTabs";
import { AiNotice, aiFetch, field, panel, primary, secondary, postJson } from "./ui";
import { useAiScope } from "./use-ai-scope";
import { chunkKnowledgeDrafts, parseKnowledgeCsv } from "../../../packages/ai-core/knowledge-import.mjs";
import type { KnowledgeDraft } from "../../../packages/ai-core/knowledge-import.mjs";

type ReviewStatus = "draft" | "approved" | "rejected";
type Audience = "customer" | "shipper" | "manager" | "admin";
const audienceLabels:Record<Audience,string>={customer:"Khách hàng",shipper:"Shipper",manager:"Manager",admin:"Admin"};
type Entry = { id: string; question: string; answer: string; audience: Audience; enabled: boolean; review_status: ReviewStatus; reviewed_at: string | null; deleted_at: string | null };
type ImportDuplicate = { id: string | null; question: string; location: "active" | "archived" | "unknown"; review_status: ReviewStatus | null };
type BulkAction = "approve" | "reject" | "delete" | "restore";
type StatusFilter = "all" | "archived" | ReviewStatus;
const statusLabels: Record<ReviewStatus,string> = { draft: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
const statusStyles: Record<ReviewStatus,string> = {
  draft: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
};
const deleteButton = "rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-40";

export default function AiKnowledge() {
  const { role, storeId, storeQuery, storePicker, ready } = useAiScope();
  const canEdit = role === "manager" || role === "admin";
  const isManager = role === "manager";
  const fileRef = useRef<HTMLInputElement>(null);
  const scopeRef = useRef(storeQuery);
  scopeRef.current = storeQuery;
  const [items, setItems] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [audience, setAudience] = useState<Audience>("customer");
  const [editing, setEditing] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pending, setPending] = useState<KnowledgeDraft[]>([]);
  const [fileName, setFileName] = useState("");
  const [importDuplicates, setImportDuplicates] = useState<ImportDuplicate[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const reload = useCallback(async () => {
    if (!ready) return;
    const target = storeQuery;
    try {
      const data = await aiFetch<{items: Entry[]}>(`/api/ai/knowledge${target}`);
      if (scopeRef.current !== target) return;
      setItems(data.items);
      setSelected(previous => new Set([...previous].filter(id => data.items.some(item => item.id === id))));
      setMessage("");
    } catch (error) {
      if (scopeRef.current === target) setMessage(error instanceof Error ? error.message : "Không tải được kho tri thức");
    }
  }, [ready, storeQuery]);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    setSelected(new Set()); setItems([]); setStatusFilter("all"); setSearch("");
    setPending([]); setFileName(""); setQuestion(""); setAnswer(""); setAudience("customer"); setEditing("");
    setShowForm(false); setShowImport(false); setSuccess(""); setImportDuplicates([]);
  }, [storeId]);

  const visible = useMemo(() => items.filter(item =>
    (statusFilter === "archived" ? Boolean(item.deleted_at) :
      !item.deleted_at && (statusFilter === "all" || item.review_status === statusFilter)) &&
    `${item.question} ${item.answer}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))
  ), [items, search, statusFilter]);
  const selectedItems = items.filter(item => selected.has(item.id));
  const eligibleDrafts = selectedItems.length > 0 && selectedItems.every(item => !item.deleted_at && item.review_status === "draft");
  const eligibleDelete = selectedItems.length > 0 && selectedItems.every(item => !item.deleted_at && (isManager || item.review_status === "draft"));
  const eligibleRestore = isManager && selectedItems.length > 0 && selectedItems.every(item => Boolean(item.deleted_at));
  const allVisibleSelected = visible.length > 0 && visible.every(item => selected.has(item.id));
  const counts = { approved: items.filter(item=>!item.deleted_at && item.review_status==="approved").length,
    draft: items.filter(item=>!item.deleted_at && item.review_status==="draft").length,
    rejected: items.filter(item=>!item.deleted_at && item.review_status==="rejected").length,
    archived: items.filter(item=>Boolean(item.deleted_at)).length };
  const activeCount = items.length - counts.archived;
  const clearEditor = () => { setEditing(""); setQuestion(""); setAnswer(""); setAudience("customer"); setShowForm(false); };
  const save = async (publish = false) => {
    setBusy(true); setMessage(""); setSuccess("");
    try {
      await aiFetch("/api/ai/knowledge", postJson({ storeId: storeId || undefined,
        id: editing || undefined, question, answer, audience, enabled: publish }));
      clearEditor(); await reload();
      setSuccess(publish ? "Đã duyệt và bật tài liệu." : "Đã lưu bản nháp. Tài liệu chưa được chatbot sử dụng.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được tài liệu"); }
    finally { setBusy(false); }
  };

  const runBulk = async (ids: string[], action: BulkAction) => {
    if (!ids.length || busy) return;
    const labels:Record<BulkAction,string> = {approve:"duyệt và xuất bản",reject:"từ chối",delete:"xóa khỏi danh sách",restore:"khôi phục thành bản nháp"};
    const description = action === "restore" ? "Tài liệu lưu trữ được khôi phục về bản nháp, không tự xuất bản. Hành động được ghi Audit Log." : action === "delete"
      ? "Tài liệu sẽ bị xóa mềm (có lưu lịch sử trong database) và không còn được chatbot sử dụng."
      : action === "reject" ? "Tài liệu bị từ chối sẽ không được chatbot sử dụng; có thể sửa lại thành bản nháp." :
        "Tài liệu được duyệt sẽ có thể được chatbot dùng trả lời cho cửa hàng này.";
    if (!window.confirm(`Xác nhận ${labels[action]} ${ids.length} tài liệu?\n\n${description}`)) return;
    setBusy(true); setMessage(""); setSuccess("");
    try {
      const result = await aiFetch<{affected:number}>("/api/ai/knowledge/bulk", postJson({
        storeId: storeId || undefined, ids, action,
      }));
      await reload(); setSelected(new Set());
      if (action === "restore") { setStatusFilter("draft"); setSearch(""); }
      if (ids.includes(editing)) clearEditor();
      setSuccess(`Đã ${labels[action]} ${result.affected} tài liệu.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không cập nhật được lựa chọn"); }
    finally { setBusy(false); }
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(""); setSuccess(""); setPending([]); setImportDuplicates([]);
    try {
      if (file.size > 512_000) throw new Error("Tệp phải nhỏ hơn 500 KB.");
      const rows = parseKnowledgeCsv(await file.text());
      setPending(rows); setFileName(file.name);
    } catch (error) { setFileName(""); setMessage(error instanceof Error ? error.message : "Không đọc được CSV"); }
  };
  const importDrafts = async () => {
    if (!pending.length || !ready) return;
    setBusy(true); setMessage(""); setSuccess("");
    let added = 0, skipped = 0;
    const duplicates: ImportDuplicate[] = [];
    try {
      for (const group of chunkKnowledgeDrafts(pending)) {
        const result = await aiFetch<{added:number;skipped:number;duplicates?: ImportDuplicate[]}>("/api/ai/knowledge", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId: storeId || undefined, items: group }),
        });
        added += result.added; skipped += result.skipped; duplicates.push(...(result.duplicates ?? []));
      }
      setPending([]); setFileName(""); setShowImport(false);
      setImportDuplicates(duplicates);
      setSearch("");
      if (skipped && duplicates.length && duplicates.every(item=>item.location === "archived") && added === 0) setStatusFilter("archived");
      else setStatusFilter("all");
      await reload();
      const archivedDuplicates = duplicates.filter(item=>item.location === "archived").length;
      const activeDuplicates = duplicates.filter(item=>item.location === "active").length;
      setSuccess(`Đã nhập ${added} bản nháp. ${skipped} câu hỏi đã tồn tại trong cửa hàng này (${activeDuplicates} hiện có, ${archivedDuplicates} lưu trữ). Xem danh sách trùng bên dưới; các bản lưu trữ không thể nhập lại khi chưa khôi phục.`);
    } catch (error) {
      setImportDuplicates(duplicates);
      await reload();
      setMessage(`${error instanceof Error ? error.message : "Nhập CSV chưa hoàn tất"}. Đã nhập ${added} tài liệu; kiểm tra danh sách trước khi thử lại.`);
    } finally { setBusy(false); }
  };

  const toggleSelection = (id:string, checked:boolean) => {
    if (checked && selected.size >= 75) {setMessage("Mỗi lượt xử lý tối đa 75 tài liệu.");return;}
    setSelected(previous=>{const result=new Set(previous);if(checked)result.add(id);else result.delete(id);return result;});
  };

  return <AdminShell title="Kho tri thức trợ lý" description="Quản lý FAQ theo cửa hàng. Manager duyệt nội dung trước khi chatbot sử dụng.">
    <AiAssistantTabs active="knowledge" />
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-60 flex-1">{storePicker}</div>
      <div className="flex flex-wrap gap-2">
        {canEdit ? <>
          <button type="button" className={primary} disabled={!ready || busy} onClick={() => { clearEditor(); setShowImport(false); setShowForm(true); }}>+ Thêm mới</button>
          <button type="button" className={secondary} disabled={!ready || busy} onClick={() => { setShowForm(false); setShowImport(value => !value); }}>Nhập CSV</button>
        </> : null}
        <button type="button" className={secondary} disabled={!ready || busy} onClick={() => void reload()}>Làm mới</button>
      </div>
    </div>
    {role === "admin" ? <AiNotice>Admin có thể chuẩn bị và xóa bản nháp. Chỉ Manager có quyền duyệt, từ chối hoặc xóa nội dung đã xuất bản.</AiNotice> : null}
    {role && !canEdit ? <AiNotice>Vai trò hiện tại chỉ xem được tài liệu đã được duyệt.</AiNotice> : null}
    {message ? <AiNotice kind="error">{message}</AiNotice> : null}
    {success ? <AiNotice>{success}</AiNotice> : null}
    {importDuplicates.length ? <section className={panel} aria-label="Chi tiết câu hỏi trùng">
      <h2 className="text-base font-semibold text-slate-900">Câu hỏi trùng khi nhập ({importDuplicates.length})</h2>
      <p className="mt-1 text-sm text-slate-600">Các câu dưới đây đã tồn tại tại cửa hàng đang chọn. Tài liệu đã xóa mềm vẫn giữ khóa câu hỏi để bảo toàn lịch sử.</p>
      <div className="mt-3 max-h-72 space-y-2 overflow-auto">
        {importDuplicates.map((duplicate,index)=><div key={`${duplicate.question}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 break-words text-slate-800">{duplicate.question}</span>
          <span className="text-xs font-semibold text-slate-600">{duplicate.location === "archived" ? "Đã lưu trữ" : duplicate.location === "active" ? `Đang có · ${duplicate.review_status === "approved" ? "Đã duyệt" : duplicate.review_status === "rejected" ? "Từ chối" : "Chờ duyệt"}` : "Chưa xác định"}</span>
          {duplicate.location !== "unknown" ? <button type="button" className={secondary} onClick={()=>{
            setStatusFilter(duplicate.location === "archived" ? "archived" : "all"); setSearch(duplicate.question); setSelected(new Set());
            document.getElementById("ai-knowledge-list")?.scrollIntoView({behavior:"smooth",block:"start"});
          }}>Xem trong danh sách</button> : null}
        </div>)}
      </div>
      <button type="button" className="mt-3 text-sm text-slate-600 underline" onClick={()=>setImportDuplicates([])}>Đóng chi tiết</button>
    </section> : null}

    {canEdit && showForm ? <section className={panel}>
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-slate-900">{editing ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}</h2>
        <button className={secondary} type="button" disabled={busy} onClick={clearEditor}>Đóng</button></div>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Câu hỏi<input className={`${field} mt-1`} value={question} onChange={event=>setQuestion(event.target.value)} maxLength={300} /></label>
        <label className="block text-sm font-semibold text-slate-700">Câu trả lời<textarea className={`${field} mt-1 min-h-32`} value={answer} maxLength={6000} onChange={event=>setAnswer(event.target.value)} /></label>
        <label className="block text-sm font-semibold text-slate-700">Đối tượng được phép tra cứu
          <select className={`${field} mt-1`} value={audience} onChange={e=>setAudience(e.target.value as Audience)}>{Object.entries(audienceLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
        </label>
        <p className="text-xs text-slate-500">Lưu bản nháp sẽ tạm ngừng xuất bản tài liệu đang chỉnh sửa. URL trong câu trả lời chỉ là tham chiếu, không tự tải nội dung liên kết.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || !ready || !question.trim() || !answer.trim()} className={primary} onClick={()=>void save(false)}>Lưu bản nháp</button>
          {isManager ? <button type="button" disabled={busy || !ready || !question.trim() || !answer.trim()} className={secondary} onClick={()=>{
            if(window.confirm("Duyệt và cho phép chatbot sử dụng câu trả lời này?"))void save(true);
          }}>Duyệt và bật</button> : null}
        </div>
      </div>
    </section> : null}

    {canEdit && showImport ? <section className={panel}>
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-slate-900">Nhập nhanh kho tri thức</h2><button type="button" className={secondary} disabled={busy} onClick={()=>setShowImport(false)}>Đóng</button></div>
      <p className="mb-3 text-sm text-slate-600">Tệp CSV/TSV (UTF-8) gồm <code>question</code>, <code>answer</code> và có thể thêm <code>audience</code>, tối đa 100 dòng / 500 KB. Mọi mục nhập là <strong>bản nháp chờ duyệt</strong>.</p>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" className="sr-only" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={event=>void chooseFile(event)} aria-label="Chọn file CSV/TSV kho tri thức" />
        <button type="button" className={secondary} disabled={busy} onClick={()=>fileRef.current?.click()}>Chọn file CSV</button>
        {fileName ? <span className="text-sm text-slate-500">{fileName}</span> : null}
      </div>
      {pending.length ? <div className="mt-4 space-y-3"><p className="text-sm font-semibold">Xem trước {pending.length} mục (5 mục đầu)</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Câu hỏi</th><th className="p-3">Đối tượng</th><th className="p-3">Câu trả lời</th></tr></thead><tbody>{pending.slice(0,5).map((entry,index)=><tr key={`${index}-${entry.question}`} className="border-t border-slate-100"><td className="max-w-72 p-3 align-top">{entry.question}</td><td className="p-3 align-top">{audienceLabels[(entry.audience ?? "customer") as Audience]}</td><td className="max-w-96 p-3 align-top">{entry.answer}</td></tr>)}</tbody></table></div>
        <button type="button" className={primary} disabled={busy || !ready} onClick={()=>void importDrafts()}>Nhập {pending.length} bản nháp</button>
      </div> : null}
      <p className="mt-3 text-xs text-slate-500">Câu trả lời mẫu dựa trên chức năng hiện có, không thay thế chính sách chính thức của từng cửa hàng. Kiểm tra kỹ trước khi duyệt hàng loạt.</p>
    </section> : null}

    <section id="ai-knowledge-list" className={panel}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-900">{statusFilter === "archived" ? "Kho lưu trữ" : "Danh sách tài liệu"} ({statusFilter === "archived" ? counts.archived : activeCount})</h2><p className="mt-1 text-sm text-slate-500">{counts.approved} đã duyệt · {counts.draft} chờ duyệt · {counts.rejected} từ chối · {counts.archived} lưu trữ</p></div>
        <div className="flex flex-wrap gap-2">
          <input className={`${field} w-full sm:w-60`} type="search" placeholder="Tìm câu hỏi, câu trả lời" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Tìm trong kho tri thức" />
          <select className={`${field} w-auto`} value={statusFilter} onChange={e=>{setStatusFilter(e.target.value as StatusFilter);setSelected(new Set());}} aria-label="Lọc trạng thái">
            <option value="all">Tất cả đang có</option><option value="draft">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Từ chối</option>{canEdit ? <option value="archived">Đã lưu trữ ({counts.archived})</option> : null}
          </select>
        </div>
      </div>
      {canEdit && visible.length > 0 ? <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" disabled={busy} checked={allVisibleSelected} onChange={e=>setSelected(previous=>{
          const next = new Set(previous); visible.forEach(item => {if(e.target.checked && next.size < 75) next.add(item.id);else if(!e.target.checked) next.delete(item.id);}); return next;
        })} /> Chọn tất cả ({visible.length})</label>
        <span className="text-sm text-slate-500">Đã chọn: {selected.size} / 75</span>
        {isManager ? <>
          <button className={secondary} type="button" disabled={busy || !eligibleRestore} onClick={()=>void runBulk([...selected],"restore")}>Khôi phục chọn</button>
          <button className={primary} type="button" disabled={busy || !eligibleDrafts} onClick={()=>void runBulk([...selected],"approve")}>Duyệt chọn</button>
          <button className={secondary} type="button" disabled={busy || !eligibleDrafts} onClick={()=>void runBulk([...selected],"reject")}>Từ chối chọn</button>
        </> : null}
        <button className={deleteButton} type="button" disabled={busy || !eligibleDelete} onClick={()=>void runBulk([...selected],"delete")}>Xóa đã chọn</button>
        {selected.size > 0 ? <button type="button" className="text-sm text-slate-600 underline" disabled={busy} onClick={()=>setSelected(new Set())}>Bỏ chọn</button> : null}
      </div> : null}
      <div className="space-y-3">{visible.map(item=><article key={item.id} className={`rounded-xl border p-4 ${selected.has(item.id) ? "border-emerald-400 bg-emerald-50/30" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-start gap-3">
          {canEdit ? <label className="mt-1"><span className="sr-only">Chọn tài liệu: {item.question}</span><input type="checkbox" aria-label={`Chọn ${item.question}`} disabled={busy} checked={selected.has(item.id)} onChange={e=>toggleSelection(item.id,e.target.checked)} /></label> : null}
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{item.question}</h3><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${item.deleted_at ? "bg-slate-100 text-slate-700 border-slate-200" : statusStyles[item.review_status]}`}>{item.deleted_at ? "Đã lưu trữ" : statusLabels[item.review_status]}</span><span className="text-xs text-slate-500">{audienceLabels[item.audience]}</span></div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{item.answer}</p>
          </div>
          {canEdit ? <div className="flex flex-wrap gap-2">
            {isManager && item.deleted_at ? <button className={primary} type="button" disabled={busy} onClick={()=>void runBulk([item.id],"restore")}>Khôi phục bản nháp</button> : null}
            {!item.deleted_at && (isManager || item.review_status === "draft") ? <button className={secondary} type="button" disabled={busy} onClick={()=>{setEditing(item.id);setQuestion(item.question);setAnswer(item.answer);setAudience(item.audience);setShowForm(true);setShowImport(false);window.scrollTo({top:0,behavior:"smooth"});}}>Sửa</button> : null}
            {isManager && !item.deleted_at && item.review_status === "draft" ? <>
              <button className={primary} type="button" disabled={busy} onClick={()=>void runBulk([item.id],"approve")}>Duyệt</button>
              <button className={secondary} type="button" disabled={busy} onClick={()=>void runBulk([item.id],"reject")}>Từ chối</button>
            </> : null}
            {!item.deleted_at && (isManager || item.review_status === "draft") ? <button className={deleteButton} type="button" disabled={busy} onClick={()=>void runBulk([item.id],"delete")}>Xóa</button> : null}
          </div> : null}
        </div>
      </article>)}
      {visible.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center"><p className="text-sm text-slate-600">{items.length ? (statusFilter === "archived" ? "Không có tài liệu trong kho lưu trữ phù hợp bộ lọc." : "Không có tài liệu đang hoạt động phù hợp bộ lọc.") : "Chưa có tài liệu cho cửa hàng này."}</p>{canEdit && statusFilter !== "archived" && activeCount === 0 && counts.archived > 0 ? <button type="button" className={`${secondary} mt-3`} onClick={()=>{setStatusFilter("archived");setSearch("");}}>Xem {counts.archived} tài liệu đã lưu trữ</button> : null}
        {canEdit && items.length === 0 ? <button className={`${primary} mt-3`} disabled={busy || !ready} onClick={()=>{setShowImport(true);setShowForm(false);}}>Nhập nhanh CSV</button> : null}</div> : null}
      </div>
    </section>
  </AdminShell>;
}
