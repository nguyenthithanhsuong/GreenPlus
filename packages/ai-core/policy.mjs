export const ROLES = Object.freeze(["admin", "manager", "employee", "shipper", "customer"]);
const CAPABILITIES = Object.freeze({
  admin: ["chat", "knowledge.read", "dashboard.global", "support.escalated", "support.read", "support.write", "audit.read", "forecast.read", "promotion.read", "complaint.read"],
  manager: ["chat", "knowledge.read", "knowledge.write", "forecast.read", "forecast.run", "promotion.read", "promotion.generate", "complaint.triage", "promotion.decide", "support.read", "support.write", "complaint.read"],
  employee: ["chat", "knowledge.read", "support.read", "support.write", "complaint.read"],
  shipper: ["chat", "knowledge.read", "support.read", "support.write"],
  customer: ["chat", "knowledge.read", "recipes", "support.read", "support.write"],
});
const LIMITS = Object.freeze({ admin: 60, manager: 50, employee: 30, shipper: 20, customer: 15 });
export function canAi(role, ability) { return Array.isArray(CAPABILITIES[role]) && CAPABILITIES[role].includes(ability); }
export function hourlyLimit(role) { return LIMITS[role] ?? 0; }
export function validUuid(value) { return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value); }
export function safeText(value, max = 1500, min = 1) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) return null;
  return value.trim();
}
export function assertSameStore(expected, actual) {
  if (!validUuid(expected) || !validUuid(actual) || expected !== actual) throw new Error("Cross-store AI data refused");
}
