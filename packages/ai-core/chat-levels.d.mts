export type ChatLevel = "low" | "medium" | "high";
export type ChatLocale = "vi" | "en";
export declare const CHAT_LEVELS: ReadonlyArray<ChatLevel>;
export declare function chatPreferences(level?: unknown, locale?: unknown): {level: ChatLevel; locale: ChatLocale};
