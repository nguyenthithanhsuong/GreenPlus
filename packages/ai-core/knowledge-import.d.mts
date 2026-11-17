export type KnowledgeDraft = { question: string; answer: string; audience?: "customer"|"shipper"|"manager"|"admin" };
export function parseKnowledgeCsv(source: string): KnowledgeDraft[];
export function chunkKnowledgeDrafts(items: KnowledgeDraft[]): KnowledgeDraft[][];
