import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Web Client chat shares Dashboard background, width, padding, navigation and store picker', () => {
  const chat = read('web-client/frontend/ai/AiChat.tsx');
  const dashboard = read('web-client/frontend/dashboard/components/Dashboard.tsx');
  const navigation = read('web-client/frontend/dashboard/components/NavigationBar.tsx');
  for (const token of ['SCREEN_BACKGROUND_GRADIENT', 'SCREEN_MAX_WIDTH_PX', 'SCREEN_SIDE_PADDING_PX', 'SCREEN_CONTENT_PADDING_X']) {
    assert.ok(chat.includes(token), `chat must use shared ${token}`);
    assert.ok(dashboard.includes(token), `dashboard must use shared ${token}`);
  }
  assert.match(chat, /<NavigationBar\s*\/>/);
  assert.match(chat, /<StoreSelector\s*\/>/);
  assert.match(navigation, /href: "\/ai\/chat"/);
  assert.doesNotMatch(chat, /max-w-\[520px\]|min-h-\[40vh\]/);
});

test('Chat messages scroll within screen while the composer and bottom navigation remain visible', () => {
  const chat = read('web-client/frontend/ai/AiChat.tsx');
  assert.match(chat, /h-dvh/);
  assert.match(chat, /min-h-0 flex-1 overflow-y-auto/);
  assert.match(chat, /chatScrollRef/);
  assert.match(chat, /role="log"/);
  assert.match(chat, /onSubmit=/);
  assert.match(chat, /type="submit"/);
  assert.match(chat, /safe-area-inset-bottom/);
  assert.match(chat, /pendingText/);
});

test('Visual changes preserve tenant-aware chat, Hybrid RAG mode and other feature navigation', () => {
  const chat = read('web-client/frontend/ai/AiChat.tsx');
  assert.match(chat, /STORE_CHANGE_EVENT/);
  assert.match(chat, /storeEpoch/);
  assert.match(chat, /selectedStoreId\(\)/);
  assert.match(chat, /fetch\("\/api\/ai\/chat"/);
  assert.match(chat, /conversationId: conversationId \|\| undefined/);
  assert.match(chat, /hybrid_rag_llm/);
  for (const path of ['/ai/recipes', '/ai/promotions', '/support', '/profile/help']) {
    assert.ok(chat.includes(`href="${path}"`), `missing previous shortcut ${path}`);
  }
});
