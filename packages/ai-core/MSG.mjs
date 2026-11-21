/** GreenPlus shared AI chat message catalog (vi/en).
 * Frontend-only static strings: no secrets or per-user data here.
 * Do not treat translations as proof that FAQ source content is translated.
 */
const catalog = Object.freeze({
  vi: Object.freeze({
    level: "Mức phản hồi", language: "Ngôn ngữ", low: "Thấp · FAQ nhanh",
    medium: "Trung bình · RAG nội bộ", high: "Cao · LLM online",
    privacy: "Mức Cao có thể gửi câu hỏi và FAQ đã duyệt đến nhà cung cấp LLM bên ngoài. Không nhập OTP, mật khẩu hoặc dữ liệu nhạy cảm.",
    waiting: "Trợ lý đang trả lời...", send: "Gửi", placeholder: "Nhập câu hỏi...",
    needStore: "Vui lòng chọn cửa hàng trước khi hỏi AI.", error: "Trợ lý hiện chưa sẵn sàng.",
    notVerified: "Chưa có nguồn xác minh", retrieval: "FAQ đã duyệt",
    rag_local: "RAG nội bộ (không gọi LLM online)", hybrid_rag_llm: "FAQ đã duyệt + LLM online",
    smalltalk: "Hỗ trợ chung", llm_general: "LLM online (hội thoại chung)",
    intro: "Hãy hỏi về sản phẩm, đơn hàng hoặc thông tin cửa hàng. Nội dung chính sách được đối chiếu với FAQ đã duyệt.",
    notice: "Câu trả lời về chính sách cần nguồn được xác minh.",
    highUnverified: "Mức Cao chưa có quyền tự đọc hoặc sửa đơn hàng, lịch hay database.",
  }),
  en: Object.freeze({
    level: "Response level", language: "Language", low: "Low · Fast FAQ",
    medium: "Medium · Local RAG", high: "High · Online LLM",
    privacy: "High mode may send your question and approved FAQ excerpts to an external LLM provider. Never share passwords, OTPs, or sensitive data.",
    waiting: "Assistant is responding...", send: "Send", placeholder: "Enter your question...",
    needStore: "Choose a store before asking the assistant.", error: "The assistant is currently unavailable.",
    notVerified: "No verified source", retrieval: "Approved FAQ",
    rag_local: "Local RAG (no online LLM)", hybrid_rag_llm: "Approved FAQ + online LLM",
    smalltalk: "General support", llm_general: "Online LLM (general conversation)",
    intro: "Ask about products, orders, or store information. Policies are checked against approved FAQ sources.",
    notice: "Store policies require verified sources.",
    highUnverified: "High mode cannot yet independently read or change orders, schedules, or databases.",
  }),
});
export function chatMsg(locale, key) {
  return (catalog[locale] || catalog.vi)[key] || catalog.vi[key] || key;
}
