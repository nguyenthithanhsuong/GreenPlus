import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("AI features are grouped with their business workflows, not in a separate sidebar section", async () => {
  const sidebar = await source("web-admin/frontend/shared/AdminSidebar.tsx");
  assert.doesNotMatch(sidebar, /label:\s*"Trí tuệ nhân tạo & hỗ trợ"/);
  for (const group of ["Tồn kho", "Giá bán & khuyến mãi", "Đơn hàng", "Khiếu nại"]) {
    assert.match(sidebar, new RegExp(`label: "${group.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  // Flat sidebar keeps the operational entry points. AI/support remain reachable
  // as tabs/panels or direct routes, not as redundant dropdown children.
  for (const destination of [
    "/inventories", "/prices", "/orders", "/complaints",
    "/ai/chat", "/settings/stores", "/settings/store", "/system",
  ]) {
    assert.ok(sidebar.includes(`href: "${destination}"`), `${destination} has a visible navigation mapping`);
  }
  assert.doesNotMatch(sidebar, /<button[^>]*aria-expanded=/);
  assert.doesNotMatch(sidebar, /href: "\/ai\/knowledge"/);
  assert.match(sidebar, /canAccessPage\(role, item\.href\)/);
  assert.match(sidebar, /aria-current=\{active \? "page"/);
});

test("assistant and knowledge share a tabbed navigation while keeping route permissions", async () => {
  const tabs = await source("web-admin/frontend/ai/AiAssistantTabs.tsx");
  const chat = await source("web-admin/frontend/ai/AiChat.tsx");
  const knowledge = await source("web-admin/frontend/ai/AiKnowledge.tsx");
  const access = await source("web-admin/src/lib/portal-access.ts");
  assert.match(tabs, /href: "\/ai\/chat", label: "Hỏi đáp"/);
  assert.match(tabs, /href: "\/ai\/knowledge", label: "Kho tri thức"/);
  assert.match(tabs, /canAccessPage\(role, item\.href\)/);
  assert.match(chat, /<AiAssistantTabs active="chat"\s*\/>/);
  assert.match(knowledge, /<AiAssistantTabs active="knowledge"\s*\/>/);
  assert.match(access, /"\/ai\/chat"/);
  assert.match(access, /"\/ai\/knowledge"/);
  assert.match(knowledge, /const isManager = role === "manager"/);
  assert.match(knowledge, /const canEdit = role === "manager" \|\| role === "admin"/);
});


test("existing business pages remain connected to their original components and Docker paths", async () => {
  const inventory = await source("web-admin/src/app/inventories/page.tsx");
  const prices = await source("web-admin/src/app/prices/page.tsx");
  const orders = await source("web-admin/src/app/orders/page.tsx");
  const complaints = await source("web-admin/src/app/complaints/page.tsx");

  assert.match(inventory, /<InventoryManagement\s*\/>/);
  assert.match(inventory, /<DockerCommerceWorkspace kind="inventory"\s*\/>/);
  assert.match(prices, /export default PriceManagement/);
  assert.match(orders, /<OrderManagement\s*\/>/);
  assert.match(orders, /<DockerCommerceWorkspace kind="orders"\s*\/>/);
  assert.match(complaints, /export default ComplaintManagement/);
  for (const path of [
    "web-admin/src/app/ai/page.tsx",
    "web-admin/src/app/ai/alerts/page.tsx",
    "web-admin/src/app/ai/promotions/page.tsx",
    "web-admin/src/app/ai/complaints/page.tsx",
    "web-admin/src/app/ai/chat/page.tsx",
    "web-admin/src/app/ai/knowledge/page.tsx",
    "web-admin/src/app/ai/support/page.tsx",
  ]) {
    assert.match(await source(path), /export default/, `${path} remains a direct-linkable route`);
  }
});
