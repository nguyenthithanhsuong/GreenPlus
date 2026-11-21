export type ChatLocale = "vi" | "en";
export type ChatMessageKey = "level" | "language" | "low" | "medium" | "high" | "privacy" | "waiting" | "send" | "placeholder" | "needStore" | "error" | "notVerified" | "retrieval" | "rag_local" | "hybrid_rag_llm" | "smalltalk" | "llm_general" | "intro" | "notice" | "highUnverified";
export declare function chatMsg(locale: ChatLocale, key: ChatMessageKey): string;
