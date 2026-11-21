/** Shared request contract. Never trust browser-provided permission scopes. */
export const CHAT_LEVELS = Object.freeze(["low", "medium", "high"]);
export function chatPreferences(level = "low", locale = "vi") {
  if (!CHAT_LEVELS.includes(level)) throw Object.assign(new Error("Mức trợ lý không hợp lệ"), { status: 400 });
  if (locale !== "vi" && locale !== "en") throw Object.assign(new Error("Ngôn ngữ không hợp lệ"), { status: 400 });
  return { level, locale };
}
