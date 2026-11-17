/** Parse a manager-supplied FAQ CSV/TSV; never publish the imported material. */
export function parseKnowledgeCsv(source) {
  if (typeof source !== 'string' || BufferlessLength(source) > 512_000) throw new Error('Tệp nhập phải nhỏ hơn 500 KB.');
  const raw = source.replace(/^\uFEFF/, '');
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQuotes) {
      if (c === '"' && raw[i+1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
      continue;
    }
    if (c === '"' && cell === '') { inQuotes = true; continue; }
    if (c === delimiter) { row.push(cell); cell = ''; continue; }
    if (c === '\n') { row.push(cell.replace(/\r$/, '')); if (row.some(v=>v.trim())) rows.push(row); row = []; cell = ''; continue; }
    if (c === '"') throw new Error('CSV có dấu ngoặc kép không hợp lệ.');
    cell += c;
  }
  if (inQuotes) throw new Error('CSV có ô trích dẫn chưa đóng.');
  row.push(cell.replace(/\r$/, ''));
  if (row.some(v=>v.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('Tệp phải có hàng tiêu đề và ít nhất một câu hỏi.');
  const headers = rows.shift().map(h=>h.trim().toLowerCase());
  const qIndex = headers.indexOf('question');
  const aIndex = headers.indexOf('answer');
  const audienceIndex = headers.indexOf('audience');
  if (qIndex < 0 || aIndex < 0 || qIndex === aIndex) throw new Error('CSV phải có hai cột question và answer.');
  if (rows.length > 100) throw new Error('Mỗi lần chỉ nhập tối đa 100 tài liệu.');
  const seen = new Set();
  return rows.map((columns,index)=>{
    const question = (columns[qIndex] ?? '').trim();
    const answer = (columns[aIndex] ?? '').trim();
    if (!question || !answer) throw new Error(`Dòng ${index+2}: câu hỏi và câu trả lời không được bỏ trống.`);
    if (question.length > 300 || answer.length > 6000) throw new Error(`Dòng ${index+2}: câu hỏi hoặc câu trả lời vượt giới hạn.`);
    const normalized = question.toLocaleLowerCase('vi');
    if (seen.has(normalized)) throw new Error(`Dòng ${index+2}: câu hỏi bị trùng trong tệp.`);
    seen.add(normalized);
    const audience = audienceIndex >= 0 ? (columns[audienceIndex] ?? '').trim().toLowerCase() : undefined;
    if (audienceIndex >= 0 && !['customer','shipper','manager','admin'].includes(audience))
      throw new Error(`Dòng ${index+2}: audience phải là customer, shipper, manager hoặc admin.`);
    return audience ? { question, answer, audience } : { question, answer };
  });
}
function BufferlessLength(value) { return new TextEncoder().encode(value).byteLength; }

/** Respect the existing 32 KB JSON request limit and server's 20-item batch limit. */
export function chunkKnowledgeDrafts(items) {
  const batches = [];
  let batch = [];
  for (const item of items) {
    const maybe = [...batch, item];
    if (maybe.length > 15 || BufferlessLength(JSON.stringify({ items:maybe,storeId:'11111111-1111-4111-8111-111111111111' })) > 27_000) {
      if (!batch.length) throw new Error('Có một tài liệu quá lớn để nhập.');
      batches.push(batch);
      batch = [item];
    } else batch = maybe;
  }
  if (batch.length) batches.push(batch);
  return batches;
}
