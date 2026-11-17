"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, ChefHat, Headphones, MessageCircle, Send, Tag } from "lucide-react";
import NavigationBar from "../dashboard/components/NavigationBar";
import StoreSelector from "../stores/StoreSelector";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../shared/screen.styles";
import { selectedStoreId, STORE_CHANGE_EVENT } from "@/lib/stores/store-selection";

type ChatLine = {
  role: "user" | "assistant";
  text: string;
  source?: string;
  confidence?: number;
};

function answerSource(mode?: string) {
  if (mode === "hybrid_rag_llm") return "FAQ đã duyệt + AI";
  if (mode === "retrieval") return "FAQ đã duyệt";
  if (mode === "smalltalk" || mode === "llm_general") return "Trợ lý GreenPlus";
  return mode ? "Chưa có nguồn xác minh" : null;
}

export default function CustomerAiChat() {
  const [question, setQuestion] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const [error, setError] = useState("");
  const storeEpoch = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reset = () => {
      storeEpoch.current++;
      setConversationId("");
      setPendingText("");
      setLines([]);
      setError("");
    };
    window.addEventListener(STORE_CHANGE_EVENT, reset);
    return () => window.removeEventListener(STORE_CHANGE_EVENT, reset);
  }, []);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines, loading]);

  const send = async () => {
    const text = question.trim();
    if (!text || loading) return;
    const requestStore = selectedStoreId();
    if (!requestStore) {
      setError("Vui lòng chọn cửa hàng trước khi hỏi AI.");
      return;
    }
    const requestEpoch = storeEpoch.current;
    setLoading(true);
    setPendingText(text);
    setError("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          storeId: requestStore,
          conversationId: conversationId || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Không gửi được câu hỏi");
      if (storeEpoch.current !== requestEpoch || selectedStoreId() !== requestStore) return;
      setConversationId(result.conversationId);
      setLines((current) => [
        ...current,
        { role: "user", text },
        { role: "assistant", text: result.answer, source: result.mode, confidence: result.confidence },
      ]);
      setQuestion("");
    } catch (reason) {
      if (storeEpoch.current === requestEpoch) {
        setError(reason instanceof Error ? reason.message : "Trợ lý chưa sẵn sàng");
      }
    } finally {
      setLoading(false);
      setPendingText("");
    }
  };

  return (
    <div
      className="min-h-dvh w-full text-slate-800"
      style={{
        background: SCREEN_BACKGROUND_GRADIENT,
        padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
      }}
    >
      <main
        aria-label="Trò chuyện cùng trợ lý GreenPlus"
        className="mx-auto flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        style={{ maxWidth: SCREEN_MAX_WIDTH_PX }}
      >
        <header
          className="shrink-0 border-b border-emerald-100 bg-white pb-3 pt-4"
          style={{ paddingInline: SCREEN_CONTENT_PADDING_X }}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Quay về trang chủ"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <BrainCircuit size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-emerald-950">Trợ lý GreenPlus</h1>
              <p className="mt-1 text-xs text-slate-500">Hỗ trợ mua sắm và giải đáp thắc mắc</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-emerald-50/70">
            <StoreSelector />
          </div>
        </header>

        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          role="log"
          aria-label="Nội dung hội thoại"
          aria-live="polite"
          aria-relevant="additions"
          style={{ paddingInline: SCREEN_CONTENT_PADDING_X }}
        >
          {lines.length === 0 && !loading ? (
            <div className="flex min-h-full flex-col items-center justify-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800">
                <BrainCircuit size={30} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-emerald-950">Xin chào! Mình có thể giúp gì?</h2>
              <p className="mt-2 max-w-[310px] text-sm leading-6 text-slate-600">
                Hãy hỏi về sản phẩm, đơn hàng hoặc thông tin cửa hàng. Nội dung chính sách được đối chiếu với FAQ đã duyệt.
              </p>
              <div className="mt-6 grid w-full grid-cols-2 gap-2 text-left text-sm font-semibold">
                <Link href="/ai/recipes" className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-800 transition-colors hover:bg-emerald-100">
                  <ChefHat size={18} aria-hidden="true" /> Gợi ý thực đơn
                </Link>
                <Link href="/ai/promotions" className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-800 transition-colors hover:bg-emerald-100">
                  <Tag size={18} aria-hidden="true" /> Ưu đãi đang có
                </Link>
                <Link href="/support" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 transition-colors hover:bg-slate-100">
                  <Headphones size={18} aria-hidden="true" /> Liên lạc cửa hàng
                </Link>
                <Link href="/profile/help" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 transition-colors hover:bg-slate-100">
                  <MessageCircle size={18} aria-hidden="true" /> Trợ giúp
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-5">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      line.role === "user"
                        ? "rounded-br-md bg-emerald-700 text-white"
                        : "rounded-bl-md border border-emerald-100 bg-emerald-50 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{line.text}</p>
                    {line.role === "assistant" && answerSource(line.source) ? (
                      <p className="mt-2 text-xs font-medium text-emerald-800/80">
                        {answerSource(line.source)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
              {loading && pendingText ? (
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl rounded-br-md bg-emerald-700 px-4 py-3 text-sm leading-6 text-white shadow-sm">
                    <p className="whitespace-pre-wrap break-words">{pendingText}</p>
                  </div>
                </div>
              ) : null}
              {loading ? (
                <p role="status" className="w-fit rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Trợ lý đang trả lời...
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div
          className="shrink-0 border-t border-slate-100 bg-white pt-3"
          style={{
            paddingInline: SCREEN_CONTENT_PADDING_X,
            paddingBottom: "calc(94px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {error ? (
            <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <form
            onSubmit={(event) => { event.preventDefault(); void send(); }}
            className="flex items-center gap-2"
          >
            <label htmlFor="greenplus-ai-question" className="sr-only">Nhập câu hỏi cho trợ lý</label>
            <input
              id="greenplus-ai-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={1500}
              autoComplete="off"
              placeholder="Nhập câu hỏi..."
              className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              aria-label="Gửi câu hỏi"
              disabled={loading || !question.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={19} aria-hidden="true" />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Câu trả lời về chính sách cần nguồn được xác minh.
          </p>
        </div>
      </main>
      <NavigationBar />
    </div>
  );
}
